# Firebase Setup Guide for Projekt90

Follow these steps to connect your local development environment to a new Firebase project.

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `Projekt90`.
3. (Optional) Enable Google Analytics and click **Create project**.

## 2. Register Your Web App
1. On the Project Overview page, click the **Web icon** (`</>`) to add an app.
2. Enter an App nickname (e.g., `Projekt90 Web`).
3. Click **Register app**.
4. Firebase will show you a `firebaseConfig` object. **Copy this for later.**

## 3. Enable Required Services
You must enable the following services in the Firebase sidebar:

### A. Authentication
1. Go to **Build > Authentication**.
2. Click **Get Started**.
3. In the **Sign-in method** tab, enable **Email/Password**.

### B. Cloud Firestore
1. Go to **Build > Firestore Database**.
2. Click **Create database**.
3. Select **Start in test mode** (for initial development) and click **Next**.
4. Choose a location close to you and click **Enable**.

### C. Firebase Storage
1. Go to **Build > Storage**.
2. Click **Get Started**.
3. Click **Next** and **Done** using the default bucket settings.

## 4. Configure Your Project
You have two ways to add your credentials to the app:

### Option A: Using Environment Variables (Recommended)
Create a `.env` file in the root of your project (`/projekt90-app/.env`) and add your copied values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Option B: Direct Edit
Open `src/lib/firebase.ts` and paste the values directly into the `firebaseConfig` object.

## 5. Deployment & Security Rules
Once you are ready to move beyond "Test Mode," update your Firestore rules to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{userId} {
      // Users can only read/write their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 6. Restart the App
After adding your credentials, restart your development server:
```bash
npm run dev
```
