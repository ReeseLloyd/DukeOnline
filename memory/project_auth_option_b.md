---
name: Auth upgrade path — Option B
description: Firebase Email Magic Link is the agreed next step if DukeOnline outgrows a small friend group
type: project
---

Current auth is username+PIN hash (Option A) — appropriate for a handful of friends, no real security.

If the game grows larger, upgrade to **Firebase Email Magic Link (passwordless)**.

**Why:** User explicitly said this is the next step if things grow beyond a few friends. It provides proper Firebase Auth UIDs, real account ownership, and cross-device persistence without needing passwords.

**How to apply:** When the user mentions adding more players, win tracking beyond friends, or any security concern — suggest Option B before other alternatives. Implementation: enable Email Link sign-in in Firebase console, use `sendSignInLinkToEmail` / `signInWithEmailLink`. Firebase handles everything; no Cloud Functions needed. No password UX for the user.
