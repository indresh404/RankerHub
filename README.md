# RankerHub 🚀

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/indresh404/RankerHub/pulls)
[![GSSoC 2026](https://img.shields.io/badge/GSSoC-2026-orange?style=flat-square)](https://gssoc.girlscript.tech/)
[![NSoC 2026](https://img.shields.io/badge/NSoC-2026-blueviolet?style=flat-square)](https://nsoc.github.io/)
[![GitHub license](https://img.shields.io/github/license/indresh404/RankerHub?style=flat-square)](https://github.com/indresh404/RankerHub/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/indresh404/RankerHub?style=flat-square)](https://github.com/indresh404/RankerHub/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/indresh404/RankerHub?style=flat-square)](https://github.com/indresh404/RankerHub/issues)
[![GitHub forks](https://img.shields.io/github/forks/indresh404/RankerHub?style=flat-square)](https://github.com/indresh404/RankerHub/network/members)

RankerHub is a developer ranking and coding platform that helps students and developers track GitHub activity, coding performance, streaks, achievements, and leaderboard rankings in one place.

---

## ✨ Features

- 🔐 GitHub Authentication
- 🏆 GitHub Contribution Rankings
- 👩 RankHer – Female Developer Leaderboard
- 💻 Coding Theory + Practical Questions
- 🎖️ Badge & Achievement System
- 🔥 Daily Activity Streaks
- 🏫 College-based Rankings
- 👤 Developer Profiles
- 📊 Community Leaderboards

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Database & Auth**: Firebase Auth & Firestore Database
- **Integration**: GitHub API

---

## 📦 Installation & Local Setup

To set up RankerHub locally on your machine, follow these steps:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/indresh404/RankerHub.git
   cd RankerHub
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Firebase credentials:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

---

## 🌐 Live Demo

<p align="left">
  <a href="https://ranker-hub-xi.vercel.app/">
    <img src="https://github.com/user-attachments/assets/1fc4738f-ccd1-4a51-8b39-c6f06a36e47e" alt="RankerHub Live" width="150" style="vertical-align: middle;">
  </a>
</p>

---

## ⚠️ Troubleshooting Production Build (Firebase Config Error)

If you see errors like `Firebase config error: apiKey is missing` or `FirebaseError: Firebase: Error (auth/invalid-api-key)` in production, this is due to how Vite compiles environment variables.

### The Problem

- The `.env` file containing your keys is excluded from git (`.gitignore`).
- When the project builds on a production deployment server (such as **GitHub Actions** for Firebase Hosting), Vite cannot read the `.env` file, and compiles the bundle with `undefined` values.

### The Solution (For Firebase Hosting via GitHub Actions)

To fix this, you must feed the environment variables to the GitHub Actions build pipeline:

1. **Add Repository Secrets to GitHub**:
   - Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions**.
   - Under **Repository secrets**, click **New repository secret** and add each variable:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_MEASUREMENT_ID`

2. **Workflows Update**:
   Our deployment workflows in [.github/workflows/firebase-hosting-merge.yml](.github/workflows/firebase-hosting-merge.yml) and [.github/workflows/firebase-hosting-pull-request.yml](.github/workflows/firebase-hosting-pull-request.yml) are set up to pass these secrets into Vite during the build phase:
   ```yaml
   - run: npm ci && npm run build
     env:
       VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
       VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
       # ... and so on
   ```

---

## 🚀 Future Plans

- Real-time coding contests
- AI-powered coding insights
- Multi-language compiler support
- Advanced leaderboard algorithms
- Open-source contribution scoring

---

## 🤝 Contributing

We welcome contributions! Please check out the [Contributing Guide](CONTRIBUTING.md) for local installation instructions, git branching, and coding standards.

---

## 📄License

This project is licensed under the [MIT License](LICENSE).

---

## 👨‍💻 Author

Made with ❤️ by the RankerHub team.
