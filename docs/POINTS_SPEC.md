# 🧮 RankerHub Points System & XP Formula Specification

This document outlines the mathematical formulas, milestones, and security constraints governing the accumulation of Experience Points (XP) across the RankerHub platform.

These specifications map directly to our frontend progression components and act as the source of truth for auditing our Firestore security rules.

## 1. XP Accumulation Formulas

Points are categorized by the type of platform engagement. The calculations are evaluated as follows:

### 🐙 GitPoints (GitHub Activity)

GitPoints reward consistent and impactful open-source contributions. The formula aggregates specific GitHub webhook events:
**Formula:** `GitPoints = (commits * 2) + (prs * 5) + (reviews * 10) + (githubStreak * 10)`

### 💻 CodingVerse Points (Challenges)

Users earn fixed XP bounties upon successfully passing all test cases for algorithmic challenges:

- **Easy:** +100 XP
- **Medium:** +150 XP
- **Hard:** +200 XP

### 🔥 Streak Points (Platform Engagement)

Daily active engagement is rewarded to encourage consistent learning.

- **Daily Login XP:** +10 XP per consecutive day.
- **Maximum Cap:** 100 XP maximum per streak cycle to prevent runaway inflation.

### 🤝 Referral Points

Growing the community grants a flat bounty.

- **Successful Invite:** +100 XP (awarded only after the referred user completes their first challenge or PR).

---

## 2. Security Rules & Anti-Cheat Constraints

To protect the integrity of the leaderboard and prevent point hacking, our `firestore.rules` strictly enforce limits on single-client writes.

### Write Limits & Validation

- **Maximum Delta per Request:** A single client payload cannot increase a user's total score by an unrealistic margin. For example, a single document update cannot increment the `totalXP` field by more than the maximum possible bounty (**strictly capped at +200 XP** for a Hard CodingVerse challenge).
- **Backend Authority:** Complex aggregations (like massive GitPoint dumps) are processed via secure backend Cloud Functions, bypassing client-side write access entirely.
- **Validation:** Client requests attempting to spoof an XP increment that does not match the documented formulas above will be rejected by Firestore with a `permission-denied` error.
