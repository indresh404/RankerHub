# Firestore Security Rules & Indexes Documentation

This document outlines the security rules implemented in `firestore.rules` and the composite index setup in `firestore.indexes.json` for RankerHub.

## Whitelisted Profile Fields

To allow users to update their basic profile information without running into strict point-change or onboarding-lock constraints, the `isOnlyProfileUpdate()` helper function whitelists specific fields.

An update is allowed **anytime** as long as it **only** touches these fields:
- `name`
- `avatar`
- `gender`
- `dob`
- `city`
- `college`
- `linkedinUrl`
- `instagramHandle`
- `discordUsername`
- `updatedAt`

## Points Change Limitations & Streak Protections

### Streak Updates
The `isStreakUpdate()` helper ensures that daily check-ins cannot be exploited.
- **Allowed Fields:** `streak`, `longestStreak`, `lastLogin`, `points`
- **Validation:** 
  - `longestStreak` must be monotonically non-decreasing (cannot go down).
  - `streak` must be `>= 0`.
  - `points.streakPoints` must not decrease.

### General Point Spikes (Rule 3)
To prevent users from maliciously granting themselves unlimited points, the rules enforce strict boundaries on point adjustments during profile writes:
- **Total Points Cap:** `totalPoints` can increase by a maximum of `100` points in a single standard client write (accommodating normal actions like streak logins or minor challenge completions).
- **GitRank Formula:** If GitHub stats are updated, `gitRankPoints` must equal:
  `(commits * 2) + (prs * 5) + (reviews * 10)`
  During this sync, all other point categories (`codingVersePoints`, `streakPoints`, `referralPoints`) must remain unchanged.

### Referral System Protections
Referral points updates are strictly guarded to prevent farming exploits (e.g., Issue #81):
- A referred user can atomically add exactly `100` points to a referrer's `referralPoints` and `totalPoints`.
- The caller must prove they actually redeemed the code by being listed in the referrer's `usedBy` array (`request.auth.uid in get(...).data.usedBy`).
- To prevent duplicate entries in the `referrals` collection, a user cannot add their UID to the `usedBy` array if they are already in it (`!(request.auth.uid in resource.data.usedBy)`). The array size must grow by exactly 1, and the caller's ID must be at the very end of the array.

## Onboarding Immutability

Once a user's `onboardingStatus` is set to `"complete"`, certain core fields cannot be altered through standard restricted updates (though they can still be altered via the whitelisted profile update rule mentioned above):
- `gender`
- `dob`
- `city`
- `college`
- `createdAt`

## Composite Index Setup

To support efficient leaderboard queries and sorting, the following composite indexes are configured for the `users` collection in `firestore.indexes.json`. All queries first filter by `onboardingStatus` (ASCENDING) to only show fully onboarded users.

1. **Global GitRank Leaderboard:**
   - `onboardingStatus` (ASC)
   - `points.gitRankPoints` (DESC)
2. **Language-Specific GitRank Leaderboard:**
   - `onboardingStatus` (ASC)
   - `githubStats.primaryLanguage` (ASC)
   - `points.gitRankPoints` (DESC)
3. **Gender-Specific Total Points Leaderboard:**
   - `onboardingStatus` (ASC)
   - `gender` (ASC)
   - `points.totalPoints` (DESC)
4. **CodingVerse Leaderboard:**
   - `onboardingStatus` (ASC)
   - `points.codingVersePoints` (DESC)
