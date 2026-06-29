export const sidebarLinks = [
  { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
  { label: "CodingVerse", path: "/dashboard/codingverse", icon: "Code2" },
  { label: "GitRank", path: "/dashboard/gitrank", icon: "Github" },
  { label: "CodingOwl", path: "/dashboard/codingowl", icon: "BookOpen" },
  { label: "OS Matchmaker", path: "/dashboard/matchmaker", icon: "Search" },
  { label: "RankHer", path: "/dashboard/rankher", icon: "Sparkles" },
  { label: "Achievements", path: "/dashboard/achievements", icon: "Award" },
  { label: "Friends", path: "/dashboard/friends", icon: "UsersRound" },
  { label: "Profile", path: "/dashboard/profile", icon: "User" },
  { label: "Settings", path: "/dashboard/settings", icon: "Settings" },
  { label: "Repo Auditor", path: "/dashboard/auditor", icon: "Activity" },
  { label: "Repo Health", path: "/dashboard/repo-health", icon: "TrendingUp" },
  { label: "How it works", path: "?modal=how-it-works", icon: "HelpCircle" },
  { label: "About Us", path: "/about", icon: "Info" },
];

export const themeColors = {
  primary: {
    purple: "#7C3AED",
    indigo: "#6366F1",
    blue: "#3B82F6",
  },
  light: {
    bg: "#F8FAFC",
    card: "bg-white/70",
    border: "border-slate-200/50",
  },
  dark: {
    bg: "#0F172A",
    card: "bg-slate-900/70",
    border: "border-slate-800/50",
  },
};

export const uiGradients = {
  primary: "bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600",
  primaryHover: "hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700",
  glow: "shadow-[0_0_20px_rgba(124,58,237,0.3)]",
  textGradient:
    "bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500",
  femalePower: "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500",
  owlFlame: "bg-gradient-to-r from-orange-500 to-red-500",
  glassCard:
    "backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50",
  glassNav:
    "backdrop-blur-md bg-white/50 dark:bg-slate-950/50 border-b border-slate-200/50 dark:border-slate-800/50",
};

export const systemBadges = [
  {
    id: "b1",
    name: "Pioneer",
    icon: "🦅",
    description: "First 100 users",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "b2",
    name: "Code Warrior",
    icon: "⚔️",
    description: "100+ contributions",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "b3",
    name: "Streak Master",
    icon: "🔥",
    description: "10+ day streak",
    color: "from-red-500 to-pink-500",
  },
  {
    id: "b4",
    name: "CSS Sorceress",
    icon: "🎨",
    description: "UI layout designer",
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "b5",
    name: "Ranker Ambassador",
    icon: "🦈",
    description: "10+ successful referrals",
    color: "from-emerald-500 to-teal-500",
  },
];
