# Firebase Setup Guide for FootVolley TLV

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a project"
3. Enter project name: `FootVolleyTLV`
4. Click "Create project"
5. Wait for project creation to complete

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **Get started**
3. Click **Email/Password** provider
4. Enable it and click **Save**

## Step 3: Create Firestore Database

1. Go to **Firestore Database** (left sidebar)
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select region: `europe-west1` (or closest to you)
5. Click **Create**

## Step 4: Get Firebase Credentials

1. Go to **Project Settings** (gear icon, top right)
2. Select **Your apps** section
3. If no app exists, click **Web** icon (</>)
4. Register app with name: `FootVolley TLV`
5. Copy the Firebase config object
6. Fill the `.env.local` file with:

```
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx
REACT_APP_FIREBASE_PROJECT_ID=xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxx
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=xxx
```

## Step 5: Set Firestore Security Rules

1. In Firestore, go to **Rules** tab
2. Replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - all authenticated users can read profiles, but only write their own
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    
    // Games collection
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.organizerId;
      
      // Allow organizer to update everything
      allow update: if request.auth.uid == resource.data.organizerId;
      
      // Allow users to add/remove themselves from players or pendingRequests arrays
      allow update: if request.auth != null && 
        (
          // User can add/remove themselves from players
          (request.resource.data.players.hasAny([request.auth.uid]) || 
           !resource.data.players.hasAny([request.auth.uid])) ||
          // User can add themselves to pendingRequests
          (request.resource.data.pendingRequests.hasAny([request.auth.uid]) &&
           !resource.data.pendingRequests.hasAny([request.auth.uid]))
        );
    }
  }
}
```

3. Click **Publish**

## Step 6: Migrate Data to Firebase

After configuring `.env.local`, run these commands to upload existing games:

```
npm run seed-firebase
```

## Collections Structure

### users collection
```
{
  uid: string,
  email: string,
  name: string,
  level: number (1-5),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### games collection
```
{
  id: string,
  organizerId: string (uid),
  date: string,
  time: string,
  organizer: string,
  playersNeeded: number,
  currentPlayers: number,
  level: string,
  notes: string,
  coordinates: {
    lat: number,
    lng: number
  },
  players: array<uid>,
  meetingPointText: string,
  meetingPointImage: string (base64 or URL),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Testing

1. Start the development server: `npm run dev`
2. The app should load with Firebase connected
3. Try creating an account with new email
4. Create a new game
5. Check Firebase Console to see data being stored

## Troubleshooting

- **"REACT_APP_FIREBASE_PROJECT_ID is not defined"**: Make sure `.env.local` file exists and has correct values
- **"Permission denied" when creating games**: Check Firestore Security Rules
- **Can't sign in**: Verify user is created in Firebase Authentication tab
