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

## GitHub OAuth Setup

RankerHub uses GitHub as its primary authentication provider. To run the app locally with full functionality (including private repo sync checks), you need to register a custom GitHub OAuth App.

### 1. Create a GitHub OAuth App

1. Go to your GitHub [Developer Settings](https://github.com/settings/developers).
2. Click **OAuth Apps** → **New OAuth App**.
3. Fill in the details:
   - **Application name**: `RankerHub Dev` (or any name you prefer)
   - **Homepage URL**: `http://localhost:5173`
   - **Application description**: (optional)
   - **Authorization callback URL**: `http://localhost:5173` (this will be updated after Firebase setup)

### 2. Configure Callback URL in Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/), select your project.
2. Navigate to **Authentication** → **Sign-in method** → **GitHub** (edit).
3. Copy the **Callback URL** shown in Firebase (looks like `https://identitytoolkit.googleapis.com/...`).
4. Go back to your GitHub OAuth App settings → paste this URL as the **Authorization callback URL**.
5. Save the GitHub OAuth App.
6. Copy the **Client ID** and generate a **Client Secret**.
7. Paste both into the Firebase GitHub provider configuration and click **Save**.

### 3. Request Private Repo Access Scope

For the private repo sync feature to work, the OAuth App needs the `repo` scope:

1. In your GitHub OAuth App settings, scroll to **Scopes**.
2. Ensure the app requests the `repo` scope (grants read access to private repositories).
3. For local development, you can test this by authorizing the app with a test repository.

> **Note**: When you first sign in with GitHub on your local instance, you'll see a consent screen showing the requested scopes. Ensure `repo` scope is listed before authorizing.

### 4. Verify the Setup

1. Start the dev server (`npm run dev`).
2. Open `http://localhost:5173` and click **Sign in with GitHub**.
3. Complete the OAuth flow — you should be redirected back to the app authenticated.
4. Navigate to the GitRank section to verify private repo data loads correctly.

---

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
