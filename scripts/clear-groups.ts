/**
 * Script to clear all groups from the database
 * 
 * This script uses InstantDB's database client to:
 * 1. Fetch all groups
 * 2. Delete related data (groupMembers, meetings, songShares, group songbooks)
 * 3. Delete the groups themselves
 * 
 * Usage: 
 *   npm run clear-groups
 * 
 * Make sure VITE_INSTANTDB_APP_ID is set in your .env file
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { init } from '@instantdb/admin';
import schema from '../src/instant.schema.ts';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getEnvVar(name: string): string | null {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(new RegExp(`${name}\\s*=\\s*(.+)`));
    return match ? match[1].trim() : null;
  } catch (error) {
    return null;
  }
}

const APP_ID = getEnvVar('VITE_INSTANTDB_APP_ID') || process.env.VITE_INSTANTDB_APP_ID || process.env.INSTANTDB_APP_ID;
const ADMIN_TOKEN = getEnvVar('INSTANTDB_ADMIN_TOKEN') || process.env.INSTANTDB_ADMIN_TOKEN;

if (!APP_ID) {
  console.error('Error: VITE_INSTANTDB_APP_ID must be set in .env file or environment');
  process.exit(1);
}

if (!ADMIN_TOKEN) {
  console.error('Error: INSTANTDB_ADMIN_TOKEN must be set in .env file or environment');
  console.error('\nTo get your admin token:');
  console.error('1. Go to your InstantDB dashboard: https://instantdb.com');
  console.error('2. Navigate to your app settings');
  console.error('3. Find the Admin Token section');
  console.error('4. Copy the token and add it to your .env file as: INSTANTDB_ADMIN_TOKEN=your_token_here');
  process.exit(1);
}

// Initialize database with admin token
const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema }) as any;

async function clearAllGroups() {
  try {
    console.log('Fetching all groups...');
    
    // Use admin API query for server-side queries
    const result = await db.query({
      groups: {
        $: {},
        members: {},
        meetings: {},
        songShares: {},
        songbooks: {},
      },
    });
    const data = result.data;

    const groups = data?.groups || [];
    
    if (groups.length === 0) {
      console.log('No groups found in the database.');
      return;
    }

    console.log(`Found ${groups.length} group(s) to delete.`);
    
    // Prepare all deletion transactions
    const transactions = [];
    
    for (const group of groups) {
      const groupId = group.id;
      console.log(`\nProcessing group: ${group.name || 'Unnamed'} (${groupId})`);
      
      // Delete group members
      if (group.members && group.members.length > 0) {
        console.log(`  - Deleting ${group.members.length} group member(s)`);
        group.members.forEach((member: any) => {
          transactions.push(db.tx.groupMembers[member.id].delete());
        });
      }
      
      // Delete meetings
      if (group.meetings && group.meetings.length > 0) {
        console.log(`  - Deleting ${group.meetings.length} meeting(s)`);
        for (const meeting of group.meetings) {
          // Delete meeting RSVPs
          try {
            const rsvpsResult = await db.query({
              meetingRSVPs: {
                $: { where: { meetingId: meeting.id } },
              },
            });
            if (rsvpsResult?.data?.meetingRSVPs) {
              rsvpsResult.data.meetingRSVPs.forEach((rsvp: any) => {
                transactions.push(db.tx.meetingRSVPs[rsvp.id].delete());
              });
            }
          } catch (e) {
            // If we can't query RSVPs, continue anyway
          }
          
          // Delete meeting songs
          try {
            const songsResult = await db.query({
              meetingSongs: {
                $: { where: { meetingId: meeting.id } },
              },
            });
            if (songsResult?.data?.meetingSongs) {
              songsResult.data.meetingSongs.forEach((song: any) => {
                transactions.push(db.tx.meetingSongs[song.id].delete());
              });
            }
          } catch (e) {
            // If we can't query meeting songs, continue anyway
          }
          
          // Delete the meeting
          transactions.push(db.tx.meetings[meeting.id].delete());
        }
      }
      
      // Delete song shares
      if (group.songShares && group.songShares.length > 0) {
        console.log(`  - Deleting ${group.songShares.length} song share(s)`);
        group.songShares.forEach((share: any) => {
          transactions.push(db.tx.songShares[share.id].delete());
        });
      }
      
      // Delete group songbooks
      if (group.songbooks && group.songbooks.length > 0) {
        console.log(`  - Deleting ${group.songbooks.length} group songbook(s)`);
        for (const songbook of group.songbooks) {
          // Delete songbook songs
          try {
            const songbookSongsResult = await db.query({
              songbookSongs: {
                $: { where: { songbookId: songbook.id } },
              },
            });
            if (songbookSongsResult?.data?.songbookSongs) {
              songbookSongsResult.data.songbookSongs.forEach((songbookSong: any) => {
                transactions.push(db.tx.songbookSongs[songbookSong.id].delete());
              });
            }
          } catch (e) {
            // If we can't query songbook songs, continue anyway
          }
          
          // Delete the songbook
          transactions.push(db.tx.songbooks[songbook.id].delete());
        }
      }
      
      // Delete the group itself
      transactions.push(db.tx.groups[groupId].delete());
    }
    
    if (transactions.length === 0) {
      console.log('\nNo transactions to execute.');
      return;
    }
    
    console.log(`\nExecuting ${transactions.length} deletion transaction(s)...`);
    
    // Execute all deletions in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batch = transactions.slice(i, i + BATCH_SIZE);
      await db.transact(...batch);
      console.log(`  Processed batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(transactions.length / BATCH_SIZE)}`);
    }
    
    console.log('\n✅ Successfully cleared all groups from the database!');
    
  } catch (error: any) {
    console.error('❌ Error clearing groups:', error.message || error);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure VITE_INSTANTDB_APP_ID is set correctly in .env');
    console.error('2. Check that you have proper permissions to delete groups');
    console.error('3. The InstantDB React client may not support server-side queries');
    console.error('   Consider using InstantDB dashboard or admin tools instead');
    process.exit(1);
  }
}

// Run the script
clearAllGroups();
