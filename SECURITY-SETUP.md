# One-time setup (needed after this update)
1. Firebase console -> Authentication -> Get started -> enable **Email/Password**.
2. Authentication -> Users -> Add user (your email + a strong password). This is your new admin login.
3. Firestore -> Rules: merge `firestore.rules` (set your email in it) and **Publish**. Keep the existing `vaults` rules.
4. Delete the old `config/admin` document (the old password hash).
5. Open admin.html and sign in with that email and password.
6. Deploy the whole folder (the new `_headers` file adds the security headers/CSP on Cloudflare Pages).
7. Recommended: move vault.html to its own Firebase project.
