# Settings Page Update - Implementation Guide

## Overview
Enhanced the Settings page with new notification preferences management and account deletion functionality. Also added a convenient link from the Notifications page to Settings.

## Changes Made

### 1. Settings Page (`src/pages/Settings.tsx`)

#### New Imports
- `Bell`, `Trash2`, `AlertCircle` icons for UI
- `deleteUser` from Firebase auth
- `deleteDoc` from Firebase firestore
- `AlertDialog` components for confirmation dialogs
- `Switch` component for notification toggles

#### New State
- `deleteAccountDialog`: Controls delete account confirmation dialog
- `notificationSettings`: Stores user notification preferences
  - `friendRequests`: Boolean
  - `likes`: Boolean
  - `comments`: Boolean
  - `messages`: Boolean

#### New Functions

**`handleSaveNotificationSettings()`**
- Saves notification preferences to Firestore user document
- Updates under `notificationSettings` field
- Shows success/error toast notifications

**`handleDeleteAccount()`**
- Permanently deletes user data from Firestore
- Deletes Firebase authentication user
- Redirects to home page after deletion
- Handles re-authentication errors gracefully

#### New Tabs

**Notifications Tab**
- Displays 4 notification toggle switches with descriptions
- Icons and color-coded sections for each notification type:
  - 🔵 Friend Requests (Blue)
  - ❤️ Likes (Pink)
  - 💬 Comments (Green)
  - 📧 Messages (Purple)
- Save/Cancel buttons
- Info card linking to full Notifications page

**Danger Zone Tab**
- Warning banner with red styling
- Delete Account card with:
  - Clear explanation of consequences
  - Red destructive button
  - Triggers confirmation dialog

#### Delete Account Dialog
- Clear warning with red styling
- Lists all data that will be deleted:
  - Profile and personal information
  - Posts and interactions
  - Messages and chats
  - All account data
- Confirmation button with strong warning text

### 2. Notifications Page (`src/pages/Notifications.tsx`)

#### New Features
- Added Settings button in header next to "Mark all read"
- Button navigates to Settings page (Notifications tab)
- Uses Settings icon from lucide-react
- Integrated seamlessly with existing header design

## Features

### Notification Preferences
Users can control which notifications they receive:
- Toggle each notification type independently
- Visual organization with color-coded sections
- Persistent storage in user profile
- Load preferences on page load

### Account Deletion
- One-click account deletion in Danger Zone
- Confirmation dialog with detailed warning
- Deletes all associated data:
  - User profile document
  - Firebase authentication account
- Handles authentication errors
- Auto-redirects to home page

### Navigation
- Convenient Settings link from Notifications page
- Settings page tabs make it easy to find notification preferences
- Clear visual hierarchy with color-coded sections

## Data Model

Notification settings stored in Firestore:
```firestore
users/{userId} {
  notificationSettings: {
    friendRequests: true,
    likes: true,
    comments: true,
    messages: true
  }
}
```

## User Flow

### Managing Notifications
1. User navigates to Settings (via sidebar or Notifications page)
2. Clicks "Notifications" tab
3. Toggles notification types on/off
4. Clicks "Save Preferences"
5. Settings persist across sessions

### Deleting Account
1. User navigates to Settings
2. Clicks "Danger" tab
3. Clicks "Delete Account" button
4. Sees confirmation dialog
5. Confirms deletion
6. Account and all data permanently removed

## Security Considerations
- Delete account requires current authentication
- Handles re-authentication errors
- Confirmation dialog prevents accidental deletion
- Clear warning messages about data loss
- Notification settings stored with user document

## UI/UX Improvements
- Color-coded notification types for quick scanning
- Responsive design for mobile and desktop
- Clear visual hierarchy with danger zone styling
- Helpful info cards linking to full Notifications page
- Seamless navigation between pages
