# RankerHub Architecture Documentation

**Version:** 1.0
**Last Updated:** May 2026
**Status:** Production Ready

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Core Architecture](#core-architecture)
- [Component Hierarchy](#component-hierarchy)
- [Application Flow](#application-flow)
- [State Management](#state-management)
- [Routing Architecture](#routing-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Firebase Integration](#firebase-integration)
- [GitHub API Integration](#github-api-integration)
- [Dashboard Data Flow](#dashboard-data-flow)
- [Development Guidelines](#development-guidelines)
- [Deployment](#deployment)

---

## Overview

RankerHub is a gamified GitHub developer ranking platform built with modern web technologies. It provides developers with:

- **GitRank Scoring**: Calculates developer ranking based on GitHub activity (commits, PRs, reviews)
- **Leaderboards**: Community-based rankings across different categories
- **Achievement System**: Badges and milestones for developer accomplishments
- **Social Features**: Friend connections and profile sharing
- **Real-time Analytics**: Live GitHub statistics tracking

### Key Architecture Principles

1. **Modular Design**: Separated concerns across components, services, and utilities
2. **Context API State Management**: Centralized global state for auth, theme, and rate limiting
3. **Firebase Backend**: Secure, scalable backend infrastructure
4. **Progressive Authentication**: GitHub OAuth with conditional permission scoping
5. **Responsive Design**: Mobile-first UI with Tailwind CSS and Framer Motion
6. **Performance Optimized**: Lazy loading, code splitting, and optimized animations

---

## Technology Stack

### Frontend Framework & Build Tools

- **React 19**: Core UI framework with modern hooks
- **Vite 8**: Next-generation build tool for fast development
- **React Router 7**: Client-side routing and navigation
- **TypeScript Ready**: ESLint support for code quality

### State Management

- **Context API**: Global state (Authentication, Theme, Rate Limiting)
- **React Hooks**: Component-level state management

### Styling & Animation

- **Tailwind CSS 3.4**: Utility-first CSS framework
- **Framer Motion 12**: Animation library for smooth transitions
- **PostCSS**: CSS preprocessing and optimization

### Backend & Data

- **Firebase 12**: Complete backend-as-a-service solution
  - Authentication: GitHub OAuth
  - Realtime Database: Firestore
  - Storage: File storage for assets
  - Analytics: User behavior tracking
- **Axios**: HTTP client for API calls

### UI Components & Icons

- **Lucide React**: Modern icon library (1.17k+ icons)
- **React Icons**: Additional icon variants
- **Lottie React**: Complex animations support

### Testing & Development

- **Vitest 4**: Fast unit testing framework
- **ESLint 10**: Code linting and style enforcement
- **Autoprefixer**: CSS vendor prefix automation

---

## Directory Structure

### Root Level

\\\
rankerhub/
├── docs/ # Documentation
│ ├── ARCHITECTURE.md # This file
│ └── CONTRIBUTING.md # Contribution guidelines
├── public/ # Static assets (favicons, robots.txt)
├── src/ # Source code
├── .env.example # Environment variables template
├── .firebase.rc # Firebase configuration
├── .gitignore # Git ignore rules
├── .markdownlint.json # Markdown linting rules
├── eslint.config.js # ESLint configuration
├── firebase.json # Firebase deployment config
├── firestore.rules # Firestore security rules
├── index.html # HTML entry point
├── package.json # NPM dependencies
├── postcss.config.js # PostCSS configuration
├── tailwind.config.js # Tailwind CSS configuration
├── vite.config.js # Vite configuration
├── vercel.json # Vercel deployment config
└── README.md # Project overview
\\\

### src/ Directory Structure

\\\
src/
├── assets/ # Static and animated assets
│ └── animations/ # Lottie animation files
│
├── components/ # React components
│ ├── about/ # About page components
│ │ ├── ContributorCard.jsx # Individual contributor card
│ │ ├── ContributorsGrid.jsx # Grid layout for contributors
│ │ ├── ContributionCTA.jsx # Call-to-action component
│ │ └── TeamCard.jsx # Team member showcase
│ │
│ ├── dashboard/ # Dashboard-specific components
│ │ ├── ActivityFeed.jsx # User activity timeline
│ │ ├── RankPreview.jsx # Rank score display
│ │ ├── StatsCards.jsx # Statistics cards
│ │ └── StreakCard.jsx # Streak tracking component
│ │
│ ├── friends/ # Friend-related components
│ │ └── DeveloperCard.jsx # Developer profile card
│ │
│ ├── layout/ # Layout components
│ │ ├── Navbar.jsx # Authenticated user navbar
│ │ ├── PublicNavbar.jsx # Public site navbar
│ │ ├── PublicFooter.jsx # Public site footer
│ │ ├── Sidebar.jsx # Desktop sidebar navigation
│ │ └── MobileSidebar.jsx # Mobile drawer navigation
│ │
│ └── ui/ # Reusable UI components
│ ├── Card.jsx # Generic card wrapper
│ ├── ErrorBoundary.jsx # Error fallback component
│ ├── Toast.jsx # Toast notification system
│ ├── Loader.jsx # Loading spinner
│ ├── GradientButton.jsx # Styled button component
│ ├── ThemeToggle.jsx # Dark/light theme switcher
│ ├── Icons.jsx # Custom icon set
│ ├── LottiePlayer.jsx # Animation player wrapper
│ ├── SectionHeader.jsx # Section title component
│ ├── RateLimitBanner.jsx # API rate limit indicator
│ ├── HowItWorksModal.jsx # Feature explanation modal
│ ├── AboutModal.jsx # About information modal
│ ├── LogoutConfirmModal.jsx # Confirmation dialog
│ ├── ComingSoonCard.jsx # Coming soon feature card
│ └── GlobalModals.jsx # Global modal provider
│
├── context/ # React Context providers
│ ├── AuthContext.jsx # Authentication state & methods
│ ├── ThemeContext.jsx # Theme toggle state
│ ├── RateLimitContext.jsx # API rate limit tracking
│ └── rateLimitContextValue.js # Rate limit utilities
│
├── data/ # Static data files
│ ├── activities.js # Sample activity data
│ ├── leaderboard.js # Leaderboard data
│ └── streaks.js # Streak data
│
├── hooks/ # Custom React hooks
│ ├── useTheme.js # Theme context hook
│ └── useSidebar.js # Sidebar state hook
│
├── layouts/ # Page layout templates
│ ├── DashboardLayout.jsx # Authenticated user layout
│ └── PublicLayout.jsx # Public website layout
│
├── lib/ # Library integrations
│ └── firebase.js # Firebase configuration & helpers
│
├── pages/ # Page components (routes)
│ ├── Home.jsx # Landing page
│ ├── Login.jsx # GitHub OAuth login
│ ├── Onboarding.jsx # User setup wizard
│ ├── Dashboard.jsx # Main dashboard view
│ ├── Profile.jsx # User profile (self & others)
│ ├── Friends.jsx # Friends list and followers
│ ├── Achievements.jsx # Badges and milestones
│ ├── GitRank.jsx # GitHub ranking details
│ ├── RankHer.jsx # Women developers ranking
│ ├── CodingVerse.jsx # Alternative ranking category
│ ├── CodingOwl.jsx # Night owl ranking
│ ├── About.jsx # About the project
│ ├── Terms.jsx # Terms of service
│ ├── Privacy.jsx # Privacy policy
│ └── NotFound.jsx # 404 error page
│
├── routes/ # Routing configuration
│ └── AppRoutes.jsx # Centralized route definitions
│
├── services/ # Business logic services
│ └── friendsService.js # Friend operations (add, remove, list)
│
├── utils/ # Utility functions
│ ├── motion.js # Framer Motion animations
│ ├── motion.test.js # Animation tests
│ └── searchUtils.js # Search functionality helpers
│
├── constants/ # Application constants
│ └── index.js # Centralized constants
│
├── App.jsx # Root app component
├── App.css # Global app styles
├── main.jsx # React DOM entry point
└── index.css # Global stylesheet

\\\

---

## Core Architecture

### Application Initialization Flow

\\\mermaid
graph TD
A[main.jsx] -->|imports| B[App.jsx]
B -->|wraps with| C[ErrorBoundary]
C -->|wraps with| D[ThemeProvider]
D -->|wraps with| E[AuthProvider]
E -->|wraps with| F[RateLimitProvider]
F -->|wraps with| G[HashRouter]
G -->|renders| H[AppRoutes]
H -->|contains| I[Route Guards<br/>ProtectedRoute<br/>OnboardingRoute<br/>GuestRoute]
I -->|routes to| J[Page Components]
I -->|routes to| K[Layout Components]
\\\

### Provider Hierarchy

The application uses a nested provider pattern for global state management:

1. **ErrorBoundary**: Top-level error handling
2. **ThemeProvider**: Dark/light mode state
3. **AuthProvider**: Authentication and user data
4. **RateLimitProvider**: API rate limiting
5. **HashRouter**: Client-side routing

This hierarchy ensures proper state initialization and dependency ordering.

---

## Component Hierarchy

### Top-Level Component Structure

\\\mermaid
graph TD
App["App<br/>(Root Component)"]
App -->|children| EB["ErrorBoundary"]
EB -->|children| Theme["ThemeProvider"]
Theme -->|children| Auth["AuthProvider"]
Auth -->|children| Rate["RateLimitProvider"]
Rate -->|children| Router["HashRouter"]
Router -->|contains| Routes["Routes Component"]
Routes -->|public routes| PL["PublicLayout"]
Routes -->|protected routes| PR["ProtectedRoute"]
Routes -->|guest only| GR["GuestRoute"]
Routes -->|onboarding| OR["OnboardingRoute"]

    PL -->|outlets| PB["Page Body"]
    PL -->|has| PNav["PublicNavbar"]
    PL -->|has| PFoot["PublicFooter"]

    PR -->|wraps| DL["DashboardLayout"]
    DL -->|has| Navbar["Navbar"]
    DL -->|has| Sidebar["Sidebar"]
    DL -->|has| MS["MobileSidebar"]
    DL -->|outlets| Pages["Page Components"]

    Pages -->|renders| Dashboard["Dashboard.jsx"]
    Pages -->|renders| Friends["Friends.jsx"]
    Pages -->|renders| Profile["Profile.jsx"]
    Pages -->|renders| Achievements["Achievements.jsx"]

    style App fill:#7c3aed
    style Router fill:#06b6d4
    style PL fill:#f59e0b
    style DL fill:#8b5cf6

\\\

### Dashboard Component Tree (Example)

\\\
DashboardLayout
├── Navbar
│ ├── Theme Toggle
│ ├── User Menu
│ └── Notifications
├── Sidebar
│ ├── Logo
│ ├── Navigation Links
│ └── Collapse Toggle
├── Main Content (Outlet)
│ └── Dashboard Page
│ ├── StatsCards
│ │ ├── Card (GitRank Points)
│ │ ├── Card (Achievements)
│ │ └── Card (Followers)
│ ├── StreakCard
│ └── ActivityFeed
│ ├── Activity Item
│ ├── Activity Item
│ └── Activity Item
└── MobileSidebar (Drawer)
└── Navigation Links
\\\

---

## Application Flow

### React/Vite Application Initialization

\\\mermaid
sequenceDiagram
participant Browser
participant Vite as Vite Dev Server
participant main.jsx
participant App.jsx
participant AuthContext
participant Firebase

    Browser->>Vite: Request application
    Vite->>main.jsx: Load entry point
    main.jsx->>App.jsx: Render root component
    App.jsx->>AuthContext: Initialize AuthProvider
    AuthContext->>Firebase: Check auth state
    Firebase-->>AuthContext: Return user session
    AuthContext->>AuthContext: Load user profile from Firestore
    AuthContext-->>App.jsx: Provide auth state
    App.jsx->>App.jsx: Render UI with context
    App.jsx-->>Browser: Display application

\\\

### Page Load Sequence for Authenticated User

\\\

1. User visits application
   ↓
2. React mounts App component
   ↓
3. ErrorBoundary wraps entire tree
   ↓
4. ThemeProvider initializes (checks localStorage for theme)
   ↓
5. AuthProvider initializes:
   - Calls onAuthStateChanged() to check Firebase session
   - If user exists, fetches Firestore user profile in real-time
   - Sets loading=false when complete
     ↓
6. RateLimitProvider initializes
   ↓
7. HashRouter mounted with routes
   ↓
8. AppRoutes evaluates current URL and route guards
   ↓
9. If ProtectedRoute and user authenticated:
   - Load DashboardLayout
   - Render corresponding page
     ↓
10. Page renders with all context available
    ↓
11. Components can now use useAuth(), useTheme(), etc.
    \\\

---

## State Management

### Context API Architecture

RankerHub uses React Context API for global state with three main contexts:

#### 1. **AuthContext** (src/context/AuthContext.jsx)

**Purpose**: Manages authentication state and user data

**State:**
\\\
{
user: FirebaseUser | null, // Current Firebase auth user
userData: Object | null, // Firestore user profile document
loading: boolean, // Auth state loading indicator
isOnboarding: boolean, // Profile setup incomplete flag
ghAccessToken: string | null, // GitHub OAuth token (memory only)
}
\\\

**Methods:**

- \login(requestRepoScope: boolean)\ - GitHub OAuth sign-in
- \logout()\ - Sign out and clear state
- \etchGitHubStats(uid, username)\ - Call GitHub API for user stats

**Key Security Features:**

- GitHub access token stored ONLY in React memory (not localStorage)
- Prevents XSS attacks that could steal tokens from Web Storage
- Token lost on page refresh, but only needed once after login
- Real-time Firestore listeners for live profile updates

#### 2. **ThemeContext** (src/context/ThemeContext.jsx)

**Purpose**: Manages light/dark mode preferences

**State:**
\\\
{
theme: 'light' | 'dark', // Current theme
isDark: boolean, // Convenience boolean
}
\\\

**Features:**

- Persists to localStorage
- Respects system color scheme on first load
- Updates root HTML element class

#### 3. **RateLimitContext** (src/context/RateLimitContext.jsx)

**Purpose**: Tracks GitHub API rate limiting

**State:**
\\\
{
remaining: number, // Remaining API calls
limit: number, // Total API limit
resetTime: Date, // Rate limit reset timestamp
isLimited: boolean, // Exceeded rate limit flag
}
\\\

**Usage:**

- Monitors GitHub API response headers
- Displays banner warning when rate limited
- Prevents unnecessary API calls

### State Flow Diagram

\\\mermaid
graph LR
A["User Action<br/>(Login, Theme Toggle)"]
A -->|dispatch| B["Context Update"]
B -->|persist| C["localStorage/<br/>Firestore"]
B -->|set state| D["Context Provider"]
D -->|provide via| E["useContext Hook"]
E -->|trigger| F["Component Re-render"]
F -->|display| G["Updated UI"]
\\\

---

## Routing Architecture

### Route Structure Overview

\\\mermaid
graph TD
AppRoutes["AppRoutes Component"]
AppRoutes -->|PublicLayout| PL["Public Pages"]
PL -->|/| Home["Home"]
PL -->|/gitrank| GitRankPub["GitRank Info"]
PL -->|/rankher| RankHer["RankHer Info"]
PL -->|/codingverse| CodingVerse["CodingVerse Info"]
PL -->|/codingowl| CodingOwl["CodingOwl Info"]

    AppRoutes -->|GuestRoute| Guest["Guest Only"]
    Guest -->|/login| Login["Login Page"]

    AppRoutes -->|OnboardingRoute| Onboarding["Onboarding Page"]

    AppRoutes -->|ProtectedRoute| DL["DashboardLayout"]
    DL -->|/dashboard| Dashboard["Dashboard"]
    DL -->|/dashboard/*| SubPages["Sub-pages"]
    SubPages -->|/gitrank| GitRank["GitRank"]
    SubPages -->|/rankher| RankHer2["RankHer"]
    SubPages -->|/achievements| Achievements["Achievements"]
    SubPages -->|/codingverse| CodingVerse2["CodingVerse"]
    SubPages -->|/codingowl| CodingOwl2["CodingOwl"]
    SubPages -->|/friends| Friends["Friends"]
    SubPages -->|/profile| Profile["Profile"]
    SubPages -->|/settings| Settings["Settings"]

    AppRoutes -->|Standalone| Legal["Legal Pages"]
    Legal -->|/about| About["About"]
    Legal -->|/terms| Terms["Terms"]
    Legal -->|/privacy| Privacy["Privacy"]

    AppRoutes -->|Catch-all| NotFound["404 Page"]

\\\

### Route Guards

Three route guard components protect access:

#### ProtectedRoute

\\\javascript
// Only accessible if:
// 1. User is authenticated
// 2. Onboarding is complete
// Used for: Dashboard and all authenticated features
\\\

#### OnboardingRoute

\\\javascript
// Only accessible if:
// 1. User is authenticated
// 2. Onboarding is incomplete
// Redirects to /dashboard if already onboarded
\\\

#### GuestRoute

\\\javascript
// Only accessible if NOT authenticated
// Used for: /login page
// Redirects to /dashboard if already authenticated
\\\

### Navigation Flow

\\\mermaid
sequenceDiagram
participant User
participant Browser
participant React as React Router
participant Guard as Route Guard
participant Page as Page Component

    User->>Browser: Click navigation link
    Browser->>React: Update URL hash
    React->>Guard: Check route access

    alt User authenticated & onboarded
        Guard->>Page: Render dashboard page
        Page-->>Browser: Display content
    else User authenticated & onboarding incomplete
        Guard->>React: Redirect to /onboarding
        React->>Page: Render onboarding
    else User not authenticated
        Guard->>React: Redirect to /login
        React->>Page: Render login page
    end

\\\

---

## Authentication & Authorization

### Complete Authentication Flow

\\\mermaid
sequenceDiagram
participant User
participant Browser as Browser/App
participant Firebase as Firebase Auth
participant GitHub as GitHub OAuth
participant Firestore as Firestore

    User->>Browser: Click "Login with GitHub"
    Browser->>Firebase: signInWithGitHub()
    Firebase->>GitHub: Open OAuth popup
    GitHub->>GitHub: User authenticates
    GitHub-->>Firebase: Authorization code
    Firebase->>Firebase: Exchange for token
    Firebase-->>Browser: User object + access token

    Browser->>Firestore: Check if user exists
    Firestore-->>Browser: User profile (or not found)

    alt First time login
        Browser->>Firestore: Create skeletal user doc
        Firestore->>Firestore: Save basic info
        Firestore-->>Browser: Document created
        Browser->>Browser: Set isOnboarding = true
        Browser->>Browser: Redirect to /onboarding
    else Returning user
        Browser->>Browser: Set isOnboarding = false
        Browser->>Browser: Redirect to /dashboard
    end

\\\

### User Data Structure

**Firestore User Document** (users/{uid}):
\\\javascript
{
// Core Identity
uid: "firebase-uid",
githubUsername: "developer-handle",
githubId: 12345678,
email: "<developer@example.com>",
name: "Developer Name",
avatar: "<https://avatars.githubusercontent.com/...>",

// Status
onboardingStatus: "complete" | "incomplete",
lastLogin: "2026-05-31T23:41:48Z",
createdAt: "2026-05-31T23:41:48Z",

// GitHub Stats
commits: 1250,
prs: 150,
reviews: 300,
publicRepos: 25,
stars: 5000,
followers: 500,
primaryLanguage: "JavaScript",

// Points System
points: {
gitRankPoints: 4250, // (commits*2) + (prs*5) + (reviews\*10)
codingVersePoints: 0,
streakPoints: 0,
referralPoints: 0,
totalPoints: 4250
},

// Profile Data
city: "San Francisco, CA",
bio: "Open source enthusiast",
website: "<https://example.com>",
streak: 42,

// Privacy & Settings
profileVisibility: "public" | "private",
privateRepoSyncEnabled: false,
}
\\\

### Session Management

- **Authentication**: Firebase Auth manages user sessions
- **Token Refresh**: Firebase auto-refreshes ID tokens
- **Session Persistence**: Maintained by Firebase SDK in localStorage
- **Logout**: Clears Firebase auth state and React context state

---

## Firebase Integration

### Firebase Configuration

Located in \src/lib/firebase.js\:

\\\javascript
// Environment variables required (from .env.local):
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID (optional)
\\\

### Firebase Services

#### 1. **Authentication (Firebase Auth)**

- GitHub OAuth provider
- Scopes: \
  ead:user\, \user:email\, optional \
  epo\
- Conditional repo scope for private repository sync

#### 2. **Firestore Database**

- **Collection: users** - User profiles and settings
- **Collection: leaderboards** - Ranking data by category
- **Collection: friends** - Friend relationship data
- **Collection: achievements** - Badge tracking
- Real-time listeners for live updates

#### 3. **Cloud Storage**

- Profile pictures
- Custom avatars
- Badge images

#### 4. **Analytics**

- Page view tracking
- User interaction tracking
- Custom event logging

### Firebase Listener Pattern

\\\javascript
// In AuthContext.jsx:
const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
// Called whenever Firestore document changes
// Updates React state with latest data
setUserData(docSnap.data());
}, (error) => {
console.error("Listener error:", error);
});

// Cleanup on unmount:
return () => unsubscribeSnapshot();
\\\

### Firestore Security Rules

Enforced in \irestore.rules\:

- Users can only read/write their own document
- Public profiles readable by all authenticated users
- Friends list visible only to involved parties
- Leaderboards readable by all authenticated users

---

## GitHub API Integration

### GitHub Stats Fetching Flow

\\\mermaid
sequenceDiagram
participant App as React App
participant Context as AuthContext
participant GitHub as GitHub API

    App->>Context: User logs in
    Context->>Context: Store access token in React state
    App->>Context: fetchGitHubStats(uid, username)
    Context->>GitHub: GET /users/{username}
    GitHub-->>Context: Profile data (repos, followers)
    Context->>GitHub: GET /users/{username}/repos
    GitHub-->>Context: Repos list (stars, languages)
    Context->>GitHub: GET /search/commits?q=author:{username}
    GitHub-->>Context: Commit count
    Context->>GitHub: GET /search/issues?q=author:{username}+type:pr
    GitHub-->>Context: PR count
    Context->>GitHub: GET /search/issues?q=reviewed-by:{username}
    GitHub-->>Context: Review count
    Context->>Context: Calculate GitRank = (commits*2) + (prs*5) + (reviews*10)
    Context-->>App: Return stats object

\\\

### GitHub API Endpoints Used

\\\
GET /users/{username}
Purpose: Public profile info
Rate Limit: 60 reqs/hr (unauthenticated), 5000/hr (authenticated)

GET /users/{username}/repos
Purpose: User's repositories (max 100 per request)
Data: Stars, language, description

GET /search/commits?q=author:{username}
Purpose: Total commits count
Rate Limit: 30 reqs/min (authenticated only)

GET /search/issues?q=author:{username}+type:pr
Purpose: Pull requests authored

GET /search/issues?q=reviewed-by:{username}
Purpose: Code reviews performed
\\\

### Rate Limit Handling

- GitHub returns rate limit info in response headers
- Tracked in RateLimitContext
- Banner displayed when limit approached
- Graceful degradation returns zeros instead of errors
- Users can manually refresh stats later

---

## Dashboard Data Flow

### Data Flow Diagram

\\\mermaid
graph TD
A["User Authentication<br/>(GitHub OAuth)"]
A -->|stores in| B["AuthContext"]
B -->|fetches from| C["Firestore User Doc"]
C -->|triggers| D["Real-time Listener"]
D -->|updates| E["userData state"]
E -->|used by| F["Dashboard Page"]
F -->|renders| G["StatsCards"]
G -->|displays| H["Points, Rank, Followers"]

    F -->|renders| I["StreakCard"]
    I -->|displays| J["Current Streak"]

    F -->|renders| K["ActivityFeed"]
    K -->|displays| L["Recent Activity"]

    E -->|also used by| M["Profile Page"]
    M -->|displays| N["User Profile Info"]

    E -->|also used by| O["Friends Page"]
    O -->|displays| P["Friend List"]

\\\

### Dashboard Component Data Binding

**StatsCards Component**:
\\\javascript
// From AuthContext:
const { userData } = useAuth();

// Display:

- GitRank Points: userData.points.gitRankPoints
- Achievements: userData.achievements?.length || 0
- Followers: userData.followers
- Repositories: userData.publicRepos
  \\\

**ActivityFeed Component**:
\\\javascript
// Data source: Static data (src/data/activities.js)
// Real-time source: Firebase activity collection
// Displays: Commits, PRs, reviews, achievements
\\\

---

## Development Guidelines

### Adding a New Feature

1. **Create Component**
   \\\
   src/components/feature/ComponentName.jsx
   - Use functional components
   - Use React hooks for state
   - Follow naming conventions (PascalCase)
     \\\

2. **Add Route** (if page-level)
   \\\javascript
   // Update src/routes/AppRoutes.jsx
   // Add new Route with appropriate guard
   // Determine if it needs ProtectedRoute or GuestRoute
   \\\

3. **Use Context** (if needs auth/theme)
   \\\javascript
   import { useAuth } from '../context/AuthContext';
   import { useTheme } from '../hooks/useTheme';
   \\\

4. **Add Tests**
   \\\
   src/utils/feature.test.js
   \\\

5. **Update Docs**
   - Add to this ARCHITECTURE.md if it affects architecture
   - Update CONTRIBUTING.md if it affects workflow

### Coding Standards

- **Component Naming**: PascalCase for components, camelCase for utils
- **File Organization**: Keep related components in folders
- **Props Validation**: Use prop-types or TypeScript (optional)
- **Comments**: Only for complex logic
- **Imports**: Sort alphabetically within groups
- **Styling**: Use Tailwind classes (avoid inline styles)
- **State**: Use Context API for global, useState for local

### Performance Optimization

- **Code Splitting**: Vite handles via dynamic imports
- **Lazy Loading**: Use React.lazy() for route components
- **Memoization**: Use React.memo() for expensive renders
- **Animation**: Use Framer Motion (GPU-accelerated)
- **Bundle**: Monitor with Vite's build analysis

### Common Tasks

**Adding a new API call:**
\\\javascript
// 1. Create service function
src/services/myService.js

// 2. Use in component:
import { myApiFunction } from '../services/myService';

const MyComponent = () => {
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
setLoading(true);
myApiFunction()
.then(setData)
.finally(() => setLoading(false));
}, []);
};
\\\

**Adding a new context:**
\\\javascript
// 1. Create in src/context/MyContext.jsx
// 2. Wrap provider in App.jsx
// 3. Create hook: src/hooks/useMyContext.js
// 4. Use in components: const myState = useMyContext();
\\\

---

## Deployment

### Build Process

\\\ash
npm run build
\\\

This executes Vite's build pipeline:

1. Transpiles JSX/ES6+ to browser-compatible JavaScript
2. Bundles code using efficient module resolution
3. Minifies output
4. Creates \dist/\ folder with production assets

### Vercel Deployment (via vercel.json)

- Automatically triggered on push to main branch
- Env variables configured in Vercel dashboard
- Builds using Node 18+
- Output directory: \dist/\

### Firebase Deployment

\\\ash
firebase deploy
\\\

Deploys:

- Firestore security rules
- Cloud functions (if any)
- Analytics configuration

### Environment Configuration

Create \.env.local\ for development:
\\\
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_FIREBASE_MEASUREMENT_ID=xxx
\\\

Copy from .env.example:
\\\ash
cp .env.example .env.local
\\\

### Production Checklist

- [ ] All tests pass: \
      pm run test\
- [ ] No linting errors: \
      pm run lint\
- [ ] Bundle size reviewed
- [ ] Environment variables set
- [ ] Firebase rules deployed
- [ ] Analytics enabled
- [ ] Error boundaries in place
- [ ] Rate limiting implemented
- [ ] CORS configured correctly

---

## Troubleshooting

### Common Issues

**Auth state not persisting:**

- Check Firebase initialization
- Verify env variables loaded
- Check browser localStorage enabled

**Rate limit errors:**

- GitHub API limits hit
- Check RateLimitContext
- Display banner to user
- Implement backoff retry

**Firestore permission denied:**

- Check firestore.rules
- Verify user is authenticated
- Check collection path matches

**Animations stuttering:**

- Use GPU-accelerated props (transform, opacity)
- Avoid animating layout properties
- Check Framer Motion configuration

---

## Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion)
- [React Router Documentation](https://reactrouter.com)

---

**Last Updated**: May 2026
**Maintainer**: RankerHub Team
**For Questions**: See CONTRIBUTING.md or open an issue

---

## OAuth Token Routing & Security

### Overview

This section describes how GitHub OAuth access tokens are handled in RankerHub,
including storage, security boundaries, and API request flow.

### Token Storage

- After a successful GitHub OAuth login, the access token is stored in the
  browser's `sessionStorage` — never in any server or database.
- The following keys are used:
  - `gh_access_token` — primary token key
  - `gh_token_<uid>` — per-user token key
- Token is also held in React memory via `AuthContext` to prevent XSS attacks

### Architecture Diagram
