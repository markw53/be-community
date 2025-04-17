## Firebase Configuration

For development:
1. Download your Firebase service account JSON file from the Firebase console
2. Place it in the `config` directory as `firebase-service-account.json`
3. This file is gitignored and should never be committed to the repository

For production:
Set the following environment variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Alternatively, you can set `SKIP_FIREBASE=true` and `USE_JWT_AUTH=true` to use JWT authentication instead of Firebase.