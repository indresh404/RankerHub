# 🛠️ RankerHub Developer Environment Setup Guide

Welcome to the RankerHub developer documentation! This guide will help you set up the project locally on your machine, connect it to your own Firebase development environment, and start contributing.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher recommended)
- **Git**
- **Google/Firebase Account** (for local database testing)
- **GitHub Account** (to test OAuth login)

---

## 🚀 Step 1: Clone and Install Dependencies

1. Fork the repository on GitHub.
1. Clone your forked repository:

```bash
git clone [https://github.com/](https://github.com/)<your-username>/RankerHub.git
cd RankerHub
Install the required dependencies:

Bash
npm install
🔥 Step 2: Firebase Project Provisioning
To prevent testing against the production database, create your own Firebase project for local development.

Create a Firebase Project
Open the Firebase Console.

Click Add Project.

Name it something like rankerhub-dev.

Complete the setup process.

Configure Firestore
Navigate to Build → Firestore Database.

Click Create Database.

Select Start in Test Mode.

Configure Authentication
Navigate to Build → Authentication.

Click Get Started.

Enable the GitHub sign-in provider.

Note: You will need to create a GitHub OAuth App in GitHub Developer Settings and provide the generated Client ID and Client Secret.

Create a Web App
Open Project Settings (⚙️ icon).

Under General, scroll down to Your Apps.

Click Add App → Web App.

Copy the Firebase configuration values.

🔑 Step 3: Environment Variables
Create a .env file in the project root and add your Firebase configuration:

Code snippet
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
⚠️ Important: Never commit your .env file. It is already included in .gitignore.

📦 Step 4: Firebase CLI and Database Setup
Deploy the required Firestore Security Rules and Indexes so leaderboard queries function correctly.

Install Firebase CLI
Bash
npm install -g firebase-tools
Authenticate with Firebase
Bash
firebase login
Link Your Firebase Project
Bash
firebase use --add
Select your rankerhub-dev project when prompted.

Deploy Firestore Rules and Indexes
Bash
firebase deploy --only firestore:rules,firestore:indexes
Note: Firestore index creation may take several minutes to complete.

🗄️ Step 5: Local Database Emulator Setup
To avoid working directly against a live database, use the Firestore Emulator.

Start the Firestore Emulator
Bash
firebase emulators:start --only firestore
Seed Development Data
Open a new terminal window and run:

Bash
npm run seed
This populates the emulator with mock user profiles and sample leaderboard data for local development.

💻 Step 6: Run the Development Server
Start the Vite development server:

Bash
npm run dev
Open your browser and navigate to:

Plaintext
http://localhost:5173
You can now log in using GitHub authentication. Your first developer profile will be automatically created in the local Firestore emulator.

🤝 Contribution Workflow
Create a Feature Branch
Bash
git checkout -b feature/your-feature-name
Develop and Test
Make your changes.

Test everything locally.

Verify functionality using the Firestore emulator.

Commit Changes
Use the project's commit conventions:

Plaintext
feat: add leaderboard filtering
fix: resolve authentication redirect issue
docs: update setup instructions
Submit Your Contribution
Push your branch to your fork.

Open a Pull Request against the main branch of the official RankerHub repository.

Wait for review and feedback.

🚀 Happy Coding
Thanks for contributing to RankerHub. We appreciate your help in making the project better for everyone.
```
