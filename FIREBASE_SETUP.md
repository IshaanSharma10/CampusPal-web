# Firebase Setup Guide

## ⚠️ IMPORTANT: You MUST complete these steps to fix the notification error

The error "Error Loading Notifications" happens because **Firebase Firestore security rules are not deployed yet**.

## 🚀 Quick Setup (Firebase Console - Easiest Method)

### Step 1: Deploy Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **campuspal-70aff**
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab at the top
5. **Delete all existing rules** and replace with the content from `firestore.rules` file
6. Click **Publish** button

### Step 2: Create Indexes

1. Still in Firestore Database, click on the **Indexes** tab
2. Click **Add Index** and create these indexes:

**Index 1 - Notifications by recipient and creation date:**
- Collection ID: `notifications`
- Field 1: `recipientId` - Ascending
- Field 2: `createdAt` - Descending
- Query scope: Collection

**Index 2 - Friend Requests by sender and recipient:**
- Collection ID: `friendRequests`
- Field 1: `senderId` - Ascending
- Field 2: `recipientId` - Ascending
- Field 3: `status` - Ascending
- Query scope: Collection

**Index 3 - Comments by post:**
- Collection ID: `comments`
- Field 1: `postId` - Ascending
- Field 2: `createdAt` - Ascending
- Query scope: Collection

**Index 4 - Messages by chat:**
- Collection ID: `messages`
- Field 1: `chatId` - Ascending
- Field 2: `createdAt` - Descending
- Query scope: Collection

**Index 5 - Chats by participants:**
- Collection ID: `chats`
- Field 1: `participants` - Array contains
- Field 2: `createdAt` - Descending
- Query scope: Collection

3. Wait for indexes to build (usually takes a few minutes)

### Step 3: Test

1. Refresh your application
2. Try sending a friend request
3. Check the notifications page - it should work now!

---

## 🔧 Alternative: Using Firebase CLI (Advanced)

If you prefer using the command line:

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firestore in your project
```bash
firebase init firestore
```
- Select your project: **campuspal-70aff**
- When asked for rules file, press Enter to use `firestore.rules`
- When asked for indexes file, press Enter to use `firestore.indexes.json`

### 4. Deploy rules and indexes
```bash
firebase deploy --only firestore
```

This will deploy both rules and indexes automatically!

---

## 📋 Verify Setup

After deployment, check:

1. ✅ Firestore Rules are active (in Firebase Console > Firestore > Rules)
2. ✅ Indexes are built (in Firebase Console > Firestore > Indexes - status should be "Enabled")
3. ✅ No permission errors in browser console
4. ✅ Notifications load successfully

---

## 🐛 Troubleshooting

**Still getting "Error Loading Notifications"?**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors starting with "FirebaseError"
4. Common issues:
   - **"Missing or insufficient permissions"** → Rules not deployed
   - **"The query requires an index"** → Indexes not created or still building
   - **"Quota exceeded"** → Free tier limits reached

**Need Help?**

Check the browser console and share the exact error message.
