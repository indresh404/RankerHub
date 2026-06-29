import fs from "fs";

const replacements = [
  {
    file: "src/components/about/TeamCard.jsx",
    search: /profileLink(,\s*)?|,\s*profileLink/,
    replace: "",
  },
  {
    file: "src/components/dashboard/RankPreview.jsx",
    search: /Award(,\s*)?|,\s*Award/,
    replace: "",
  },
  {
    file: "src/components/dashboard/StreakCard.jsx",
    search: /HelpCircle(,\s*)?|,\s*HelpCircle/,
    replace: "",
  },
  {
    file: "src/components/layout/MobileSidebar.jsx",
    search: /systemBadges(,\s*)?|,\s*systemBadges/,
    replace: "",
  },
  {
    file: "src/components/layout/Navbar.jsx",
    search: /ArrowUpRight(,\s*)?|,\s*ArrowUpRight/,
    replace: "",
  },
  {
    file: "src/components/layout/Sidebar.jsx",
    search: /systemBadges(,\s*)?|,\s*systemBadges/,
    replace: "",
  },
  {
    file: "src/components/ui/ComingSoonCard.jsx",
    search: /motion(,\s*)?|,\s*motion/,
    replace: "",
  },
  {
    file: "src/components/ui/HowItWorksModal.jsx",
    search: /ArrowRight(,\s*)?|,\s*ArrowRight/,
    replace: "",
  },
  {
    file: "src/components/ui/LogoutConfirmModal.jsx",
    search: /X(,\s*)?|,\s*X/,
    replace: "",
  },
  {
    file: "src/components/ui/LogoutConfirmModal.jsx",
    search: /Card(,\s*)?|,\s*Card/,
    replace: "",
  },
  {
    file: "src/components/ui/LottiePlayer.jsx",
    search: /error/,
    replace: "_error",
  },
  {
    file: "src/components/ui/ThemeToggle.jsx",
    search: /const \[theme, setTheme\] = useTheme\(\)/,
    replace: "const { setTheme } = useTheme()",
  },
  {
    file: "src/context/AuthContext.jsx",
    search: /publicRepos(,\s*)?|,\s*publicRepos/,
    replace: "",
  },
  {
    file: "src/context/AuthContext.jsx",
    search: /followers(,\s*)?|,\s*followers/,
    replace: "",
  },
  { file: "src/context/AuthContext.jsx", search: /err/, replace: "_err" },
  {
    file: "src/pages/Achievements.jsx",
    search: /TrendingUp(,\s*)?|,\s*TrendingUp/,
    replace: "",
  },
  {
    file: "src/pages/CodingOwl.jsx",
    search: /Flame(,\s*)?|,\s*Flame/,
    replace: "",
  },
  {
    file: "src/pages/CodingOwl.jsx",
    search: /Play(,\s*)?|,\s*Play/,
    replace: "",
  },
  {
    file: "src/pages/CodingOwl.jsx",
    search: /Sparkles(,\s*)?|,\s*Sparkles/,
    replace: "",
  },
  {
    file: "src/pages/CodingOwl.jsx",
    search: /focusStats(,\s*)?|,\s*focusStats/,
    replace: "",
  },
  {
    file: "src/pages/Dashboard.jsx",
    search: /Zap(,\s*)?|,\s*Zap/,
    replace: "",
  },
  {
    file: "src/pages/Dashboard.jsx",
    search: /Code(,\s*)?|,\s*Code/,
    replace: "",
  },
  {
    file: "src/pages/Dashboard.jsx",
    search: /Flame(,\s*)?|,\s*Flame/,
    replace: "",
  },
  {
    file: "src/pages/Dashboard.jsx",
    search: /ArrowUpRight(,\s*)?|,\s*ArrowUpRight/,
    replace: "",
  },
  {
    file: "src/pages/Dashboard.jsx",
    search: /GradientButton(,\s*)?|,\s*GradientButton/,
    replace: "",
  },
  {
    file: "src/pages/GitRank.jsx",
    search: /ShieldAlert(,\s*)?|,\s*ShieldAlert/,
    replace: "",
  },
  {
    file: "src/pages/GitRank.jsx",
    search: /Award(,\s*)?|,\s*Award/,
    replace: "",
  },
  {
    file: "src/pages/GitRank.jsx",
    search: /trophyAnimation(,\s*)?|,\s*trophyAnimation/,
    replace: "",
  },
  {
    file: "src/pages/Login.jsx",
    search: /const navigate = useNavigate\(\);\n/,
    replace: "",
  },
  {
    file: "src/pages/Profile.jsx",
    search: /Sparkles(,\s*)?|,\s*Sparkles/,
    replace: "",
  },
  {
    file: "src/pages/Profile.jsx",
    search: /TrendingUp(,\s*)?|,\s*TrendingUp/,
    replace: "",
  },
  {
    file: "src/pages/Profile.jsx",
    search: /Bookmark(,\s*)?|,\s*Bookmark/,
    replace: "",
  },
  {
    file: "src/pages/Profile.jsx",
    search: /CheckCircle2(,\s*)?|,\s*CheckCircle2/,
    replace: "",
  },
  {
    file: "src/pages/Profile.jsx",
    search: /Twitter(,\s*)?|,\s*Twitter/,
    replace: "",
  },
  {
    file: "src/pages/RankHer.jsx",
    search: /Trophy(,\s*)?|,\s*Trophy/,
    replace: "",
  },
  {
    file: "src/pages/RankHer.jsx",
    search: /ArrowRight(,\s*)?|,\s*ArrowRight/,
    replace: "",
  },
  { file: "src/pages/RankHer.jsx", search: /\bidx\b/, replace: "_idx" },
];

for (const { file, search, replace } of replacements) {
  try {
    let content = fs.readFileSync(file, "utf8");
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
  } catch (e) {
    console.error(`Error processing ${file}: ${e.message}`);
  }
}
console.log("Done");
