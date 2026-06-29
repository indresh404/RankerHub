# Firestore Database Schema & Security Rules Guide

This document provides a comprehensive overview of the Firestore database collections used in **RankerHub** and details the security rules that protect our data integrity, particularly concerning user points, onboarding state, and referral systems.

---

## 1. Database Collections Overview

RankerHub primarily uses two root-level collections to manage user profiles, points, and the referral system.

### A. `users` Collection

- **Path:** `/users/{uid}`
- **Purpose:** Stores user profiles, authentication metadata, onboarding status, social links, and the points ledger (streak, gitRank, codingVerse, and referral points).
- **Document ID:** The Firebase Authentication User ID (`uid`).

### B. `referrals` Collection

- **Path:** `/referrals/{uid}`
- **Purpose:** Acts as an index and ledger for users who have generated a referral code. It tracks who has used their code to prevent abuse and duplicate rewards.
- **Document ID:** The Firebase Authentication User ID (`uid`) of the referrer.

---

## 2. Security Rules Deep-Dive (`firestore.rules`)

Our security rules enforce strict checks to ensure data consistency, prevent arbitrary point inflation by malicious clients, and secure the referral mechanism against abuse.

### Global Helpers

- `isAuthenticated()`: Ensures the incoming request has a valid authentication token.
- `isOwner(uid)`: Ensures the authenticated user's ID matches the requested document ID.
- `isOnlyProfileUpdate()`: A specialized check allowing users to update non-critical profile fields (e.g., LinkedIn, Instagram, Discord) without triggering strict onboarding checks.

### A. Users Rules (`/users/{uid}`)

- **Read Access:** Any authenticated user can read profile data. This is necessary to populate the global leaderboard.
- **Create Access:** A user can create their own profile document, provided the `onboardingStatus` is explicitly set to `"incomplete"` or `"complete"`.

**Update Rules (The Core Logic):**

- **Profile Updates Bypass (RULE 1):** Users can freely update their profile fields and the `updatedAt` timestamp at any time, bypassing strict checks.
- **Immutable Onboarding Fields (RULE 3):** Once a user is onboarded (`onboardingStatus == "complete"`), they cannot modify critical profile metadata like gender, DOB, city, college, or createdAt.
- **Points Integrity (RULE 3):**
  - _Total Points Equation:_ `totalPoints` must always equal the sum of `gitRankPoints + codingVersePoints + streakPoints + referralPoints`.
  - _Controlled Spikes:_ Users cannot arbitrarily inflate points. Valid scenarios for points updates include:
    - Transitioning from incomplete to complete onboarding.
    - Minor incremental updates (e.g., streak login +10, codingVerse up to +200). **This is strictly capped at +200 total change per request** to accommodate Hard challenge bounties while preventing massive point inflation exploits.
    - GitRank Updates: The `gitRankPoints` must strictly align with the formula. Other points categories must remain unchanged during this specific update.
- **Referral Rewards (RULE 4 - Exploit Prevention):**
  - This rule governs how a _referred user_ updates the _referrer's_ document.
  - The referrer's `referralPoints` must exactly synchronize with the `totalEarned` counter from the `referrals` index document. `totalPoints` increments precisely by the growth in referral points.
  - **Guards:**
    - The referrer's document in the `referrals` collection must exist.
    - The referred user's `uid` _must already be present_ in the referrer's `usedBy` array (verified via a `get()` call). This confirms the code was legitimately redeemed before points are granted, closing the vulnerabilities outlined in Issue #81 and the multi-write inflation exploit from Issue #306.

### B. Referrals Rules (`/referrals/{uid}`)

- **Read Access:** Any authenticated user can read referral data.
- **Create Access:** Only the owner can create their referral index document.
- **Update Access (The Uniqueness Guard):**
  - The owner can update their document.
  - A _referred user_ can update the referrer's document to claim a referral, but with strict conditions:
    - They must append their `uid` to the `usedBy` array.
    - The `totalEarned` must increment by exactly 100.
    - **Crucial Uniqueness Check:** `!(request.auth.uid in resource.data.usedBy)` ensures a user cannot use the same referral code twice. Additionally, size growth checks guarantee only one ID is appended at a time, preventing array-stuffing exploits.

---

## 3. Global Lockdown

- **Path:** `/{document=**}`
- **Rule:** `allow read, write: if false;`
- **Purpose:** By default, all other collections in the database are completely locked down. Access must be explicitly granted.
