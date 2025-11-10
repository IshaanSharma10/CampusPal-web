# Lost & Found Feature - Fix & Deployment Guide

## Issues Fixed

### 1. Firestore Rules Mismatch
**Problem:** The `firestore.rules` file had incorrect configuration for the Lost & Found collection
- Collection name was `lostFoundItems` but code uses `lostFound`
- Field name was `reportedBy` but code uses `reporterId`
- Event rules used `createdBy` but code uses `organizerId`

**Solution:** Updated firestore.rules to match the code:
```
match /lostFound/{itemId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && request.auth.uid == request.resource.data.reporterId;
  allow update, delete: if isAuthenticated() && request.auth.uid == resource.data.reporterId;
}
```

### 2. Better Error Handling
- Added try-catch blocks with proper error logging
- Functions now return empty arrays instead of throwing on index errors
- Better error messages in UI

## How to Deploy

### Step 1: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

Or if you have the Firebase CLI installed globally:
```bash
cd /c:/Users/Mukul Ghai/CampusPal-web
firebase deploy --only firestore:rules
```

### Step 2: Verify Collection in Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project "campuspal-70aff"
3. Go to Firestore Database
4. Check that the `lostFound` collection exists (it will be created when first item is added)

## Testing the Feature

1. Go to Lost & Found page in your app
2. Try to report a lost or found item:
   - Fill in all required fields
   - Upload an optional image
   - Click "Report Lost Item" or "Report Found Item"
3. You should see the item appear in the list
4. You should be able to:
   - View all lost items
   - View all found items
   - Contact reporters via phone
   - Mark your own items as resolved (removes from list)

## Troubleshooting

### Error: "Failed to fetch lost and found items"

**Check browser console (F12) for detailed error:**
- If you see permission denied → Rules need to be deployed
- If collection is empty → That's OK, show empty state
- If index error → Code handles this automatically

### Fix: Deploy Rules
```bash
firebase deploy --only firestore:rules
```

### Fix: Check Firestore Rules
In Firebase Console:
1. Firestore Database → Rules
2. Verify the rules match `firestore.rules` file
3. Publish any changes

## Collection Structure

**Collection:** `lostFound`

**Document fields:**
```json
{
  "title": "Black Wallet",
  "description": "Lost black leather wallet with student ID",
  "imageUrl": "https://...",
  "type": "lost",
  "category": "accessories",
  "location": "Library - 3rd Floor",
  "date": Timestamp,
  "reporterId": "user-uid",
  "reporterName": "John Doe",
  "reporterContact": "+91-9876543210",
  "resolved": false,
  "createdAt": Timestamp
}
```

## Files Modified

1. `/firestore.rules` - Fixed collection name and field names
2. `/src/lib/firebase-utils.ts` - Added better error handling
3. `/src/pages/LostFound.tsx` - Added console logging and better error messages

## Next Steps

1. Deploy the rules
2. Test creating a new lost/found item
3. Verify items appear in the list
4. Test contact reporter button
5. Test mark as resolved functionality
