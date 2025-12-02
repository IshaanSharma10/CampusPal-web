# Delete Chat Feature - Implementation Guide

## Overview
Added functionality to permanently delete chats from the CampusPal application. Users can now delete:
- **Direct chats**: Completely deletes the chat and all message history
- **Group chats**: Removes user from the group and deletes for them (other members unaffected)

## Changes Made

### 1. Firebase Utils (`src/lib/firebase-utils.ts`)
Added new `deleteChat()` function with the following behavior:

```typescript
export async function deleteChat(chatId: string, userId: string)
```

**Features:**
- Verifies user is a participant before allowing deletion
- For direct chats:
  - Deletes the chat document
  - Deletes all associated messages
- For group chats:
  - Removes user from participants
  - Deletes the entire chat if no participants remain
  - Cleans up unread counts

### 2. Chat Component (`src/pages/Chat.tsx`)

**Added:**
- Import of `deleteChat` function
- New state: `deleteChatDialog` (tracks delete confirmation dialog)
- New handler: `handleDeleteChat()` (executes deletion and updates UI)
- Delete option in chat header dropdown menu (for both direct and group chats)
- Delete Chat confirmation dialog with different messages for direct vs group chats

**UI Changes:**
- "Delete Chat" option appears in the MoreVertical menu (chat header)
- Direct chats show warning: "This will permanently delete the entire chat history"
- Group chats show warning: "You will leave the group, and the chat will be deleted for you"
- Red danger button styling for consistency with other destructive actions

## Usage

1. Open a chat (direct or group)
2. Click the **⋮** (More) button in the chat header
3. Select **Delete Chat**
4. Confirm the deletion in the alert dialog
5. Chat is permanently removed from your chat list

## Database Behavior

### Direct Chat Deletion
- Removes chat document from `chats` collection
- Removes all messages from `messages` collection
- No impact on other users (direct chats are between two people)

### Group Chat Deletion
- If you're the last member: Entire chat deleted with all messages
- If other members exist: You're removed, chat persists for others
- Your unread count is cleaned up
- You're removed from the participants array

## Error Handling
- Validates user is a participant before deletion
- Provides user-friendly error messages via toast notifications
- Prevents orphaned chats (deletes if no participants remain)

## Security Considerations
- Only the chat participant can delete
- For group chats, only removes current user (other members unaffected)
- Backend validation ensures proper authorization
