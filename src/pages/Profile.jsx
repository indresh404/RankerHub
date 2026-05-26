import React, { useState, useEffect } from "react";
import Toast from "../components/ui/Toast";
import LottiePlayer from "../components/ui/LottiePlayer";
import {
  MapPin,
  Calendar,
  Award,
  ShieldCheck,
  Mail,
  Edit2,
  X,
  Save,
  Plus
} from "lucide-react";
import { Github, Linkedin, Instagram } from "../components/ui/Icons";
import { query, collection, where, getCountFromServer, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import successTick from "../assets/animations/succes_tick.json";
import trophyAnimation from "../assets/animations/trophy.json";
import { systemBadges } from "../constants";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import GradientButton from "../components/ui/GradientButton";

export const Profile = () => {
  const { userData, user, setUserData } = useAuth();
  const [copied, setCopied] = useState(false);
  const [rank, setRank] = useState("Loading...");
  const [toast, setToast] = useState(null);
  // Social links edit states
  const [editingSocial, setEditingSocial] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // Local state for social links - initialize with userData directly
  const [localSocialLinks, setLocalSocialLinks] = useState({
    linkedinUrl: userData?.linkedinUrl || null,
    instagramHandle: userData?.instagramHandle || null,
    discordUsername: userData?.discordUsername || null
  });

  // Update local social links when userData changes from Firestore
  useEffect(() => {
    if (userData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSocialLinks(prev => ({
        ...prev,
        linkedinUrl: userData.linkedinUrl || null,
        instagramHandle: userData.instagramHandle || null,
        discordUsername: userData.discordUsername || null
      }));
    }
  }, [userData]);

  // Optimized rank count query
  useEffect(() => {
    if (!userData || !userData.points) return;

    const fetchRank = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("points.totalPoints", ">", userData.points.totalPoints)
        );
        const snapshot = await getCountFromServer(q);
        const currentRank = snapshot.data().count + 1;
        setRank(`#${currentRank}`);
      } catch (err) {
        console.error("Error calculating dynamic rank:", err);
        setRank("#N/A");
      }
    };

    fetchRank();
  }, [userData]);

  const handleShareProfile = () => {
    const code = userData?.referralCode || "NEWCODE";
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle social link update
const handleUpdateSocialLink = async (type, value) => {
    if (!user) return;

    // Validate input before updating
    if (type === "linkedin") {
      if (value && value.trim()) {
        const linkedinPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w\-]+\/?$/i;
        const rawVal = value.trim();
        const testVal = rawVal.startsWith('http') ? rawVal : 'https://' + rawVal;
        if (!linkedinPattern.test(testVal)) {
          setToast({ message: "Invalid LinkedIn URL. Use format: linkedin.com/in/username", type: "error" });
          return;
        }
      }
    } else if (type === "instagram") {
      if (value && value.trim()) {
        const igPattern = /^@?[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/;
        if (!igPattern.test(value.trim())) {
          setToast({ message: "Invalid Instagram username.", type: "error" });
          return;
        }
      }
    } else if (type === "discord") {
      if (value && value.trim()) {
        const discordPattern = /^.{3,32}(#\d{4})?$/;
        if (!discordPattern.test(value.trim())) {
          setToast({ message: "Invalid Discord username.", type: "error" });
          return;
        }
      }
    }

    setUpdating(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updateData = {};
      let processedValue = null;
      
      if (type === "linkedin") {
        if (value && value.trim()) {
          let linkedinUrl = value.trim();
          if (!linkedinUrl.startsWith('http://') && !linkedinUrl.startsWith('https://')) {
            linkedinUrl = 'https://' + linkedinUrl;
          }
          processedValue = linkedinUrl;
        }
        updateData.linkedinUrl = processedValue;
      } else if (type === "instagram") {
        if (value && value.trim()) {
          processedValue = value.trim().replace(/^@/, '');
        }
        updateData.instagramHandle = processedValue;
      } else if (type === "discord") {
        if (value && value.trim()) {
          processedValue = value.trim();
        }
        updateData.discordUsername = processedValue;
      }
      
      // Add updated timestamp
      updateData.updatedAt = new Date().toISOString();
      
      await updateDoc(userRef, updateData);
      
      // Fetch updated user data
      const updatedUserDoc = await getDoc(userRef);
      const updatedData = updatedUserDoc.exists() ? updatedUserDoc.data() : null;
      
      // Update local state
      setLocalSocialLinks(prev => ({
        ...prev,
        [type === "linkedin" ? "linkedinUrl" : type === "instagram" ? "instagramHandle" : "discordUsername"]: processedValue
      }));
      
      // Update AuthContext if available
      if (setUserData && updatedData) {
        setUserData(prev => ({
          ...prev,
          ...updatedData
        }));
      }
      
      setEditingSocial(null);
      setEditValue("");
      
      setToast({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`, type: "success" });
    } catch (err) {
      console.error("Error updating social link:", err);
      setToast({ message: `Failed to update ${type}. Please try again.`, type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  const totalPoints = userData?.points?.totalPoints || 0;
  const gitRankPoints = userData?.points?.gitRankPoints || 0;
  const referralPoints = userData?.points?.referralPoints || 0;
  const streakPoints = userData?.points?.streakPoints || 0;
  const codingVersePoints = userData?.points?.codingVersePoints || 0;
  const streak = userData?.streak || 1;

  // Discord icon component
  const DiscordIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.21.3753-.444.8643-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.163-.3852-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C2.5092 7.7761 1.862 11.0615 2.183 14.3025a.074.074 0 0 0 .0283.0479 19.9411 19.9411 0 0 0 6.0017 2.9829.0766.0766 0 0 0 .0791-.022c.4616-.6257.8731-1.2855 1.231-1.9798a.0745.0745 0 0 0-.041-.105c-.6486-.2477-1.2671-.5545-1.8551-.9069a.074.074 0 0 1-.025-.0968.074.074 0 0 1 .0959-.0291c.123.0769.2437.1567.3616.2393a12.5958 12.5958 0 0 0 7.6554 0c.1179-.0826.2387-.1624.3616-.2393a.074.074 0 0 1 .096.0288.074.074 0 0 1-.025.097c-.588.3524-1.2065.6592-1.8551.9069a.0745.0745 0 0 0-.041.105c.3579.6943.7694 1.3541 1.231 1.9798a.076.076 0 0 0 .0791.022 19.94 19.94 0 0 0 6.0017-2.9829.074.074 0 0 0 .0283-.0479c.379-3.7757-.607-7.0224-2.538-10.0367a.069.069 0 0 0-.032-.0278zM8.4966 12.5148c-1.182 0-2.148-1.0903-2.148-2.427s.955-2.427 2.148-2.427c1.192 0 2.158 1.0903 2.148 2.427 0 1.3367-.956 2.427-2.148 2.427zm6.999 0c-1.182 0-2.148-1.0903-2.148-2.427s.955-2.427 2.148-2.427c1.192 0 2.158 1.0903 2.148 2.427 0 1.3367-.956 2.427-2.148 2.427z"/>
    </svg>
  );

  const profileStats = [
    { label: "XP Points", value: totalPoints.toLocaleString(), detail: "Total Earned XP" },
    { label: "Git Rank", value: rank, detail: rank === "Loading..." ? "Calculating..." : "Global leaderboard position" },
    { label: "Active Streak", value: `${streak} Day${streak !== 1 ? "s" : ""}`, detail: "Consecutive daily logins" },
    { label: "Invites Shared", value: `${Math.floor(referralPoints / 100)} Used`, detail: "Referral code successes" }
  ];

  // Social links configuration with live data from localSocialLinks
  const socialLinks = [
    {
      id: "github",
      name: "GitHub",
      icon: Github,
      hasLink: !!userData?.githubUsername,
      link: `https://github.com/${userData?.githubUsername || ""}`,
      color: "hover:bg-slate-100 dark:hover:bg-slate-800",
      textColor: "text-slate-500",
      isClickable: true,
      showAddButton: false
    },
    {
      id: "email",
      name: "Email",
      icon: Mail,
      hasLink: !!(userData?.email || user?.email),
      link: `mailto:${userData?.email || user?.email}`,
      color: "hover:bg-blue-500/10 hover:text-blue-500",
      textColor: "text-slate-500",
      isClickable: true,
      showAddButton: false
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      hasLink: !!localSocialLinks.linkedinUrl,
      link: localSocialLinks.linkedinUrl,
      value: localSocialLinks.linkedinUrl,
      color: "hover:bg-indigo-500/10 hover:text-indigo-600",
      textColor: "text-slate-500",
      placeholder: "LinkedIn URL or profile ID (e.g., linkedin.com/in/username)",
      type: "url"
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      hasLink: !!localSocialLinks.instagramHandle,
      link: localSocialLinks.instagramHandle ? `https://instagram.com/${localSocialLinks.instagramHandle}` : null,
      value: localSocialLinks.instagramHandle,
      color: "hover:bg-pink-500/10 hover:text-pink-500",
      textColor: "text-slate-500",
      placeholder: "@username or username (without @)",
      type: "username"
    },
    {
      id: "discord",
      name: "Discord",
      icon: DiscordIcon,
      hasLink: !!localSocialLinks.discordUsername,
      link: null,
      value: localSocialLinks.discordUsername,
      color: "hover:bg-indigo-500/10 hover:text-indigo-600",
      textColor: "text-slate-500",
      placeholder: "Discord username#0000",
      type: "username"
    }
  ];

  // Render social link button
  const renderSocialButton = (social) => {
    const isEditing = editingSocial === social.id;
    const hasData = social.hasLink;
    const displayValue = social.value;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-violet-500/30 shadow-lg">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={social.placeholder}
            className="px-3 py-1.5 text-sm bg-transparent border-none focus:outline-none text-slate-900 dark:text-white w-48"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUpdateSocialLink(social.id, editValue);
              }
            }}
          />
          <button
            onClick={() => handleUpdateSocialLink(social.id, editValue)}
            disabled={updating}
            className="p-1.5 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setEditingSocial(null);
              setEditValue("");
            }}
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 hover:bg-slate-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // For GitHub and Email - always show as clickable logos
    if (social.id === "github" || social.id === "email") {
      return (
        <a
          href={social.link}
          target={social.id === "email" ? "_self" : "_blank"}
          rel="noreferrer"
          className={`p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ${social.textColor} transition-all ${social.color} flex items-center gap-2 group`}
          title={social.name}
        >
          <social.icon className="w-4 h-4" />
          <span className="text-xs font-medium hidden sm:inline">{social.name}</span>
        </a>
      );
    }

    // For other socials - show logo if has data, otherwise show add button
    if (hasData) {
      return (
        <div className="relative group">
          {social.link ? (
            <a
              href={social.link}
              target="_blank"
              rel="noreferrer"
              className={`p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ${social.textColor} transition-all ${social.color} flex items-center gap-2`}
              title={displayValue}
            >
              <social.icon className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">{social.name}</span>
            </a>
          ) : (
            <div
              className={`p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ${social.textColor} transition-all ${social.color} flex items-center gap-2 cursor-default`}
              title={displayValue}
            >
              <social.icon className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">{social.name}</span>
            </div>
          )}
          {/* Edit button on hover for existing links */}
          <button
            onClick={() => {
              setEditingSocial(social.id);
              setEditValue(displayValue || "");
            }}
            className="absolute -top-1 -right-1 p-0.5 rounded-full bg-violet-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title={`Edit ${social.name}`}
          >
            <Edit2 className="w-2.5 h-2.5" />
          </button>
        </div>
      );
    }

    // Show add button for missing socials
    return (
      <button
        onClick={() => {
          setEditingSocial(social.id);
          setEditValue("");
        }}
        className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 hover:text-violet-500 hover:border-violet-500/50 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-all flex items-center gap-2 group"
      >
        <Plus className="w-4 h-4" />
        <span className="text-xs font-medium hidden sm:inline">Add {social.name}</span>
      </button>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <SectionHeader
        title="Developer Profile"
        subtitle="Manage your public links, view achievements, and review earned badges."
        badge="Verified Account"
        badgeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
      >
        <GradientButton onClick={handleShareProfile} className="py-2.5 px-4 text-xs">
          {copied ? "Code Copied!" : "Copy Referral Code"}
        </GradientButton>
      </SectionHeader>

      {/* Hero Profile Details Card */}
      <Card className="p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 border-slate-200/50 dark:border-slate-800/50">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Profile Avatar Frame with Active Badge indicator */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <div className="w-full h-full rounded-2xl overflow-hidden ring-4 ring-violet-500/20 shadow-xl">
            <img
              src={userData?.avatar || user?.photoURL || "https://avatars.githubusercontent.com/u/9919?v=4"}
              alt="Profile Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Active status bubble */}
          <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs text-white shadow-md animate-pulse">
            🔥
          </span>
        </div>

        {/* Bio information */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white my-0">
                {userData?.name || "Developer"}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                RankerHub PRO
              </span>
            </div>
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 block">
              @{userData?.githubUsername || "developer"} • {userData?.college || "Mumbai College"}
            </span>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl leading-relaxed font-medium">
            Verified RankerHub platform developer. Actively syncing repository activity to scale the leaderboard, sharing referral tokens, and resolving daily algorithmic arena challenges. ☕
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400" /> Mumbai, India</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" /> Joined {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString(undefined, {month: 'long', year: 'numeric'}) : "May 2026"}
            </span>
            <span className="flex items-center gap-1 text-violet-500">
              🎫 Referral Code: <span className="font-extrabold bg-violet-500/10 px-2 py-0.5 rounded-full select-all">{userData?.referralCode || "N/A"}</span>
            </span>
          </div>

          {/* Social Links Section */}
          <div className="flex justify-center md:justify-start items-center gap-3 pt-2 flex-wrap">
            {socialLinks.map((social) => (
              <div key={social.id}>
                {renderSocialButton(social)}
              </div>
            ))}
          </div>

        </div>

      </Card>

      {/* Grid: Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {profileStats.map((stat, idx) => (
          <Card key={idx} className="p-5 text-center flex flex-col items-center justify-center border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {stat.label}
            </span>
            <span className="block text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-none">
              {stat.value}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 block">
              {stat.detail}
            </span>
          </Card>
        ))}
      </div>

      {/* Grid: Verified GitHub Audit Snapshot & Points Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* GitHub Audit Snapshot */}
        <Card className="p-6 flex flex-col justify-between border-slate-200/50 dark:border-slate-800/50">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">GitHub Audit Snapshot</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Verified counts fetched once on onboarding to set GitRank points</p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="text-2xl mb-1">📝</div>
              <div>
                <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {userData?.githubStats?.commits || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">Commits</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="text-2xl mb-1">📁</div>
              <div>
                <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {userData?.githubStats?.repos || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">Repositories</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="text-2xl mb-1">⭐</div>
              <div>
                <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {userData?.githubStats?.stars || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">Stars Earned</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="text-2xl mb-1">👥</div>
              <div>
                <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {userData?.githubStats?.followers || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">Followers</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
            <span>Points mapping: Commits(+2) Repos(+5) Stars(+3) Followers(+2)</span>
            <span className="text-violet-600 dark:text-violet-400 font-bold">{gitRankPoints} GitPoints</span>
          </div>
        </Card>

        {/* Detailed Points breakdown */}
        <Card className="p-6 flex flex-col justify-between border-slate-200/50 dark:border-slate-800/50">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">Points Engine Breakdown</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Multi-engine ratings tracking points distributions</p>
          </div>

          <div className="my-6 space-y-3.5">
            {[
              { label: "GitRank Points", value: gitRankPoints, max: totalPoints || 1, color: "bg-blue-500" },
              { label: "CodingVerse Points", value: codingVersePoints, max: totalPoints || 1, color: "bg-purple-500" },
              { label: "Streak Points", value: streakPoints, max: totalPoints || 1, color: "bg-orange-500" },
              { label: "Referral Points", value: referralPoints, max: totalPoints || 1, color: "bg-emerald-500" },
              { label: "Total Points", value: totalPoints, max: totalPoints || 1, color: "bg-gradient-to-r from-violet-500 to-indigo-500", isTotal: true }
            ].map((engine, idx) => {
              const pct = Math.floor((engine.value / engine.max) * 100) || 0;
              return (
                <div key={idx} className={`space-y-1 ${engine.isTotal ? "pt-2 border-t border-slate-100 dark:border-slate-800 mt-2" : ""}`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={engine.isTotal ? "text-violet-600 dark:text-violet-400" : "text-slate-500"}>
                      {engine.label}
                    </span>
                    <span className={engine.isTotal ? "text-slate-900 dark:text-white" : "text-slate-500"}>
                      {engine.value} pts
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${engine.color} rounded-full transition-all duration-300`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold flex items-center justify-between">
            <span>Aggregated Rating Score</span>
            <span className="text-violet-600 dark:text-violet-400 font-extrabold text-xs">{totalPoints} TotalPoints</span>
          </div>
        </Card>

      </div>

      {/* Grid: Badges (Trophy Case) & Lotties */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Badges Box (Takes 2 cols) */}
        <Card className="lg:col-span-2 flex flex-col justify-between border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
                Badge Achievements Case
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Unlock specialized ratings badges by hitting milestones.
              </p>
            </div>
            <Award className="w-5 h-5 text-violet-500" />
          </div>

          {/* Badges List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            {systemBadges.map((badge) => {
              let unlocked = false;
              if (badge.id === "b1") unlocked = true;
              if (badge.id === "b2" && gitRankPoints >= 100) unlocked = true;
              if (badge.id === "b3" && streak >= 5) unlocked = true;
              if (badge.id === "b4" && referralPoints >= 100) unlocked = true;

              return (
                <div
                  key={badge.id}
                  className={`
                    relative overflow-hidden p-4 rounded-xl border flex items-center gap-3.5 group transition-all duration-300
                    ${unlocked 
                      ? "border-violet-500/20 bg-slate-50/50 dark:bg-slate-950/20" 
                      : "border-slate-200/30 dark:border-slate-800/20 bg-slate-100/10 dark:bg-slate-950/5 opacity-50"}
                  `}
                >
                  {unlocked && (
                    <div className="absolute right-2 top-2 w-7 h-7 flex-shrink-0 opacity-80 group-hover:scale-110 transition-transform">
                      <LottiePlayer animationData={successTick} loop={false} className="w-full h-full" />
                    </div>
                  )}

                  <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${badge.color} text-white flex items-center justify-center font-black text-sm shadow-md`}>
                    {badge.name.charAt(0)}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-200 leading-tight flex items-center gap-1">
                      {badge.name}
                      {!unlocked && <span className="text-[8px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Locked</span>}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                      {badge.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold text-center">
            Dynamically unlocked based on verified database scores.
          </div>
        </Card>

        {/* Global Trophy card */}
        <Card className="flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border-violet-500/15">
          <div className="w-40 h-40 flex items-center justify-center mb-4">
            <LottiePlayer animationData={trophyAnimation} loop={true} className="w-full h-full" />
          </div>
          
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 dark:text-white leading-tight my-0">
              Community Champion
            </h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-[200px] block">
              You are globally verified inside the top 1,000 developers.
            </span>
          </div>

          <div className="mt-6 flex items-center gap-1 text-[10px] font-black text-violet-600 dark:text-violet-400 bg-white/70 dark:bg-slate-900/60 border border-violet-500/20 px-3 py-1 rounded-xl shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            RankerHub Verified Member
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Profile;