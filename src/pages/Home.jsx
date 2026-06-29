import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Mousewheel } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import {
  Sparkles,
  Code2,
  BookOpen,
  ArrowRight,
  Award,
  Users,
  Zap,
  Target,
  Trophy,
  UserPlus,
  Gift,
  Link2,
  GitPullRequest,
  Terminal,
  Flame,
  CheckCircle2,
  Star,
  GitFork,
  Eye,
} from "lucide-react";
import { Github } from "../components/ui/Icons";
import { fadeUp, staggerContainer } from "../utils/motion";
import GradientButton from "../components/ui/GradientButton";
import Card from "../components/ui/Card";
import logo from "../assets/logo.png";
import GlowRingLogo from "../components/ui/GlowRingLogo";
import {
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const AnimatedNumber = ({
  value,
  suffix = "",
  decimals = 0,
  duration = 2000,
}) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime = null;
    const endValue = parseFloat(value);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      // Easing function (easeOutQuad)
      const easeProgress = percentage * (2 - percentage);

      const currentValue = easeProgress * endValue;
      setCount(currentValue);

      if (percentage < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [hasStarted, value, duration]);

  // Format count
  const formatted = count.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={elementRef}>
      {formatted}
      {suffix}
    </span>
  );
};

const fetchRepoStats = async () => {
  try {
    const res = await fetch(
      "https://api.github.com/repos/indresh404/RankerHub",
    );
    if (!res.ok) {
      throw new Error(`GitHub API returned status ${res.status}`);
    }
    const data = await res.json();
    return {
      stars: data.stargazers_count,
      forks: data.forks_count,
      watchers: data.watchers_count,
    };
  } catch (err) {
    console.error("Error fetching repo stats from GitHub:", err);
    return null;
  }
};

const fetchLiveUsersCount = async () => {
  try {
    if (!db) return null;
    const q = query(
      collection(db, "users"),
      where("onboardingStatus", "==", "complete"),
    );
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch (err) {
    console.error("Error querying users collection from Firestore:", err);
    return null;
  }
};

export const Home = () => {
  const location = useLocation();

  const [stats, setStats] = useState({
    users: 85420,
    stars: 120,
    forks: 34,
    watchers: 24,
  });

  useEffect(() => {
    let active = true;
    const getStats = async () => {
      const liveUsers = await fetchLiveUsersCount();
      const repoStats = await fetchRepoStats();

      if (!active) return;

      setStats((prev) => {
        const nextStats = { ...prev };
        if (liveUsers !== null) {
          nextStats.users = liveUsers;
        }
        if (repoStats !== null) {
          if (repoStats.stars !== undefined) nextStats.stars = repoStats.stars;
          if (repoStats.forks !== undefined) nextStats.forks = repoStats.forks;
          if (repoStats.watchers !== undefined)
            nextStats.watchers = repoStats.watchers;
        }
        return nextStats;
      });
    };

    getStats();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (location.hash === "#features") {
      setTimeout(() => {
        const element = document.getElementById("features");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  const features = [
    {
      title: "GitRank",
      description:
        "Analyze commits, pull requests, and reviews to rank developers globally and by language.",
      icon: Github,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      accent: "from-blue-500/20 via-cyan-500/10 to-transparent",
      gradient: "from-blue-500/20 to-cyan-400/20 shadow-blue-500/10",
      stats: "PRs, reviews, language ranks",
      status: "Contribution intelligence",
    },
    {
      title: "RankHer",
      description:
        "A spotlight ranking and community to support female software engineers.",
      icon: Sparkles,
      color: "text-pink-500 bg-pink-500/10 border-pink-500/20",
      accent: "from-pink-500/20 via-rose-500/10 to-transparent",
      gradient: "from-pink-500/20 to-rose-400/20 shadow-pink-500/10",
      stats: "Spotlights, cohorts, recognition",
      status: "Inclusive rankings",
    },
    {
      title: "CodingVerse",
      description:
        "Solve daily algorithmic challenges, earn points, and climb the problem-solving ladder.",
      icon: Code2,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      accent: "from-violet-500/20 via-indigo-500/10 to-transparent",
      gradient: "from-violet-500/20 to-indigo-400/20 shadow-violet-500/10",
      stats: "Daily practice, XP, ladders",
      status: "Challenge arena",
    },
    {
      title: "CodingOwl",
      description:
        "Build ironclad habits. Follow streaks and focus sessions backed by a focused habit assistant.",
      icon: BookOpen,
      color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
      accent: "from-amber-500/20 via-orange-500/10 to-transparent",
      gradient: "from-amber-500/20 to-orange-400/20 shadow-amber-500/10",
      stats: "Streaks, focus sessions, rituals",
      status: "Habit companion",
    },
    {
      title: "Achievements System",
      description:
        "Turn consistent progress into badges, milestone trophies, and profile-ready proof of work.",
      icon: Trophy,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      accent: "from-emerald-500/20 via-teal-500/10 to-transparent",
      gradient: "from-emerald-500/20 to-teal-400/20 shadow-emerald-500/10",
      stats: "Badges, trophies, milestones",
      status: "Progress rewards",
    },
    {
      title: "Friends System",
      description:
        "Follow peers, compare momentum, and keep developer growth social without adding noise.",
      icon: UserPlus,
      color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
      accent: "from-sky-500/20 via-blue-500/10 to-transparent",
      gradient: "from-sky-500/20 to-blue-400/20 shadow-sky-500/10",
      stats: "Followers, activity, peer ranks",
      status: "Social coding graph",
    },
    {
      title: "Referral System",
      description:
        "Invite developers into the platform and reward community growth with meaningful perks.",
      icon: Gift,
      color: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20",
      accent: "from-fuchsia-500/20 via-purple-500/10 to-transparent",
      gradient: "from-fuchsia-500/20 to-purple-400/20 shadow-fuchsia-500/10",
      stats: "Invites, rewards, growth loops",
      status: "Community expansion",
    },
  ];

  const valueProps = [
    {
      label: "Tracked Developers",
      numericValue: stats.users,
      suffix: "+",
      decimals: 0,
      icon: Users,
    },
    {
      label: "GitHub Stars",
      numericValue: stats.stars,
      suffix: "",
      decimals: 0,
      icon: Star,
    },
    {
      label: "GitHub Forks",
      numericValue: stats.forks,
      suffix: "",
      decimals: 0,
      icon: GitFork,
    },
    {
      label: "Project Watchers",
      numericValue: stats.watchers,
      suffix: "",
      decimals: 0,
      icon: Eye,
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Connect Your Profile",
      desc: "Link your GitHub account securely via OAuth in seconds. RankerHub reads only public contribution events — commits, pull requests, and code reviews — from the GitHub API. We never request write scopes or access to private source code.",
      details: [
        "OAuth login with read-only public scope",
        "Initial GitRank score calculated on onboarding",
        "Optional: enable private repo sync for full stats",
        "Referral bonus: +50 XP for new user, +100 XP for referrer",
      ],
      icon: Link2,
      color: "from-blue-600 to-cyan-500 text-blue-400",
    },
    {
      num: "02",
      title: "Earn GitRank Points",
      desc: "Your GitRank score is calculated using the formula: GitRank = (Commits × 2) + (PRs × 5) + (Reviews × 10). Sync your GitHub data anytime (5-min cooldown) to update your score in real time.",
      details: [
        "Commits: +2 XP each",
        "Pull Requests opened: +5 XP each",
        "Code Reviews submitted: +10 XP each",
        "Manual sync available with a 5-minute cooldown",
      ],
      icon: GitPullRequest,
      color: "from-violet-600 to-indigo-500 text-violet-400",
    },
    {
      num: "03",
      title: "Conquer CodingVerse Arenas",
      desc: "Solve algorithmic challenges in Java and Python — output prediction, MCQ theory, and code completion. Each correct answer earns XP based on difficulty. Incorrect attempts lock the question permanently.",
      details: [
        "Easy problems: +100 XP",
        "Medium problems: +150 XP",
        "Hard problems: +200 XP",
        "15 total questions, one attempt per question",
        "CodingVerse rank calculated from Firestore standings",
      ],
      icon: Terminal,
      color: "from-purple-600 to-pink-500 text-purple-400",
    },
    {
      num: "04",
      title: "Build Streaks in CodingOwl",
      desc: "Log in daily to build consecutive-day streaks with Oliver the Owl. Each consecutive day adds +10 Streak Points to your total. Miss a day and your streak resets to 1, but accumulated streak points are kept.",
      details: [
        "Consecutive daily login: +10 Streak XP / day",
        "Streak resets to 1 after missing a day",
        "Accumulated streak points are never lost",
        "Reach 10-day streak to unlock the Consistency badge",
      ],
      icon: Flame,
      color: "from-orange-600 to-red-500 text-orange-400",
    },
    {
      num: "05",
      title: "Climb Leaderboards & Mint Badges",
      desc: "Your Global Rank is determined by your Total XP — the sum of GitRank + CodingVerse + Streak + Referral points. Rankings are queried live from Firestore: your rank equals the count of users with higher Total XP, plus one.",
      details: [
        "Total XP = GitRank + CodingVerse + Streak + Referral",
        "Global rank: count of users above you + 1",
        "Language-specific and RankHer specialty leaderboards",
        "Unlock badges at 100+ GitRank, 10-day streak, 100+ CodingVerse XP",
      ],
      icon: Trophy,
      color: "from-amber-600 to-yellow-500 text-amber-400",
    },
  ];

  return (
    <div className="relative w-full overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blob-purple-strong pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blob-blue-strong pointer-events-none -z-10 animate-pulse-slow" />

      <section className="relative min-h-screen w-full py-20 md:py-28 overflow-hidden flex items-center">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover opacity-50 pointer-events-none"
          src="/banner.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />

        <div className="absolute top-0 left-0 w-full h-full bg-white/60 dark:bg-black/60 pointer-events-none" />

        <div className="relative z-10 w-full px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.1, 0.05)}
            className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-left"
          >
            <div className="flex-1 space-y-6">
              <motion.span
                variants={fadeUp()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 backdrop-blur-sm"
              >
                The Developer Gamification Platform
              </motion.span>

              <motion.h1
                variants={fadeUp()}
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white my-0"
              >
                Level Up Your Code. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-500">
                  Claim Your Leaderboard Rank.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp()}
                className="text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium"
              >
                RankerHub tracks commits, streaks, and problem-solving to gamify
                your software development journey. Build habits, spotlight
                contributions, and earn badges.
              </motion.p>

              <motion.div
                variants={fadeUp()}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link to="/login">
                  <GradientButton className="w-full sm:w-auto flex items-center justify-center">
                    Get Started <ArrowRight className="w-4 h-4 ml-1" />
                  </GradientButton>
                </Link>
                <a
                  href="https://github.com/indresh404/RankerHub"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GradientButton
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    View on GitHub
                  </GradientButton>
                </a>
              </motion.div>
            </div>

            <motion.div variants={fadeUp()} className="flex-shrink-0">
              <GlowRingLogo
                logoSrc={logo}
                type="logo"
                className="w-48 h-48 md:w-56 md:h-56 shadow-2xl transition-transform duration-300 hover:scale-105"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {valueProps.map((prop) => {
            const Icon = prop.icon;
            return (
              <div key={prop.label} className="space-y-1">
                <div className="flex items-center justify-center text-violet-500 mb-2">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="block text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                  <AnimatedNumber
                    value={prop.numericValue}
                    suffix={prop.suffix}
                    decimals={prop.decimals}
                  />
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {prop.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="features"
        className="py-20 space-y-8 overflow-hidden"
        aria-labelledby="features-heading"
      >
        {/* Section header */}
        <div className="px-6 max-w-6xl mx-auto">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex w-fit items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
              Feature suite
            </span>
            <h2
              id="features-heading"
              className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white my-0"
            >
              Everything developers need to turn progress into rank.
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium leading-7">
              A connected set of ranking, learning, habit, achievement, social,
              and referral systems designed for a modern developer platform.
            </p>
          </div>
        </div>

        {/* Feature slider using Swiper JS */}
        <div className="w-full max-w-6xl mx-auto px-6">
          <Swiper
            modules={[Autoplay, Pagination, Mousewheel]}
            mousewheel={{ forceToAxis: true }}
            spaceBetween={24}
            slidesPerView={1}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 30,
              },
            }}
            className="swiper-container-features"
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <SwiperSlide key={`${feature.title}-${idx}`}>
                  <div className="frosted-gradient-wrapper group">
                    {/* Vibrant frosted gradient backglow */}
                    <div
                      className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} rounded-[28px] blur-xl opacity-25 dark:opacity-35 group-hover:opacity-45 transition-opacity duration-500 pointer-events-none`}
                    />

                    <Card
                      glow={false}
                      className="frosted-glass-card group relative overflow-hidden p-0"
                    >
                      <div
                        className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${feature.accent}`}
                        aria-hidden="true"
                      />
                      <div className="relative flex h-full flex-col justify-between p-6 z-10">
                        <div className="space-y-5">
                          <div className="flex items-start justify-between gap-4">
                            <div
                              className={`flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md ${feature.color}`}
                            >
                              <Icon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <span className="rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700/70 dark:bg-slate-950/40 dark:text-slate-400 transition-all duration-300 group-hover:border-violet-500/30 group-hover:text-violet-600 dark:group-hover:text-violet-400 group-hover:scale-105">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
                              {feature.status}
                            </p>
                            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                              {feature.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                              {feature.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/55 dark:bg-slate-950/35 px-4 py-3 shadow-sm transition-all duration-500 ease-out group-hover:border-violet-500/40 group-hover:bg-white/85 dark:group-hover:bg-slate-950/50 group-hover:shadow-md">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                            Built around
                          </span>
                          <span className="mt-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {feature.stats}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </section>

      {/* Embedded How It Works Section */}
      <section
        id="how-it-works"
        className="py-20 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20"
      >
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="max-w-2xl space-y-3 mb-16">
            <span className="inline-flex w-fit items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
              Platform Lifecycle
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white my-0">
              How RankerHub Works
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium leading-7">
              Follow these steps to synchronize your metrics, conquer
              challenges, and unlock verified achievements.
            </p>
          </div>

          {/* Timeline Layout */}
          <div className="relative border-l-2 border-slate-200/60 dark:border-slate-800/60 ml-4 md:ml-8 pl-8 md:pl-12 space-y-12 max-w-4xl">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative group">
                  {/* Icon wrapper */}
                  <div
                    className={`absolute -left-[54px] md:-left-[62px] top-0 w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 tracking-wider">
                        STEP {step.num}
                      </span>
                      <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white my-0 leading-tight">
                        {step.title}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold max-w-3xl my-0">
                      {step.desc}
                    </p>

                    {/* Point mapping details */}
                    {step.details && (
                      <ul className="mt-3 space-y-1.5 list-none p-0 m-0">
                        {step.details.map((detail, dIdx) => (
                          <li
                            key={dIdx}
                            className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium"
                          >
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Call to Action */}
          <div className="mt-16 max-w-3xl mx-auto p-6 rounded-3xl bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20 backdrop-blur-md">
            <p className="text-sm text-violet-600 dark:text-violet-300 font-extrabold my-0 flex justify-center items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
              Ready to climb? Link your profile, start coding, and watch your
              developer standings rise!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
