/**
 * Group management utilities
 * 
 * These functions handle group-related operations that may trigger song copying
 * when users lose access to songs in their private songbooks.
 * 
 * Note: These functions work with data that has already been queried using hooks.
 * The calling code (components) should query the necessary data first.
 */

import { db } from '../db/schema';
import { deleteGroupMembership, removeSongFromGroup } from '../db/mutations';
import {
  copySongsForPrivateSongbooks,
  prepareSongbookEntryUpdates,
} from './song-copy-helpers';

/**
 * Handle user leaving a group (voluntarily or removed)
 * Copies songs from private songbooks that contain songs from the group
 * 
 * @param {string} userId - User ID leaving the group
 * @param {string} groupId - Group ID being left
 * @param {string} membershipId - Group membership ID to delete
 * @param {Array} privateSongbooks - User's private songbooks with songbookSongs loaded
 * @param {Array} groupSongs - Songs shared with the group (from songShares)
 * @param {Array} existingCopies - Songs user already has copies of
 * @returns {Promise<Object>} { transactions: Array, notifications: Array }
 */
export async function handleUserLeavingGroup(
  userId,
  groupId,
  membershipId,
  privateSongbooks,
  groupSongs,
  existingCopies = []
) {
  if (!userId || !groupId || !privateSongbooks || !groupSongs) {
    return { transactions: [], notifications: [] };
  }

  // Get song IDs from the group
  const groupSongIds = groupSongs.map(ss => ss.song?.id).filter(Boolean);
  const groupSongObjects = groupSongs.map(ss => ss.song).filter(Boolean);

  if (groupSongIds.length === 0) {
    // No songs to copy, just delete the membership
    return {
      transactions: membershipId ? [deleteGroupMembership(membershipId)] : [],
      notifications: [],
    };
  }

  // Copy songs from private songbooks
  const { copiedSongs, notifications, transactions: copyTransactions } =
    await copySongsForPrivateSongbooks(
      userId,
      privateSongbooks,
      groupSongObjects,
      existingCopies
    );

  // Wait for copy transactions to complete, then get the new song IDs
  // Note: In InstantDB, we'll need to query for the new IDs after transactions
  // For now, we'll return the transactions and let the caller handle ID resolution

  // Prepare updates to songbook entries
  const copyMap = new Map(
    copiedSongs
      .filter(cs => cs.copySongId)
      .map(cs => [cs.originalSongId, cs.copySongId])
  );

  // Get all songbookSongs that need updating
  const songbookSongsToUpdate = [];
  for (const songbook of privateSongbooks) {
    const songbookSongs = songbook.songbookSongs || [];
    for (const ss of songbookSongs) {
      if (ss.song && groupSongIds.includes(ss.song.id) && copyMap.has(ss.song.id)) {
        songbookSongsToUpdate.push(ss);
      }
    }
  }

  const updateTransactions = prepareSongbookEntryUpdates(
    db,
    songbookSongsToUpdate,
    copyMap
  );

  // Combine all transactions
  const allTransactions = [
    ...copyTransactions,
    ...updateTransactions,
    // Delete membership will be handled separately after copies are made
  ];

  // Add membership deletion to transactions if provided
  if (membershipId) {
    allTransactions.push(deleteGroupMembership(membershipId));
  }

  return {
    transactions: allTransactions,
    notifications,
  };
}

/**
 * Handle admin removing a song from group library
 * Copies songs from private songbooks for all affected users
 * 
 * @param {string} shareId - Song share ID to remove
 * @param {string} groupId - Group ID
 * @param {Array} affectedUsers - Array of { userId, privateSongbooks, existingCopies }
 * @param {Object} song - The song being removed
 * @returns {Promise<Object>} { transactions: Array, userNotifications: Map }
 */
export async function handleSongRemovedFromGroup(
  shareId,
  groupId,
  affectedUsers,
  song
) {
  if (!shareId || !groupId || !song || !affectedUsers || affectedUsers.length === 0) {
    return { transactions: [], userNotifications: new Map() };
  }

  const allTransactions = [];
  const userNotifications = new Map(); // userId -> notifications array

  // Process each affected user
  for (const { userId, privateSongbooks, existingCopies = [] } of affectedUsers) {
    // Copy songs from their private songbooks
    const { copiedSongs, notifications, transactions: copyTransactions } =
      await copySongsForPrivateSongbooks(
        userId,
        privateSongbooks,
        [song],
        existingCopies
      );

    allTransactions.push(...copyTransactions);

    // Prepare updates to songbook entries
    const copyMap = new Map(
      copiedSongs
        .filter(cs => cs.copySongId)
        .map(cs => [cs.originalSongId, cs.copySongId])
    );

    // Get songbookSongs that need updating
    const songbookSongsToUpdate = [];
    for (const songbook of privateSongbooks) {
      const songbookSongs = songbook.songbookSongs || [];
      for (const ss of songbookSongs) {
        if (ss.song && ss.song.id === song.id && copyMap.has(ss.song.id)) {
          songbookSongsToUpdate.push(ss);
        }
      }
    }

    const updateTransactions = prepareSongbookEntryUpdates(
      db,
      songbookSongsToUpdate,
      copyMap
    );

    allTransactions.push(...updateTransactions);
    userNotifications.set(userId, notifications);
  }

  // Add transaction to remove the song share
  allTransactions.push(removeSongFromGroup(shareId));

  return {
    transactions: allTransactions,
    userNotifications,
  };
}

/**
 * Check if a user is an admin of a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @param {Object} group - Group object (with createdBy field)
 * @param {Array} memberships - Array of groupMembers objects
 * @returns {boolean} True if user is admin
 */
export function checkIfUserIsAdmin(groupId, userId, group, memberships = []) {
  if (!groupId || !userId || !group) {
    return false;
  }

  // User is admin if they created the group
  if (group.createdBy === userId) {
    return true;
  }

  // Or if they have an approved membership with admin role
  const membership = memberships.find(
    m => m.groupId === groupId && m.userId === userId && m.status === 'approved'
  );
  return membership?.role === 'admin';
}

/**
 * Check if a user is a member of a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @param {Array} memberships - Array of groupMembers objects
 * @returns {boolean} True if user is an approved member
 */
export function checkIfUserIsMember(groupId, userId, memberships = []) {
  if (!groupId || !userId) {
    return false;
  }

  const membership = memberships.find(
    m => m.groupId === groupId && m.userId === userId && m.status === 'approved'
  );
  return !!membership;
}

/**
 * Get user's role in a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @param {Object} group - Group object (with createdBy field)
 * @param {Array} memberships - Array of groupMembers objects
 * @returns {string} 'admin', 'member', 'pending', or 'none'
 */
export function getUserRoleInGroup(groupId, userId, group, memberships = []) {
  if (!groupId || !userId) {
    return 'none';
  }

  // Check if user created the group
  if (group?.createdBy === userId) {
    return 'admin';
  }

  // Find membership
  const membership = memberships.find(
    m => m.groupId === groupId && m.userId === userId
  );

  if (!membership) {
    return 'none';
  }

  if (membership.status === 'pending') {
    return 'pending';
  }

  if (membership.status === 'approved') {
    return membership.role === 'admin' ? 'admin' : 'member';
  }

  return 'none';
}

