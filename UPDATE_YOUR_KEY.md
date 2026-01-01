# 🚨 Action Required: Update Your API Key

The application is currently using the **leaked/revoked** API key in the `.env` file. This is why you are seeing the `invalid-api-key` error.

## Steps to Fix:

1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Find the API Key for `HappyApp`.
3. If you haven't already, **Regenerate** the key (to ensure the leaked one is dead).
4. Copy the **NEW** key (it starts with `AIza...`).
5. Open the `.env` file in this project (it's in the root folder).
6. Replace the value of `EXPO_PUBLIC_FIREBASE_API_KEY` with your NEW key.
   
   Example change in `.env`:
   ```bash
   # OLD (Revoked)
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBPZnenblzrBWYvXsyPyg5A72MwyV_PuxY
   
   # NEW (Paste yours)
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...YourNewKey...
   ```
7. Save the file.
8. Stop the server (Ctrl+C).
9. Run `npx expo start --clear` again.

Once you do this, the errors will stop!
