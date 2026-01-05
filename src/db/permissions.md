# InstantDB Permissions Reference

This file contains the permission rules that should be configured in your InstantDB dashboard.

## Note
InstantDB permissions are typically configured in the dashboard UI, not in code. This file serves as a reference for what permissions should be set up.

## Simplified Permissions Model

The permissions model has been simplified to prioritize ease of use:
- Songs are **private by default** (only creator can see)
- Songs can be **shared with groups** (all group members can see)
- Songbooks are either **private** (creator only) or **group** (all group members)
- When users lose access to songs in private songbooks, songs are **automatically copied**

## Permission Rules

### Users
- **View**: Any authenticated user can view user profiles
- **Update**: Users can only update their own profile

### Groups
- **Create**: Any authenticated user can create a group
- **View**: Users can view groups they belong to (filtered in queries)
- **Update**: Only the group creator (admin) can update group details

### Group Members
- **Create**: Any authenticated user can request to join a group
- **View**: Users can see their own memberships; group creators can see all members
- **Update**: Only group creators can approve/change member status
- **Delete**: Group creators can remove members; users can leave voluntarily

### Songs
- **Create**: Any authenticated user can create songs (private by default)
- **View**: Users can view songs they created OR songs shared with their groups (filtered in queries)
- **Update**: Users can only update songs they created
- **Delete**: Users can only delete songs they created
- **Note**: Songs have an optional `parentSongId` field to track copies

### Song Shares
- **Create**: Group members can share their songs with groups they belong to
- **View**: Group members can see shares for their groups
- **Delete**: Only group admins (group creators) can remove songs from group library

### Songbooks
- **Create**: Any authenticated user can create songbooks
- **View**: 
  - Private songbooks: Only creator can view
  - Group songbooks: All group members can view (filtered in queries)
- **Update**: Users can only update their own songbooks
- **Delete**: Users can only delete their own songbooks

### Songbook Songs
- **Create**: Users can add songs they have access to
  - Private songbooks: Can add any accessible song
  - Group songbooks: Can only add songs from that group's library
- **View**: Filtered by songbook access permissions
- **Update/Delete**: Same permissions as parent songbook

### Meetings
- **Create**: Only group admins can create meetings
- **View**: Group members can view meetings for their groups
- **Update**: Only group admins can update meetings
- **Delete**: Only group admins can delete meetings

### Meeting RSVPs
- **Create**: Group members can RSVP to meetings in their groups
- **View**: Group members can view RSVPs for their group meetings
- **Update**: Users can only update their own RSVPs
- **Delete**: Users can only delete their own RSVPs

### Chords
- **View**: All authenticated users can view chords
- **Create/Update/Delete**: System-managed (no user permissions)

### Notifications
- **Create**: System can create notifications for users
- **View**: Users can only view their own notifications
- **Update**: Users can mark their own notifications as read
- **Delete**: Users can delete their own notifications

## Special Behaviors

### Song Copying
When a user loses access to a song (e.g., leaves a group or admin removes song from group):
1. System automatically finds all private songbooks containing that song
2. Creates a copy of the song owned by the user
3. Updates songbook entries to use the copy instead of the original
4. Creates a notification informing the user

### Group Songbooks
- Can only contain songs from that group's library
- Validation happens when adding songs (prevents adding songs from other groups)
- All group members can view and use the songbook

### Leaving Groups
When a user leaves a group:
1. They immediately lose access to all songs in that group's library
2. Songs in their private songbooks are automatically copied
3. Group songbooks become inaccessible
4. User is notified about copied songs

## Implementation Notes

1. Many permission checks are handled at the query level (filtering results)
2. Some permissions require checking relationships (e.g., "is user an admin of this group?")
3. Song copying logic is in `src/utils/song-copy-helpers.js`
4. Group management logic is in `src/utils/group-management.js`
5. Notifications are created automatically when songs are copied

See `src/utils/deletion-helpers.js` for deletion validation logic.

