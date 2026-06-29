# Contributing to RankerHub 🚀

First off, thank you for taking the time to contribute! Contributions make the open-source community an amazing place to learn, inspire, and create. Any contribution you make to RankerHub is **greatly appreciated**.

This project is part of open-source programs like **NSoC 2026** (Nexus Summer of Code). Please follow the guidelines below to ensure a smooth contribution process.

---

## Code of Conduct

Please maintain a respectful, welcoming, and inclusive environment. Be helpful to other contributors and follow standard open-source collaboration practices. Review our full [Code of Conduct](CODE_OF_CONDUCT.md) for more details.

---

## Getting Started

### 1. Prerequisites

Ensure you have the following installed on your local machine:

- [Node.js](https://nodejs.org/) (v20.0.0 or higher recommended)
- [Git](https://git-scm.com/)

### 2. Fork & Clone

1. Fork the [RankerHub Repository](https://github.com/indresh404/RankerHub) to your own GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/RankerHub.git
   cd RankerHub
   ```

### 3. Install Dependencies

Run the following command to install the project dependencies:

```bash
npm install
```

### 4. Setup Environment Variables

1. Copy the `.env.example` file to create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and fill in your Firebase configuration keys (see the [Firebase Setup](#firebase-setup) below).

### 5. Run the Project

Start the local development server:

```bash
npm run dev
```

The application will be running locally at `http://localhost:5173`.

---

## Firebase Setup

To get your own Firebase credentials for local development:

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project (e.g., `rankerhub-dev`).
3. Add a **Web App** to your project.
4. Copy the `firebaseConfig` object values and paste them into your `.env` file:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
5. Enable **GitHub Provider** in Firebase Authentication:
   - Go to Authentication -> Sign-in method -> Add new provider -> GitHub.
   - Register a new OAuth App in your GitHub Developer Settings, configure the callback URL, and paste the Client ID and Client Secret into the Firebase console.
6. Enable **Cloud Firestore** and set up your security rules.

---

## Local Firebase Emulator Setup

Use the Firebase Emulator Suite when you want to test Auth and Firestore locally without writing to a live Firebase project or consuming cloud quota.

### 1. Install the Firebase CLI

Install the CLI globally or run it through `npx`:

```bash
npm install -g firebase-tools
```

You also need Java 11 or later because the Firestore emulator runs on the JVM.

### 2. Prepare local environment values

Copy `.env.example` as usual:

```bash
cp .env.example .env
```

Keep the normal `VITE_FIREBASE_*` web app values populated so the Firebase SDK can initialize, then enable the emulator switches:

```bash
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost
VITE_FIREBASE_AUTH_EMULATOR_PORT=9099
VITE_FIRESTORE_EMULATOR_HOST=localhost
VITE_FIRESTORE_EMULATOR_PORT=8080
```

The local app reads these values in `src/lib/firebase.js` and connects Firebase Auth and Firestore to the emulator endpoints only when `VITE_USE_FIREBASE_EMULATORS=true`.

### 3. Start Auth and Firestore emulators

From the repository root, run:

```bash
firebase emulators:start --only auth,firestore
```

The default local services are:

- Auth emulator: `http://localhost:9099`
- Firestore emulator: `localhost:8080`
- Emulator UI: `http://localhost:4000`

If another process already uses one of these ports, change the port in your emulator configuration and mirror the change in `.env`.

### 4. Run RankerHub against the emulators

In a second terminal, start the Vite dev server:

```bash
npm run dev
```

Open `http://localhost:5173`. New test users and Firestore documents created while the emulator switch is enabled stay in the local Emulator Suite instead of the live Firebase project.

### 5. Reset and troubleshoot local data

- Stop the emulator process to clear in-memory data, or use the Emulator UI to inspect and delete Auth users and Firestore documents.
- If sign-in still reaches the live Firebase project, confirm `VITE_USE_FIREBASE_EMULATORS=true` and restart `npm run dev`; Vite only reads `.env` at server startup.
- If Firestore requests fail with permission errors, verify `firestore.rules` is loaded by `firebase.json` and restart the emulators.
- Do not commit real Firebase credentials or emulator test data.

---

## Git Workflow & Branching Conventions

To keep the repository history clean, please follow these branching and commit message conventions:

### Branch Naming

Create a new branch from `main` before starting your work:

- `feat/feature-name` – for new features
- `fix/bug-name` – for bug fixes
- `docs/doc-updates` – for documentation changes
- `refactor/refactored-code` – for code restructuring without changing behavior
- `chore/task-name` – for maintenance tasks or package upgrades

Example:

```bash
git checkout -b feat/user-leaderboard
```

### Commit Messages (Semantic Commits)

Write clear and descriptive commit messages following the semantic commit pattern:

- `feat: add female developer ranking page`
- `fix: resolve auth validation issue`
- `docs: update setup steps in README`
- `style: fix button alignment on dashboard`
- `refactor: clean up firebase initialization code`

---

## How to Contribute (NSoC Rules)

1. **Find an Issue**: Search the [Issues](https://github.com/indresh404/RankerHub/issues) tab for open issues.
2. **Request Assignment**: Comment on the issue stating that you'd like to work on it. Wait for a project maintainer to assign it to you before starting work.
   - Please do not work on issues that are already assigned to someone else.
   - All PRs submitted without an assigned issue will not be merged.
3. **Submit a Pull Request**:
   - Once your changes are complete, commit and push them to your fork.
   - Go to the original RankerHub repository and click **New Pull Request**.
   - Fill out the PR template completely: explain what changes you made and link the issue it resolves (e.g. `Closes #12`).
   - Ensure there are no merge conflicts and that your build passes.
   - Be patient! Maintainers will review and merge your PR.

Thank you for contributing to RankerHub! 🌟
