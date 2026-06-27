# RankerHub — Unified Developer Ranking Platform

RankerHub is a community-driven developer platform that tracks a student's activity **across all major coding and open-source platforms** — combining everything into one generalized score so no effort ever goes unnoticed. Whether you grind LeetCode, push code on GitHub, compete on Codeforces, or complete courses and hackathons — RankerHub sees it all and gives you the credit you deserve.

> [!NOTE]
> This project is proudly part of **NSoC 2026 (Nexus Summer of Code)**. 🚀

---

## 📌 The Problem We Solve

Students spread their activity across many platforms — some build projects on GitHub, some solve DSA on LeetCode, some compete on Codeforces, some earn certifications. No single platform captures the full picture, so effort feels invisible. **RankerHub unifies everything into one score, one profile, one leaderboard.**

> **"Your entire coding life. One score. One profile."**

---

## 🌟 Core Features

### 🔐 1. GitHub OAuth & Advanced Onboarding

- **Secure Login**: Passwordless auth using Firebase Authentication linked to GitHub OAuth.
- **Onboarding Wizard**: Captures developer details (college, gender, social handles, and all platform usernames) on first login.
- **Platform Username Linking**: Connect GitHub, LeetCode, Codeforces, GFG, and HackerRank handles in one place.
- **Real-time Sync**: Repositories, commits, and public profile details stay updated automatically.

---

### 🏆 2. Multi-Platform Activity Tracking

RankerHub pulls your activity from across the internet and unifies it:

#### GitHub ✅ (Auto-tracked via Official API)

- Commits, Pull Requests, Code Reviews
- Public Repositories, Stars received
- GitHub contribution streak
- Followers

#### LeetCode ✅ (Auto-tracked via Public GraphQL)

- Problems solved (Easy / Medium / Hard breakdown)
- Contest rating and contest history
- Global ranking

#### Codeforces ✅ (Auto-tracked via Official API)

- Current rating and max rating
- Contest participation history
- Problem submissions and verdicts
- Rank title (Pupil, Specialist, Expert, etc.)

#### GeeksforGeeks ⚠️ (Auto-tracked via Public Profile)

- Coding score
- Problems solved
- Monthly score
- Institution rank
- Contest participation

#### HackerRank ⚠️ (Auto-tracked via Public Endpoints)

- Badges earned per domain
- Skill certifications
- Stars per skill track (Problem Solving, Python, SQL, etc.)

> ⚠️ GFG and HackerRank use public profile parsing. Data is reliable but may occasionally need re-sync if those platforms update their structure.

---

### 🧮 3. Unified RankerHub Score

All platform activity rolls up into one transparent score:

```text
RankerHub Score =

  Open Source Score       ← GitHub activity
+ DSA Score               ← LeetCode + GFG problems
+ Contest Score           ← Codeforces rating + contests
+ Certification Score     ← HackerRank badges & certs
+ Achievement Score       ← Hackathons + Courses (self-reported)
+ CodingVerse Score       ← In-platform challenges
```

**GitPoints Formula (GitHub):**
$$\text{GitPoints} = (\text{Commits} \times 2) + (\text{PRs} \times 5) + (\text{Reviews} \times 10) + (\text{GitHub Streak} \times 10)$$

**CodingVerse XP:**

| Action | Points |
| --- | --- |
| Easy Solve | +100 XP |
| Medium Solve | +150 XP |
| Hard Solve | +200 XP |
| Streak Login (per day) | +10 XP (max 100 XP) |
| Approved Community Question | +30 XP |
| Successful Referral | +100 XP |

**Hackathon & Course XP:**

| Achievement | Points |
| --- | --- |
| Hackathon Participated | +50 XP |
| Hackathon Finalist | +150 XP |
| Hackathon Winner | +300 XP |
| Course Completion Certificate | +75 XP |
| Premium Certification (Coursera / NPTEL) | +150 XP |
| Specialization / Nanodegree | +300 XP |

---

### 🏅 4. GitRank — Global Leaderboard

- Ranks users based on their unified RankerHub score.
- **Sub-Leaderboards:**
  - Top 10 Developers
  - Top Committers
  - Most Repositories
  - Rising Developers (biggest weekly gainers)
  - Best DSA Solvers
  - Top Contest Performers

---

### 🏫 5. College vs College Leaderboard

- Every user represents their college.
- Colleges are ranked by the combined RankerHub scores of all their students.
- Massive engagement driver — compete for your institution.

```text
🏆 College Rankings — Maharashtra
1. VJTI Mumbai        — 84,200 pts
2. COEP Pune          — 79,100 pts
3. SPIT Mumbai        — 71,400 pts
```

---

### 👩‍💻 6. RankHer Leaderboard

- A dedicated space celebrating **female developer achievements**.
- Gender-filtered GitRank, DSA leaderboard, and contest rankings.
- Exclusive RankHer badges and achievements to promote diversity in tech.

---

### 🌌 7. CodingVerse — Interactive Challenges

- **Theory Challenges**: MCQ and text-input questions covering:
  - Object-Oriented Programming (OOP)
  - Database Management Systems (DBMS)
  - Operating Systems (OS)
  - Data Structures & Algorithms (DSA)
- **Practical Challenges**: Code-related problem submissions.
- **Community Question Creator**: Users can submit custom questions (Title, Description, Difficulty, Expected Answer, Points) to grow the question bank.

---

### 🦉 8. CodingOwl — AI Activity Assistant

- Meet **Oliver the Owl**: an AI-powered assistant that:
  - Tracks and summarizes your activity across all platforms
  - Shows your ranking trends and score breakdowns
  - Guides you through tough CS concepts and code explanations
  - Verifies uploaded certificates using AI-OCR for instant XP rewards
  - Answers general queries about your profile and progress

---

### 🎖️ 9. Hackathon & Course Activity (Self-Reported + AI Verified)

Students self-report their achievements with proof:

```text
User submits:
→ Hackathon name + platform (Unstop / Devfolio / Devpost)
→ Result: Participated / Finalist / Winner
→ Upload certificate or proof link

CodingOwl AI reads the certificate:
→ Extracts event name, date, result
→ Auto-awards correct XP tier instantly
```

Certificate stored permanently on your RankerHub profile as verified proof — more trustworthy than a plain LinkedIn entry.

---

### 💚 10. Repo Health Analyzer

- Scans any public GitHub repository for quality metrics:
  - README existence and quality
  - LICENSE file
  - `.gitignore`
  - CI/CD workflows
  - Unit tests
  - Descriptive commit messages
- **Gamified Reward**: Earn XP by auditing repositories.

---

### 🎨 11. Developer Card Builder

- Dynamic HTML5/SVG profile card generator.
- Showcases your RankerHub score, platform stats, streaks, and badges.
- One-click download and share to GitHub profile, LinkedIn, or Twitter.
- Each share is a verified snapshot of your real activity — not self-claimed numbers.

---

### 📅 12. Monthly Dev Digest

Auto-generated monthly summary shareable on LinkedIn / Twitter:

```text
June 2026 — My Dev Stats
🔨 23 commits across 4 repos
🧩 31 LeetCode problems solved
🏆 Codeforces: +87 rating
📈 RankerHub rank: #234 → #189
🎓 1 course completed
```

One-click share. Every post is free marketing for RankerHub.

---

### 👥 13. Matchmaker & Friends

- **Find Coding Buddies**: Match with developers who share your skills, availability, and interests.
- **Follow System**: Track classmates and friends — monitor their streaks and leaderboard movement.

---

### 🎯 14. Streak & Achievement System

- **Daily Streaks**: Encourages consistent activity across platforms.
- **Badges & Accomplishments**: Unlock standard and rare achievements:
  - _First Solve_, _Consistency King_, _Java Master_
  - _Open Source Starter_, _Contest Warrior_
  - _RankHer Top 10_, _Hackathon Champion_
  - _Certified Pro_ (for verified certifications)

---

## 🗄️ Database Schema

### `users` Collection (`/users/{uid}`)

```json
{
  "uid": "Firebase Auth UID",
  "githubUsername": "octocat",
  "leetcodeUsername": "octocat_lc",
  "codeforcesHandle": "octocat_cf",
  "gfgUsername": "octocat_gfg",
  "hackerrankUsername": "octocat_hr",
  "avatar": "https://github.com/images/...",
  "college": "Example University",
  "gender": "female/male/other",
  "onboardingStatus": "complete",
  "gitRankPoints": 250,
  "leetcodePoints": 400,
  "codeforcesPoints": 350,
  "gfgPoints": 150,
  "hackerrankPoints": 100,
  "codingVersePoints": 350,
  "hackathonPoints": 300,
  "coursePoints": 225,
  "streakPoints": 40,
  "referralPoints": 100,
  "totalPoints": 2265,
  "streak": 5,
  "badges": ["first_solve", "rankher_top_10", "hackathon_champion"],
  "college_rank": 4,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### `referrals` Collection (`/referrals/{uid}`)

```json
{
  "uid": "Referrer User UID",
  "referralCode": "REF-XYZ123",
  "usedBy": ["referred_user_uid_1", "referred_user_uid_2"],
  "totalEarned": 200
}
```

### `certificates` Collection (`/certificates/{docId}`)

```json
{
  "uid": "User UID",
  "type": "hackathon | course | certification",
  "title": "Machine Learning Specialization",
  "platform": "Coursera",
  "result": "completed | finalist | winner",
  "xpAwarded": 150,
  "certificateUrl": "https://storage/...",
  "verifiedByAI": true,
  "verifiedAt": "Timestamp"
}
```

---

## 🏗️ Technical Stack

| Layer        | Technology                                                                          |
| ------------ | ----------------------------------------------------------------------------------- |
| **Frontend** | React + Vite, Tailwind CSS, React Router, Framer Motion, Lucide Icons, Swiper       |
| **Backend**  | Serverless — Google Firebase                                                        |
| **Auth**     | Firebase Authentication + GitHub OAuth                                              |
| **Database** | Cloud Firestore (real-time NoSQL)                                                   |
| **Hosting**  | Firebase Hosting                                                                    |
| **AI**       | Firebase AI Logic (Gemini API) — CodingOwl + Certificate OCR                        |
| **APIs**     | GitHub REST API, Codeforces API, LeetCode GraphQL, GFG & HackerRank public profiles |

---

## ⚙️ Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.0.0 or higher)
- [Git](https://git-scm.com/)

### Clone & Install

```bash
git clone https://github.com/indresh404/RankerHub.git
cd RankerHub
npm install
```

### Configure Environment Variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Run

```bash
npm run dev       # Local development
npm run test      # Unit tests
npm run lint      # ESLint checks
npm run build     # Production build
```

---

## 👥 Project Maintainer

- **Maintainer**: [@indresh404](https://github.com/indresh404)
- **Program**: Proudly built for **Nexus Summer of Code 2026 (NSoC 2026)**
