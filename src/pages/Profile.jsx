import React, { useState, useEffect, useMemo, useRef } from "react";
import ReportModal from "../components/ReportModal";
import domtoimage from "dom-to-image-more";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  Plus,
  User,
  Building2,
  HelpCircle,
  Search,
  Image,
  AlertCircle,
  Zap,
  Share2,
  Code,
  Copy,
} from "lucide-react";
import { Github, Linkedin, Instagram } from "../components/ui/Icons";
import {
  query,
  collection,
  where,
  getCountFromServer,
  doc,
  getDoc,
  writeBatch,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import RankingBreakdown from "../components/dashboard/RankingBreakdown";
import successTick from "../assets/animations/succes_tick.json";
import trophyAnimation from "../assets/animations/trophy.json";
import { systemBadges } from "../constants";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import GradientButton from "../components/ui/GradientButton";
import Toast from "../components/ui/Toast";
import collegesList from "../data/colleges.json";

export const Profile = () => {
  const navigate = useNavigate();
  const {
    userData: authUserData,
    user,
    setUserData,
    syncGitHubData,
  } = useAuth();
  const { username: rawUsername } = useParams();
  const username = rawUsername ? decodeURIComponent(rawUsername) : undefined;
  const [publicProfile, setPublicProfile] = useState(null);
  const [loadingPublicProfile, setLoadingPublicProfile] = useState(!!username);
  const [showReport, setShowReport] = useState(false);

  const isOwnProfile =
    !username ||
    username === authUserData?.githubUsername ||
    username === user?.uid;

  // Utility to escape text for embedding in XML/SVG
  const escapeXml = (unsafe) => {
    if (unsafe == null) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (isOwnProfile) {
        setPublicProfile(null);
        setLoadingPublicProfile(false);
        return;
      }
      setLoadingPublicProfile(true);
      try {
        const q1 = query(
          collection(db, "users"),
          where("githubUsername", "==", username),
        );
        const snapshot1 = await getDocs(q1);
        if (!snapshot1.empty) {
          const profileData = snapshot1.docs[0].data();
          setPublicProfile(profileData);
          // Issue #585: Save to recently visited profiles in localStorage
          try {
            const key = "rh_recently_visited";
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            const entry = {
              username: profileData.githubUsername,
              name: profileData.name,
              avatar: profileData.avatar,
              visitedAt: Date.now(),
            };
            const filtered = existing.filter(
              (e) => e.username !== entry.username,
            );
            const updated = [entry, ...filtered].slice(0, 5);
            localStorage.setItem(key, JSON.stringify(updated));
          } catch (e) {
            console.error(e);
          }
        } else {
          const docRef = doc(db, "users", username);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setPublicProfile(docSnap.data());
          } else {
            setPublicProfile(null);
          }
        }
      } catch (error) {
        console.error("Error fetching public profile:", error);
        setPublicProfile(null);
      }
      setLoadingPublicProfile(false);
    };
    if (username && (authUserData || !user)) {
      fetchProfile();
    }
  }, [username, isOwnProfile, authUserData, user]);

  const userData = isOwnProfile ? authUserData : publicProfile;
  const [copied, setCopied] = useState(false);
  const [rank, setRank] = useState("Loading...");
  const [toasts, setToasts] = useState([]);
  const [editingSocial, setEditingSocial] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [updating, setUpdating] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [badgeSort, setBadgeSort] = useState("Default");
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editBio, setEditBio] = useState("");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [customCollege, setCustomCollege] = useState("");
  const [editError, setEditError] = useState("");

  const [editLearningTags, setEditLearningTags] = useState([]);
  const [learningInput, setLearningInput] = useState("");
  const editDropdownRef = useRef(null);
  const profileCardRef = useRef(null);

  // GitHub Real Heatmap State
  const [githubHeatmap, setGithubHeatmap] = useState({
    grid: Array.from({ length: 16 }, () =>
      Array.from({ length: 7 }, () => ({ intensity: 0, date: "", count: 0 })),
    ),
    total: 0,
  });

  const filteredColleges = useMemo(() => {
    if (collegeSearch.trim() === "" || collegeSearch === "Other") {
      return collegesList;
    }
    const searchLower = collegeSearch.toLowerCase();
    return collegesList.filter((col) =>
      col.toLowerCase().includes(searchLower),
    );
  }, [collegeSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        editDropdownRef.current &&
        !editDropdownRef.current.contains(event.target)
      ) {
        setShowCollegeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleOpenEditModal = () => {
    setEditName(userData?.name || "");
    setEditAvatar(userData?.avatar || user?.photoURL || "");
    setEditGender(userData?.gender || "");
    setEditDob(userData?.dob || "");
    setEditCity(userData?.city || "");

    const collegeVal = userData?.college || "";
    const isCustom = collegeVal && !collegesList.includes(collegeVal);
    if (isCustom) {
      setEditCollege("Other");
      setCustomCollege(collegeVal);
      setCollegeSearch("Other");
    } else {
      setEditCollege(collegeVal);
      setCollegeSearch(collegeVal);
      setCustomCollege("");
    }

    setEditError("");
    setEditLearningTags(userData?.learningTags || []);
    setEditBio(userData?.bio || "");
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    setEditError("");

    const finalName = editName.trim();
    const finalCity = editCity.trim();
    let finalCollege = editCollege;

    if (!finalName) {
      setEditError("Full name is required.");
      setUpdating(false);
      return;
    }
    if (!editGender) {
      setEditError("Please select your gender.");
      setUpdating(false);
      return;
    }
    if (!editDob) {
      setEditError("Please select your date of birth.");
      setUpdating(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (editDob > today) {
      setEditError("Date of birth cannot be in the future.");
      setUpdating(false);
      return;
    }

    const birthDate = new Date(editDob);
    const ageLimitDate = new Date();
    ageLimitDate.setFullYear(ageLimitDate.getFullYear() - 13);
    if (birthDate > ageLimitDate) {
      setEditError("You must be at least 13 years old.");
      setUpdating(false);
      return;
    }

    if (!finalCity) {
      setEditError("City is required.");
      setUpdating(false);
      return;
    }

    if (editCollege === "Other") {
      finalCollege = customCollege.trim();
      if (!finalCollege) {
        setEditError("Please specify your college name.");
        setUpdating(false);
        return;
      }
    } else if (!editCollege) {
      setEditError("Please select a college.");
      setUpdating(false);
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const updateData = {
        name: finalName,
        avatar: editAvatar.trim(),
        bio: editBio.trim(),
        gender: editGender,
        dob: editDob,
        city: finalCity,
        college: finalCollege,
        learningTags: editLearningTags,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userRef, updateData);

      if (setUserData) {
        setUserData((prev) => ({
          ...prev,
          ...updateData,
        }));
      }

      // Notify other tabs about avatar change
      if (updateData.avatar) {
        localStorage.setItem(
          "rh_avatar_updated",
          JSON.stringify({
            uid: user.uid,
            avatar: updateData.avatar,
            ts: Date.now(),
          }),
        );
      }

      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Profile updated successfully!",
          type: "success",
        },
      ]);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setEditError("Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const [localSocialLinks, setLocalSocialLinks] = useState({
    linkedinUrl: userData?.linkedinUrl || null,
    instagramHandle: userData?.instagramHandle || null,
    discordUsername: userData?.discordUsername || null,
  });

  useEffect(() => {
    if (user && userData?.githubUsername) {
      syncGitHubData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (userData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSocialLinks((prev) => ({
        ...prev,
        linkedinUrl: userData.linkedinUrl || null,
        instagramHandle: userData.instagramHandle || null,
        discordUsername: userData.discordUsername || null,
      }));
    }
  }, [userData]);

  useEffect(() => {
    if (!userData || !userData.points) return;

    const fetchRank = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("onboardingStatus", "==", "complete"),
          where(
            "points.gitRankPoints",
            ">",
            userData.points.gitRankPoints ?? 0,
          ),
        );
        const snapshot = await getCountFromServer(q);
        const currentRank = snapshot.data().count + 1;
        setRank(`#${currentRank}`);

        // Save rank snapshot if it is the user's own profile
        if (isOwnProfile && user?.uid) {
          const { saveRankSnapshot } =
            await import("../services/rankHistoryService");
          await saveRankSnapshot(
            user.uid,
            currentRank,
            userData.points.totalPoints,
            userData.timezone,
          );
        }
      } catch (err) {
        console.error("Error calculating dynamic rank:", err);
        setRank("#N/A");
      }
    };

    fetchRank();
  }, [userData, isOwnProfile, user]);

  // Fetch REAL Profile Heatmap Data for GitHub
  useEffect(() => {
    const fetchGithubHeatmap = async () => {
      const username = userData?.githubUsername;
      if (!username) return;

      try {
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
        );
        if (!res.ok) throw new Error("API Limit");

        const data = await res.json();
        const contributions = data.contributions || [];

        const last112 = contributions.slice(-112);
        let totalActivity = 0;
        const grid = [];
        let currentWeek = [];

        const dateFormatter = new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const todayMs = Date.now();

        last112.forEach((day, index) => {
          const c = day.count;
          totalActivity += c;
          let intensity = 0;

          if (c > 9) intensity = 4;
          else if (c > 5) intensity = 3;
          else if (c > 2) intensity = 2;
          else if (c > 0) intensity = 1;

          let dateStr;
          if (day.date) {
            dateStr = dateFormatter.format(new Date(day.date));
          } else {
            const daysAgo = 111 - index;
            dateStr = dateFormatter.format(todayMs - daysAgo * 86400000);
          }

          currentWeek.push({ intensity, date: dateStr, count: c });

          if (currentWeek.length === 7) {
            grid.push(currentWeek);
            currentWeek = [];
          }
        });

        if (grid.length < 16) {
          const diff = 16 - grid.length;
          for (let i = 0; i < diff; i++) {
            grid.unshift(
              Array.from({ length: 7 }, () => ({
                intensity: 0,
                date: "",
                count: 0,
              })),
            );
          }
        }

        setGithubHeatmap({ grid, total: totalActivity });
      } catch (err) {
        console.error("Profile heatmap fetch error:", err);
        setGithubHeatmap({
          grid: Array.from({ length: 16 }, () =>
            Array.from({ length: 7 }, () => ({
              intensity: 0,
              date: "",
              count: 0,
            })),
          ),
          total: 0,
        });
      }
    };

    fetchGithubHeatmap();
  }, [userData?.githubUsername]);

  // Issue #204: RankerHub Platform Activity Heatmap Logic
  const platformHeatmap = useMemo(() => {
    const logs = userData?.platformActivityLogs || [];
    const weeks = 16;
    const daysPerWeek = 7;
    const data = [];
    let activityTotal = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map timestamps to frequency counts
    const activityMap = {};
    logs.forEach((log) => {
      const d = new Date(log);
      d.setHours(0, 0, 0, 0);
      const key = d.getTime();
      activityMap[key] = (activityMap[key] || 0) + 1;
    });

    const todayMs = today.getTime();
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    for (let w = 0; w < weeks; w++) {
      const weekData = [];
      for (let d = 0; d < daysPerWeek; d++) {
        const daysAgo = (weeks - 1 - w) * daysPerWeek + (daysPerWeek - 1 - d);
        const targetTime = todayMs - daysAgo * 86400000;

        const count = activityMap[targetTime] || 0;
        activityTotal += count;

        let intensity = 0;
        if (count > 9) intensity = 4;
        else if (count > 5) intensity = 3;
        else if (count > 2) intensity = 2;
        else if (count > 0) intensity = 1;

        weekData.push({
          intensity,
          date: dateFormatter.format(targetTime),
          count,
        });
      }
      data.push(weekData);
    }
    return { grid: data, total: activityTotal };
  }, [userData?.platformActivityLogs]);

  const handleShareProfile = async () => {
    const code = userData?.referralCode || "NEWCODE";
    const profileUrl = `${window.location.origin}${window.location.pathname}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userData?.name || user?.displayName || "RankerHub User"}`,
          text: `Join RankerHub with my referral code: ${code}`,
          url: profileUrl,
        });
        setToasts((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            message: "Shared successfully.",
            type: "success",
          },
        ]);
        return;
      } catch {
        // user may have cancelled; fall through to clipboard fallback
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setCopied(true);
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Referral code copied to clipboard.",
          type: "success",
        },
      ]);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Share/copy failed", err);
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Failed to copy referral code.",
          type: "error",
        },
      ]);
    }
  };

  const handleSharePublicProfile = async () => {
    const usernameParam = userData?.githubUsername || username;
    const profileUrl = `${window.location.origin}/#/profile/${usernameParam}`;

    const shareData = {
      title: `${userData?.name || "Developer"}'s RankerHub Profile`,
      text: "Check out this ranking and achievements on RankerHub!",
      url: profileUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setToasts((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            message: "Profile shared successfully.",
            type: "success",
          },
        ]);
        return;
      } catch {
        // user may have cancelled; fall through to clipboard fallback
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(profileUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = profileUrl;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Profile link copied to clipboard.",
          type: "success",
        },
      ]);
    } catch (err) {
      console.error("Share/copy failed", err);
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Failed to copy profile link.",
          type: "error",
        },
      ]);
    }
  };

  const getEmbedMarkdown = () => {
    const domain = window.location.origin;
    const usernameParam = userData?.githubUsername || username || "developer";
    return `[![${userData?.name || "Developer"}'s RankerHub Stats](${domain}/api/og/profile/${usernameParam})](${domain}/#/profile/${usernameParam})`;
  };

  const handleCopyEmbed = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(getEmbedMarkdown());
      } else {
        const ta = document.createElement("textarea");
        ta.value = getEmbedMarkdown();
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Markdown copied to clipboard!",
          type: "success",
        },
      ]);
      setIsEmbedModalOpen(false);
    } catch (err) {
      console.error("Failed to copy", err);
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Failed to copy snippet.",
          type: "error",
        },
      ]);
    }
  };

  const handleDownloadProfileCard = async () => {
    if (!profileCardRef.current) {
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Profile card not available for export.",
          type: "error",
        },
      ]);
      return;
    }

    try {
      const original = profileCardRef.current;
      const clone = original.cloneNode(true);

      clone.querySelectorAll(".pointer-events-none").forEach((n) => n.remove());

      const copyComputedStyles = (sourceEl, targetEl) => {
        const computed = window.getComputedStyle(sourceEl);
        let cssText = "";
        for (let i = 0; i < computed.length; i++) {
          const prop = computed[i];
          try {
            cssText += `${prop}: ${computed.getPropertyValue(prop)}; `;
          } catch {
            // ignore inaccessible properties
          }
        }
        targetEl.style.cssText = cssText;
      };

      const inlineAllStyles = (srcRoot, tgtRoot) => {
        copyComputedStyles(srcRoot, tgtRoot);
        const srcChildren = Array.from(srcRoot.children || []);
        const tgtChildren = Array.from(tgtRoot.children || []);
        for (let i = 0; i < srcChildren.length; i++) {
          if (tgtChildren[i]) inlineAllStyles(srcChildren[i], tgtChildren[i]);
        }
      };

      try {
        inlineAllStyles(original, clone);
      } catch (e) {
        console.warn("Inline styles fallback:", e);
      }

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const rect = original.getBoundingClientRect();
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = `${Math.round(rect.width)}px`;
      clone.style.height = `${Math.round(rect.height)}px`;
      clone.style.boxSizing = "border-box";

      const isDev = import.meta.env.VITE_DEV_AUTH_BYPASS === "true";
      if (isDev) {
        const overlay = document.createElement("div");
        overlay.style.cssText = `position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,0.8);z-index:999999;padding:24px;`;

        const container = document.createElement("div");
        container.style.cssText = `position:relative;max-width:calc(100% - 48px);max-height:calc(100% - 48px);overflow:auto;padding:18px;border-radius:12px;`;

        const dbg = document.createElement("div");
        dbg.style.cssText =
          "position:absolute;left:12px;top:12px;padding:6px 10px;background:rgba(0,0,0,0.6);color:#fff;border-radius:6px;font-size:12px;z-index:100000";
        dbg.textContent = `Preview nodes: ${clone.getElementsByTagName("*").length}`;

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Close Preview";
        closeBtn.style.cssText =
          "position:absolute;right:12px;top:12px;padding:6px 10px;background:#111827;color:#fff;border-radius:8px;border:none;cursor:pointer;z-index:100000";
        closeBtn.onclick = () => {
          if (overlay && overlay.parentNode)
            overlay.parentNode.removeChild(overlay);
        };

        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "Download Preview as PNG";
        downloadBtn.style.cssText =
          "position:absolute;right:140px;top:12px;padding:6px 10px;background:#7c3aed;color:#fff;border-radius:8px;border:none;cursor:pointer;z-index:100000";
        downloadBtn.onclick = async () => {
          try {
            const width = 1200;
            const height = 630;

            const imgToDataUrl = async (url) => {
              try {
                const res = await fetch(url, { mode: "cors" });
                const blob = await res.blob();
                return await new Promise((resolve, reject) => {
                  const fr = new FileReader();
                  fr.onload = () => resolve(fr.result);
                  fr.onerror = reject;
                  fr.readAsDataURL(blob);
                });
              } catch (e) {
                console.warn("Avatar fetch failed, using blank:", e);
                return null;
              }
            };

            const avatarUrl =
              (userData && (userData.avatar || user?.photoURL)) ||
              "https://avatars.githubusercontent.com/u/9919?v=4";
            const avatarData = await imgToDataUrl(avatarUrl);

            const svgParts = [];
            svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
            svgParts.push(
              `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
            );
            svgParts.push(`<defs>`);
            svgParts.push(`<style><![CDATA[
              .title{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;fill:#ffffff;font-weight:800}
              .meta{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto;fill:#93c5fd}
              .body{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto;fill:rgba(255,255,255,0.85)}
            ]]></style>`);
            svgParts.push(
              `<linearGradient id="g1" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#0b1220"/></linearGradient>`,
            );
            svgParts.push(`</defs>`);
            svgParts.push(
              `<rect width="100%" height="100%" rx="16" fill="url(#g1)"/>`,
            );

            const avatarX = 48;
            const avatarY = 48;
            const avatarSize = 160;
            if (avatarData) {
              svgParts.push(
                `<image href="${avatarData}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" style="border-radius:16px;" preserveAspectRatio="xMidYMid slice" />`,
              );
            } else {
              svgParts.push(
                `<rect x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" rx="16" fill="#111827"/>`,
              );
            }

            const textX = avatarX + avatarSize + 36;
            const textY = avatarY + 36;
            const displayName =
              (userData && userData.name) ||
              (user && user.displayName) ||
              "Developer";
            const usernameHandle =
              (userData && userData.githubUsername) || "developer";
            const collegeName =
              (userData && userData.college) || "Mumbai College";
            const referralCode = (userData && userData.referralCode) || "N/A";

            svgParts.push(
              `<text x="${textX}" y="${textY}" class="title" font-size="48">${escapeXml(displayName)}</text>`,
            );
            svgParts.push(
              `<text x="${textX}" y="${textY + 40}" class="meta" font-size="18">@${escapeXml(usernameHandle)} • ${escapeXml(collegeName)}</text>`,
            );

            const description =
              "Verified RankerHub platform developer. Actively syncing repository activity to scale the leaderboard, sharing referral tokens, and resolving daily algorithmic arena challenges.";
            const wrapTextLines = (text, maxChars) => {
              const words = text.split(" ");
              const lines = [];
              let cur = "";
              for (const w of words) {
                if ((cur + " " + w).trim().length <= maxChars) {
                  cur = (cur + " " + w).trim();
                } else {
                  if (cur) lines.push(cur);
                  cur = w;
                }
              }
              if (cur) lines.push(cur);
              return lines;
            };
            const descLines = wrapTextLines(description, 56);
            for (let i = 0; i < descLines.length; i++) {
              const line = descLines[i];
              const y = textY + 56 + i * 20;
              svgParts.push(
                `<text x="${textX}" y="${y}" class="body" font-size="14">${escapeXml(line)}</text>`,
              );
            }

            svgParts.push(
              `<g transform="translate(${width - 260},${avatarY})">`,
            );
            svgParts.push(
              `<text x="0" y="20" class="meta" font-size="14">RankerHub</text>`,
            );
            svgParts.push(
              `<text x="0" y="50" class="title" font-size="20">Shareable Profile Card</text>`,
            );
            svgParts.push(
              `<rect x="0" y="80" width="220" height="60" rx="8" fill="rgba(255,255,255,0.04)" />`,
            );
            svgParts.push(
              `<text x="12" y="105" class="meta" font-size="12">Referral</text>`,
            );
            svgParts.push(
              `<text x="12" y="137" class="title" font-size="18">${escapeXml(referralCode)}</text>`,
            );
            svgParts.push(`</g>`);
            svgParts.push(`</svg>`);

            const svgString = svgParts.join("\n");
            const blob = new Blob([svgString], {
              type: "image/svg+xml;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);

            await new Promise((resolve, reject) => {
              const img = new window.Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext("2d");
                  ctx.fillStyle =
                    getComputedStyle(document.body).backgroundColor ||
                    "#0b1220";
                  ctx.fillRect(0, 0, width, height);
                  ctx.drawImage(img, 0, 0, width, height);
                  const dataUrl = canvas.toDataURL("image/png");
                  const link = document.createElement("a");
                  link.download = `${userData?.githubUsername || userData?.name || "profile"}-rankerhub.png`;
                  link.href = dataUrl;
                  link.click();
                  URL.revokeObjectURL(url);
                  resolve();
                } catch (err) {
                  URL.revokeObjectURL(url);
                  reject(err);
                }
              };
              img.onerror = (e) => {
                URL.revokeObjectURL(url);
                reject(e);
              };
              img.src = url;
            });
          } catch (err) {
            console.error("SVG export failed", err);
            setToasts((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                message: "SVG export failed.",
                type: "error",
              },
            ]);
          }
        };

        try {
          const avatarUrl =
            (userData && (userData.avatar || user?.photoURL)) ||
            "https://avatars.githubusercontent.com/u/9919?v=4";
          const displayName =
            (userData && userData.name) ||
            (user && user.displayName) ||
            "Developer";
          const usernameHandle =
            (userData && userData.githubUsername) || "developer";
          const collegeName =
            (userData && userData.college) || "Mumbai College";
          const referralCode = (userData && userData.referralCode) || "N/A";
          const simpleHtml = `
            <div style="width:100%;max-width:980px;border-radius:12px;overflow:hidden;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;background:linear-gradient(135deg,#0f172a,#0b1220);color:#fff;box-shadow:0 10px 30px rgba(2,6,23,0.6);">
              <div style="display:flex;gap:20px;align-items:center;padding:28px;">
                <div style="width:120px;height:120px;border-radius:16px;overflow:hidden;flex-shrink:0;border:4px solid rgba(255,255,255,0.06);">
                  <img src="${avatarUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;display:block;" />
                </div>
                <div style="flex:1;">
                  <div style="font-size:36px;font-weight:800;margin-bottom:6px">${displayName}</div>
                  <div style="color:#93c5fd;font-size:14px">@${usernameHandle} • ${collegeName}</div>
                  <p style="color:rgba(255,255,255,0.8);margin-top:12px;max-width:820px;font-size:14px">Verified RankerHub platform developer. Actively syncing repository activity to scale the leaderboard, sharing referral tokens, and resolving daily algorithmic arena challenges.</p>
                </div>
                <div style="width:220px;text-align:right;padding-left:8px;">
                  <div style="color:#9ca3af;font-size:13px">RankerHub</div>
                  <div style="font-size:16px;font-weight:700;margin-top:8px">Shareable Profile Card</div>
                  <div style="margin-top:18px;background:rgba(255,255,255,0.04);padding:10px;border-radius:10px;">
                    <div style="font-size:12px;color:#9ca3af">Referral</div>
                    <div style="font-weight:800">${referralCode}</div>
                  </div>
                </div>
              </div>
            </div>
          `;

          container.innerHTML = simpleHtml;
        } catch {
          try {
            container.appendChild(clone);
          } catch {
            container.innerHTML = clone.outerHTML;
          }
        }

        overlay.appendChild(container);
        overlay.appendChild(dbg);
        overlay.appendChild(closeBtn);
        overlay.appendChild(downloadBtn);
        document.body.appendChild(overlay);
        return;
      }

      document.body.appendChild(clone);
      const dataUrl = await domtoimage.toPng(clone, {
        cacheBust: true,
        bgcolor: null,
      });
      document.body.removeChild(clone);

      const link = document.createElement("a");
      link.download = `${userData?.githubUsername || userData?.name || "profile"}-rankerhub.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export error", err);
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Failed to export profile card.",
          type: "error",
        },
      ]);
    }
  };

  const getDiscordProfileUrl = (discordValue) => {
    if (!discordValue) return null;
    const value = discordValue.trim();
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    const userId = value.replace(/^@/, "");
    return `https://discord.com/users/${encodeURIComponent(userId)}`;
  };

  const handleUpdateSocialLink = async (type, value) => {
    if (!user) return;

    setUpdating(true);
    try {
      const userRef = doc(db, "users", user.uid);

      const userDocSnap = await getDoc(userRef);
      if (!userDocSnap.exists()) {
        setToasts((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            message: "Profile not found. Please try again.",
            type: "error",
          },
        ]);
        return;
      }

      if (userDocSnap.data().uid !== user.uid) {
        setToasts((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            message: "Unauthorized: You can only update your own profile.",
            type: "error",
          },
        ]);
        return;
      }

      const updateData = {};
      let processedValue = null;

      if (type === "linkedin") {
        if (value && value.trim()) {
          let linkedinUrl = value.trim();
          if (
            !linkedinUrl.startsWith("http://") &&
            !linkedinUrl.startsWith("https://")
          ) {
            linkedinUrl = "https://" + linkedinUrl;
          }
          processedValue = linkedinUrl;
        }
        updateData.linkedinUrl = processedValue;
      } else if (type === "instagram") {
        if (value && value.trim()) {
          processedValue = value.trim().replace(/^@/, "");
        }
        updateData.instagramHandle = processedValue;
      } else if (type === "discord") {
        if (value && value.trim()) {
          processedValue = value.trim().replace(/^@/, "");
        }
        updateData.discordUsername = processedValue;
      }

      updateData.updatedAt = new Date().toISOString();

      const batch = writeBatch(db);
      batch.update(userRef, updateData);
      await batch.commit();

      const updatedUserDoc = await getDoc(userRef);
      const updatedData = updatedUserDoc.exists()
        ? updatedUserDoc.data()
        : null;

      setLocalSocialLinks((prev) => ({
        ...prev,
        [type === "linkedin"
          ? "linkedinUrl"
          : type === "instagram"
            ? "instagramHandle"
            : "discordUsername"]: processedValue,
      }));

      if (setUserData && updatedData) {
        setUserData((prev) => ({
          ...prev,
          ...updatedData,
        }));
      }

      setEditingSocial(null);
      setEditValue("");

      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`,
          type: "success",
        },
      ]);
    } catch (err) {
      console.error("Error updating social link:", err);
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: `Failed to update ${type}. Please try again.`,
          type: "error",
        },
      ]);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrivateSyncToggle = async () => {
    if (!user) return;
    try {
      const isEnabling = !userData?.privateRepoSyncEnabled;
      const userRef = doc(db, "users", user.uid);

      const batch = writeBatch(db);
      batch.update(userRef, { privateRepoSyncEnabled: isEnabling });
      await batch.commit();

      if (setUserData) {
        setUserData((prev) => ({
          ...prev,
          privateRepoSyncEnabled: isEnabling,
        }));
      }

      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: isEnabling
            ? "Private repository sync enabled!"
            : "Private repository sync disabled.",
          type: "success",
        },
      ]);
    } catch (err) {
      console.error("Toggle sync error:", err);
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Failed to update sync preferences. Please try again.",
          type: "error",
        },
      ]);
    }
  };

  const totalPoints = userData?.points?.totalPoints || 0;
  const gitRankPoints = userData?.points?.gitRankPoints || 0;
  const referralPoints = userData?.points?.referralPoints || 0;
  const streakPoints = userData?.points?.streakPoints || 0;
  const codingVersePoints = userData?.points?.codingVersePoints || 0;
  const streak = userData?.streak ?? 0;
  const pointsEngines = [
    { label: "GitRank Points", value: gitRankPoints, color: "bg-blue-500" },
    {
      label: "CodingVerse Points",
      value: codingVersePoints,
      color: "bg-purple-500",
    },
    { label: "Streak Points", value: streakPoints, color: "bg-orange-500" },
    {
      label: "Referral Points",
      value: referralPoints,
      color: "bg-emerald-500",
    },
  ];
  const earnedPointsTotal = pointsEngines.reduce(
    (sum, engine) => sum + Math.max(engine.value, 0),
    0,
  );

  const getGithubIntensityColor = (intensity) => {
    switch (intensity) {
      case 4:
        return "bg-emerald-600 dark:bg-emerald-500";
      case 3:
        return "bg-emerald-500/80 dark:bg-emerald-500/80";
      case 2:
        return "bg-emerald-400/60 dark:bg-emerald-400/60";
      case 1:
        return "bg-emerald-300/40 dark:bg-emerald-300/40";
      default:
        return "bg-slate-100 dark:bg-slate-800/50";
    }
  };

  const getPlatformIntensityColor = (intensity) => {
    switch (intensity) {
      case 4:
        return "bg-violet-600 dark:bg-violet-500";
      case 3:
        return "bg-violet-500/80 dark:bg-violet-500/80";
      case 2:
        return "bg-violet-400/60 dark:bg-violet-400/60";
      case 1:
        return "bg-violet-300/40 dark:bg-violet-300/40";
      default:
        return "bg-slate-100 dark:bg-slate-800/50";
    }
  };

  const DiscordIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.21.3753-.444.8643-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.163-.3852-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C2.5092 7.7761 1.862 11.0615 2.183 14.3025a.074.074 0 0 0 .0283.0479 19.9411 19.9411 0 0 0 6.0017 2.9829.0766.0766 0 0 0 .0791-.022c.4616-.6257.8731-1.2855 1.231-1.9798a.0745.0745 0 0 0-.041-.105c-.6486-.2477-1.2671-.5545-1.8551-.9069a.074.074 0 0 1-.025-.0968.074.074 0 0 1 .0959-.0291c.123.0769.2437.1567.3616.2393a12.5958 12.5958 0 0 0 7.6554 0c.1179-.0826.2387-.1624.3616-.2393a.074.074 0 0 1 .096.0288.074.074 0 0 1-.025.097c-.588.3524-1.2065.6592-1.8551.9069a.0745.0745 0 0 0-.041.105c.3579.6943.7694 1.3541 1.231 1.9798a.076.076 0 0 0 .0791.022 19.94 19.94 0 0 0 6.0017-2.9829.074.074 0 0 0 .0283-.0479c.379-3.7757-.607-7.0224-2.538-10.0367a.069.069 0 0 0-.032-.0278zM8.4966 12.5148c-1.182 0-2.148-1.0903-2.148-2.427s.955-2.427 2.148-2.427c1.192 0 2.158 1.0903 2.148 2.427 0 1.3367-.956 2.427-2.148 2.427zm6.999 0c-1.182 0-2.148-1.0903-2.148-2.427s.955-2.427 2.148-2.427c1.192 0 2.158 1.0903 2.148 2.427 0 1.3367-.956 2.427-2.148 2.427z" />
    </svg>
  );

  const profileStats = [
    {
      label: "XP Points",
      value: totalPoints.toLocaleString(),
      detail: "Total Earned XP",
    },
    {
      label: "Git Rank",
      value: rank,
      detail:
        rank === "Loading..."
          ? "Calculating..."
          : "Global leaderboard position",
    },
    {
      label: "Active Streak",
      value: `${streak} Day${streak !== 1 ? "s" : ""}`,
      detail: "Consecutive daily logins",
    },
    {
      label: "Invites Shared",
      value: `${Math.floor(referralPoints / 100)} Used`,
      detail: "Referral code successes",
    },
  ];

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
      showAddButton: false,
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
      showAddButton: false,
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
      placeholder: "LinkedIn URL or profile ID",
      type: "url",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      hasLink: !!localSocialLinks.instagramHandle,
      link: localSocialLinks.instagramHandle
        ? `https://instagram.com/${localSocialLinks.instagramHandle}`
        : null,
      value: localSocialLinks.instagramHandle,
      color: "hover:bg-pink-500/10 hover:text-pink-500",
      textColor: "text-slate-500",
      placeholder: "@username or username",
      type: "username",
    },
    {
      id: "discord",
      name: "Discord",
      icon: DiscordIcon,
      hasLink: !!localSocialLinks.discordUsername,
      link: getDiscordProfileUrl(localSocialLinks.discordUsername),
      value: localSocialLinks.discordUsername,
      color: "hover:bg-indigo-500/10 hover:text-indigo-600",
      textColor: "text-slate-500",
      placeholder: "Discord user ID",
      type: "username",
    },
  ];

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
              if (e.key === "Enter") {
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
          <span className="text-xs font-medium hidden sm:inline">
            {social.name}
          </span>
        </a>
      );
    }

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
              <span className="text-xs font-medium hidden sm:inline">
                {social.name}
              </span>
            </a>
          ) : (
            <div
              className={`p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ${social.textColor} transition-all ${social.color} flex items-center gap-2 cursor-default`}
              title={displayValue}
            >
              <social.icon className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">
                {social.name}
              </span>
            </div>
          )}
          {isOwnProfile && (
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
          )}
        </div>
      );
    }

    if (!isOwnProfile) return null;

    return (
      <button
        onClick={() => {
          setEditingSocial(social.id);
          setEditValue("");
        }}
        className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 hover:text-violet-500 hover:border-violet-500/50 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-all flex items-center gap-2 group"
      >
        <Plus className="w-4 h-4" />
        <span className="text-xs font-medium hidden sm:inline">
          Add {social.name}
        </span>
      </button>
    );
  };

  if (loadingPublicProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Profile not found
        </h2>
        <p className="text-slate-500 mt-2">
          The developer you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title={
          isOwnProfile
            ? "Developer Profile"
            : `${userData?.name || "Developer"}'s Profile`
        }
        subtitle={
          isOwnProfile
            ? "Manage your public links, view achievements, and review earned badges."
            : `View ${userData?.name || "this developer"}'s achievements and badges.`
        }
        badge="Verified Account"
        badgeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
      >
        {isOwnProfile && (
          <>
            <GradientButton
              onClick={handleOpenEditModal}
              variant="secondary"
              className="py-2.5 px-4 text-xs"
            >
              Edit Profile
            </GradientButton>
            <GradientButton
              onClick={handleShareProfile}
              className="py-2.5 px-4 text-xs"
            >
              {copied ? "Code Copied!" : "Copy Referral Code"}
            </GradientButton>
            <GradientButton
              onClick={handleDownloadProfileCard}
              className="py-2.5 px-4 text-xs"
            >
              Download Profile Card
            </GradientButton>
            <GradientButton
              onClick={() => navigate("/dashboard/profile/card-builder")}
              className="py-2.5 px-4 text-xs bg-gradient-to-r from-blue-500 to-indigo-500"
            >
              Build GitHub DevCard
            </GradientButton>
          </>
        )}
        <GradientButton
          onClick={handleSharePublicProfile}
          variant="secondary"
          className="py-2.5 px-4 text-xs flex items-center gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Profile
        </GradientButton>
        <GradientButton
          onClick={() => setIsEmbedModalOpen(true)}
          variant="secondary"
          className="py-2.5 px-4 text-xs flex items-center gap-1.5"
        >
          <Code className="w-3.5 h-3.5" />
          Embed
        </GradientButton>
      </SectionHeader>

      <Card
        ref={profileCardRef}
        className="p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 border-slate-200/50 dark:border-slate-800/50"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-32 h-32 flex-shrink-0">
          <div className="w-full h-full rounded-2xl overflow-hidden ring-4 ring-violet-500/20 shadow-xl">
            <img
              src={
                userData?.avatar ||
                user?.photoURL ||
                "https://avatars.githubusercontent.com/u/9919?v=4"
              }
              alt="Profile Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs text-white shadow-md animate-pulse">
            🔥
          </span>
        </div>

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
              @{userData?.githubUsername || "developer"} •{" "}
              {userData?.college || "Mumbai College"}
            </span>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl leading-relaxed font-medium">
            Verified RankerHub platform developer. Actively syncing repository
            activity to scale the leaderboard, sharing referral tokens, and
            resolving daily algorithmic arena challenges. ☕
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-slate-400" />{" "}
              {userData?.city || "Mumbai"}, India
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" /> Joined{" "}
              {userData?.createdAt
                ? new Date(userData.createdAt).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })
                : "May 2026"}
            </span>
            {isOwnProfile && (
              <span className="flex items-center gap-1 text-violet-500">
                🎫 Referral Code:{" "}
                <span className="font-extrabold bg-violet-500/10 px-2 py-0.5 rounded-full select-all">
                  {userData?.referralCode || "N/A"}
                </span>
              </span>
            )}
          </div>

          <div className="flex justify-center md:justify-start items-center gap-3 pt-2 flex-wrap">
            {socialLinks.map((social) => (
              <div key={social.id}>{renderSocialButton(social)}</div>
            ))}
          </div>

          {/* ✅ Report User Button - only visible to logged-in users on other people's profiles */}
          {!isOwnProfile && user && (
            <div className="flex justify-center md:justify-start mt-2">
              <button
                onClick={() => setShowReport(true)}
                className="text-red-500 border border-red-300 px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-semibold transition-colors"
              >
                🚩 Report User
              </button>
            </div>
          )}

          {/* ✅ Report Modal */}
          {showReport && (
            <ReportModal
              reportedUid={publicProfile?.uid}
              reporterUid={user?.uid}
              onClose={() => setShowReport(false)}
              toast={{
                success: (msg) =>
                  setToasts((prev) => [
                    ...prev,
                    {
                      id: Date.now() + Math.random(),
                      message: msg,
                      type: "success",
                    },
                  ]),
                error: (msg) =>
                  setToasts((prev) => [
                    ...prev,
                    {
                      id: Date.now() + Math.random(),
                      message: msg,
                      type: "error",
                    },
                  ]),
              }}
            />
          )}

          <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-2 w-80">
            <AnimatePresence>
              {toasts.map((toast) => (
                <Toast
                  key={toast.id}
                  message={toast.message}
                  type={toast.type}
                  onClose={() =>
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </Card>

      {isOwnProfile && (
        <Card className="mb-6 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-slate-200/50 dark:border-slate-800/50">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0 flex items-center gap-2">
              <Github className="w-5 h-5 text-slate-700 dark:text-slate-300" />{" "}
              Private Repository Sync
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Enable indexing for private repositories to earn points for your
              private commits, PRs, and reviews.
            </p>
          </div>

          <button
            onClick={handlePrivateSyncToggle}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex-shrink-0 ${
              userData?.privateRepoSyncEnabled
                ? "bg-violet-500"
                : "bg-slate-300 dark:bg-slate-700"
            }`}
            role="switch"
            aria-checked={userData?.privateRepoSyncEnabled}
          >
            <span className="sr-only">Enable Private Repo Sync</span>
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                userData?.privateRepoSyncEnabled
                  ? "translate-x-8"
                  : "translate-x-1"
              }`}
            />
          </button>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {profileStats.map((stat, idx) => (
          <Card
            key={idx}
            className="p-5 text-center flex flex-col items-center justify-center border-slate-200/50 dark:border-slate-800/50"
          >
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6 border-slate-200/50 dark:border-slate-800/50 overflow-x-auto flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 min-w-max">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0 flex items-center gap-2">
                <Github className="w-5 h-5 text-emerald-500" /> GitHub Activity
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Verified repository commits over the last 16 weeks.
              </p>
            </div>
            <div className="text-right">
              <span className="block text-xl font-black text-slate-900 dark:text-white leading-none">
                {githubHeatmap.total.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">
                Total Commits
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-start min-w-max flex-1">
            <div className="flex gap-1">
              <div className="grid grid-rows-7 gap-1 pr-2 text-[9px] font-bold text-slate-400">
                <span className="row-start-2 h-3 sm:h-4 flex items-center justify-end">
                  Mon
                </span>
                <span className="row-start-4 h-3 sm:h-4 flex items-center justify-end">
                  Wed
                </span>
                <span className="row-start-6 h-3 sm:h-4 flex items-center justify-end">
                  Fri
                </span>
              </div>

              <div className="flex gap-1">
                {githubHeatmap.grid.map((week, wIdx) => (
                  <div key={`gh-${wIdx}`} className="flex flex-col gap-1">
                    {week.map((day, dIdx) => (
                      <div
                        key={`gh-${wIdx}-${dIdx}`}
                        className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${getGithubIntensityColor(day.intensity)} transition-colors hover:ring-2 ring-slate-400/50 cursor-crosshair`}
                        title={`${day.count > 0 ? day.count : "No"} commits${day.date ? ` on ${day.date}` : ""}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-end w-full gap-2 text-[10px] font-bold text-slate-400">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800/50" />
                <div className="w-3 h-3 rounded-sm bg-emerald-300/40 dark:bg-emerald-300/40" />
                <div className="w-3 h-3 rounded-sm bg-emerald-400/60 dark:bg-emerald-400/60" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/80 dark:bg-emerald-500/80" />
                <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
              </div>
              <span>More</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200/50 dark:border-slate-800/50 overflow-x-auto flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 min-w-max">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0 flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-500" /> Platform Activity
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Internal interactions, check-ins, and CodingVerse solves.
              </p>
            </div>
            <div className="text-right">
              <span className="block text-xl font-black text-slate-900 dark:text-white leading-none">
                {platformHeatmap.total.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">
                Platform Events
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-start min-w-max flex-1">
            <div className="flex gap-1">
              <div className="grid grid-rows-7 gap-1 pr-2 text-[9px] font-bold text-slate-400">
                <span className="row-start-2 h-3 sm:h-4 flex items-center justify-end">
                  Mon
                </span>
                <span className="row-start-4 h-3 sm:h-4 flex items-center justify-end">
                  Wed
                </span>
                <span className="row-start-6 h-3 sm:h-4 flex items-center justify-end">
                  Fri
                </span>
              </div>

              <div className="flex gap-1">
                {platformHeatmap.grid.map((week, wIdx) => (
                  <div key={`plat-${wIdx}`} className="flex flex-col gap-1">
                    {week.map((day, dIdx) => (
                      <div
                        key={`plat-${wIdx}-${dIdx}`}
                        className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${getPlatformIntensityColor(day.intensity)} transition-colors hover:ring-2 ring-slate-400/50 cursor-crosshair`}
                        title={`${day.count > 0 ? day.count : "No"} interactions${day.date ? ` on ${day.date}` : ""}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-end w-full gap-2 text-[10px] font-bold text-slate-400">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800/50" />
                <div className="w-3 h-3 rounded-sm bg-violet-300/40 dark:bg-violet-300/40" />
                <div className="w-3 h-3 rounded-sm bg-violet-400/60 dark:bg-violet-400/60" />
                <div className="w-3 h-3 rounded-sm bg-violet-500/80 dark:bg-violet-500/80" />
                <div className="w-3 h-3 rounded-sm bg-violet-600 dark:bg-violet-500" />
              </div>
              <span>More</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col justify-between border-slate-200/50 dark:border-slate-800/50">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
              GitHub Audit Snapshot
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Verified counts fetched once on onboarding to set GitRank points
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="text-2xl mb-1">📝</div>
              <div>
                <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {userData?.githubStats?.commits || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">
                  Commits
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="text-2xl mb-1">📁</div>
              <div>
                <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {userData?.githubStats?.repos || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">
                  Repositories
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="text-2xl mb-1">⭐</div>
              <div>
                <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {userData?.githubStats?.stars || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">
                  Stars Earned
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="text-2xl mb-1">👥</div>
              <div>
                <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {userData?.githubStats?.followers || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">
                  Followers
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
            <span>
              Points mapping: Commits(+2) Repos(+5) Stars(+3) Followers(+2)
            </span>
            <span className="text-violet-600 dark:text-violet-400 font-bold">
              {gitRankPoints} GitPoints
            </span>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between border-slate-200/50 dark:border-slate-800/50">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
              Points Engine Breakdown
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Multi-engine ratings tracking points distributions
            </p>
          </div>

          <div className="my-6 space-y-3.5">
            {[
              ...pointsEngines.map((engine) => ({
                ...engine,
                max: totalPoints || 1,
              })),
              {
                label: "Total Points",
                value: totalPoints,
                max: totalPoints || 1,
                isTotal: true,
              },
            ].map((engine, idx) => {
              const pct = Math.floor((engine.value / engine.max) * 100) || 0;
              return (
                <div
                  key={idx}
                  className={`space-y-1 ${engine.isTotal ? "pt-2 border-t border-slate-100 dark:border-slate-800 mt-2" : ""}`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span
                      className={
                        engine.isTotal
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-slate-500"
                      }
                    >
                      {engine.label}
                    </span>
                    <span
                      className={
                        engine.isTotal
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-500"
                      }
                    >
                      {engine.value} pts
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                    {engine.isTotal ? (
                      <div className="flex h-full w-full">
                        {pointsEngines.map((segment) => {
                          const segmentPct = earnedPointsTotal
                            ? (Math.max(segment.value, 0) / earnedPointsTotal) *
                              100
                            : 0;

                          return (
                            <div
                              key={segment.label}
                              className={`h-full ${segment.color} transition-all duration-300`}
                              style={{ width: `${segmentPct}%` }}
                              title={`${segment.label}: ${Math.round(segmentPct)}%`}
                              aria-label={`${segment.label}: ${Math.round(segmentPct)}% of total points`}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className={`h-full ${engine.color} rounded-full transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold flex items-center justify-between">
            <span>Aggregated Rating Score</span>
            <span className="text-violet-600 dark:text-violet-400 font-extrabold text-xs">
              {totalPoints} TotalPoints
            </span>
          </div>
        </Card>
      </div>

      {/* Trust Score Scorecard */}
      {(() => {
        const trustScore = userData?.points?.trustScore ?? null;

        // Tier derivation mirrors trustScoreService.getTrustTier
        let tier = {
          label: "Not Synced",
          color: "text-slate-400",
          badgeBg: "bg-slate-500/10 border-slate-500/20",
          description: "Sync your GitHub data to calculate your Trust Score.",
        };
        if (trustScore !== null) {
          if (trustScore >= 90)
            tier = {
              label: "High Trust",
              color: "text-emerald-500",
              badgeBg: "bg-emerald-500/10 border-emerald-500/20",
              description:
                "Outstanding contribution quality, active peer code reviews, and strong open-source presence.",
            };
          else if (trustScore >= 70)
            tier = {
              label: "Verified",
              color: "text-blue-500",
              badgeBg: "bg-blue-500/10 border-blue-500/20",
              description:
                "Consistent, legitimate activities across multiple public repositories with clear documentation.",
            };
          else if (trustScore >= 50)
            tier = {
              label: "Basic",
              color: "text-slate-500",
              badgeBg: "bg-slate-500/10 border-slate-500/20",
              description:
                "Initial ranking signal. Contributions are valid but concentrated in self-owned repositories.",
            };
          else
            tier = {
              label: "Low Trust",
              color: "text-amber-500",
              badgeBg: "bg-amber-500/10 border-amber-500/20",
              description:
                "Suspicious commit frequency, low-content messages, or repetitive commit triggers detected.",
            };
        }

        const scoreSegments = [
          { label: "PR Merge Rate", emoji: "🔀", positive: true, max: 15 },
          { label: "Code Reviews", emoji: "🔍", positive: true, max: 10 },
          {
            label: "External Contributions",
            emoji: "🌐",
            positive: true,
            max: 15,
          },
          {
            label: "Community Appreciation",
            emoji: "⭐",
            positive: true,
            max: 10,
          },
          {
            label: "Low-content Commits",
            emoji: "⚠️",
            positive: false,
            max: 15,
          },
          { label: "Repeated Commits", emoji: "🔁", positive: false, max: 10 },
          {
            label: "Activity Concentration",
            emoji: "🎯",
            positive: false,
            max: 5,
          },
        ];

        return (
          <div className="mb-0">
            <Card className="p-6 border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-violet-600/5 via-transparent to-blue-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-violet-500" />{" "}
                    Developer Trust Score
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Quality-based ranking signal — evaluates contribution
                    impact, not just volume.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`block text-4xl font-black leading-none ${tier.color}`}
                    >
                      {trustScore !== null ? trustScore : "—"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">
                      out of 100
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-lg border text-xs font-black ${tier.badgeBg} ${tier.color}`}
                  >
                    {tier.label}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
                  {tier.description}
                </p>

                {/* Score bar: base (50) + positives fills left, deductions eat from right */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                    <span>Score Composition</span>
                    <span>
                      {trustScore !== null ? `${trustScore}/100` : "—"}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden flex">
                    {trustScore !== null && (
                      <>
                        {/* Filled portion */}
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${trustScore}%`,
                            background:
                              trustScore >= 90
                                ? "linear-gradient(90deg,#10b981,#34d399)"
                                : trustScore >= 70
                                  ? "linear-gradient(90deg,#3b82f6,#60a5fa)"
                                  : trustScore >= 50
                                    ? "linear-gradient(90deg,#6366f1,#818cf8)"
                                    : "linear-gradient(90deg,#f59e0b,#fbbf24)",
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Signal breakdown table */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                  {scoreSegments.map((seg, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                        <span>{seg.emoji}</span>
                        {seg.label}
                      </span>
                      <span
                        className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                          seg.positive
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : "text-red-500 dark:text-red-400 bg-red-500/10"
                        }`}
                      >
                        {seg.positive ? `+${seg.max} max` : `-${seg.max} max`}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[10px] text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800 pt-3">
                  Base score: 50 pts · Sync your GitHub data to refresh this
                  score. Trust Score is an additional signal and does not
                  replace GitRank points.
                </p>
              </div>
            </Card>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          {/* Issue #617: Badge sort controls */}
          {isOwnProfile && (
            <div className="flex items-center gap-2 mt-4 mb-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
              {["Default", "Unlocked First", "Locked First"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setBadgeSort(opt)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                    badgeSort === opt
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            {[...systemBadges].sort((a, b) => {
              const aUnlocked = a.id === "b1" || (a.id === "b2" && gitRankPoints >= 100) || (a.id === "b3" && streak >= 10) || (a.id === "b4" && codingVersePoints >= 100) || (a.id === "b5" && referralPoints >= 1000);
              const bUnlocked = b.id === "b1" || (b.id === "b2" && gitRankPoints >= 100) || (b.id === "b3" && streak >= 10) || (b.id === "b4" && codingVersePoints >= 100) || (b.id === "b5" && referralPoints >= 1000);
              if (badgeSort === "Unlocked First") return aUnlocked === bUnlocked ? 0 : aUnlocked ? -1 : 1;
              if (badgeSort === "Locked First") return aUnlocked === bUnlocked ? 0 : aUnlocked ? 1 : -1;
              return 0;
            }).map((badge) => {
              let unlocked = false;
              if (badge.id === "b1") unlocked = true;
              if (badge.id === "b2" && gitRankPoints >= 100) unlocked = true;
              if (badge.id === "b3" && streak >= 10) unlocked = true;
              if (badge.id === "b4" && codingVersePoints >= 100)
                unlocked = true;
              if (badge.id === "b5" && referralPoints >= 1000) unlocked = true;

              return (
                <div
                  key={badge.id}
                  className={`
                    relative overflow-hidden p-4 rounded-xl border flex items-center gap-3.5 group transition-all duration-300
                    ${
                      unlocked
                        ? "border-violet-500/20 bg-slate-50/50 dark:bg-slate-950/20"
                        : "border-slate-200/30 dark:border-slate-800/20 bg-slate-100/10 dark:bg-slate-950/5 opacity-50"
                    }
                  `}
                >
                  {unlocked && (
                    <div className="absolute right-2 top-2 w-7 h-7 flex-shrink-0 opacity-80 group-hover:scale-110 transition-transform">
                      <LottiePlayer
                        animationData={successTick}
                        loop={false}
                        className="w-full h-full"
                      />
                    </div>
                  )}

                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-tr ${badge.color} text-white flex items-center justify-center font-black text-sm shadow-md`}
                  >
                    {badge.name.charAt(0)}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                      {badge.name}
                      {!unlocked && (
                        <span className="text-[8px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                          Locked
                        </span>
                      )}
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

        <Card className="flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border-violet-500/15">
          <div className="w-40 h-40 flex items-center justify-center mb-4">
            <LottiePlayer
              animationData={trophyAnimation}
              loop={true}
              className="w-full h-full"
            />
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

      {isOwnProfile && (
        <Card className="border-slate-200/50 dark:border-slate-800/50">
          <div className="p-8">
            <RankingBreakdown userData={userData} />
          </div>
        </Card>
      )}

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!updating) setIsEditModalOpen(false);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800/80 rounded-3xl shadow-2xl p-6 text-slate-100 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                disabled={updating}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white my-0 flex items-center gap-2">
                  <User className="w-5 h-5 text-violet-500" /> Edit Developer
                  Profile
                </h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Update your display name, profile avatar, education, and
                  onboarding details.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {editError && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{editError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" /> Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Image className="w-3 h-3" /> Avatar Image URL
                    </label>
                    <input
                      type="text"
                      placeholder="Avatar image URL"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> Gender
                    </label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-white transition-all"
                    >
                      <option value="" disabled className="bg-slate-900">
                        Select gender
                      </option>
                      <option value="male" className="bg-slate-900">
                        Male
                      </option>
                      <option value="female" className="bg-slate-900">
                        Female
                      </option>
                      <option value="non-binary" className="bg-slate-900">
                        Non-Binary
                      </option>
                      <option
                        value="prefer-not-to-say"
                        className="bg-slate-900"
                      >
                        Prefer not to say
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editDob}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setEditDob(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> City
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your city"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 relative" ref={editDropdownRef}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Mumbai College
                    </label>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Type to filter Mumbai colleges..."
                        value={collegeSearch}
                        onFocus={() => setShowCollegeDropdown(true)}
                        onChange={(e) => {
                          setCollegeSearch(e.target.value);
                          setShowCollegeDropdown(true);
                        }}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all ${
                          editCollege && editCollege !== "Other"
                            ? "border-violet-500 bg-violet-950/20 text-violet-400 font-semibold"
                            : "border-slate-800 bg-slate-950/40 text-white"
                        }`}
                      />
                    </div>

                    <AnimatePresence>
                      {showCollegeDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute z-50 left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 shadow-xl divide-y divide-slate-800"
                        >
                          {filteredColleges.length > 0 ? (
                            filteredColleges.map((col) => (
                              <div
                                key={col}
                                onClick={() => {
                                  setEditCollege(col);
                                  setCollegeSearch(col);
                                  setShowCollegeDropdown(false);
                                  if (col !== "Other") {
                                    setCustomCollege("");
                                  }
                                }}
                                className="px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer font-medium transition-colors"
                              >
                                {col}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-slate-500 text-center font-bold">
                              No colleges match search filter.
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence>
                    {editCollege === "Other" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1.5"
                      >
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Specify College Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your college name"
                          value={customCollege}
                          onChange={(e) => setCustomCollege(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-white transition-all"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Currently Learning */}
             {/* Bio */}
<div className="space-y-1.5">
  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
    Bio
  </label>
  <textarea
    placeholder="Tell the community about yourself..."
    value={editBio}
    maxLength={200}
    onChange={(e) => setEditBio(e.target.value)}
    rows={3}
    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-white transition-all resize-none"
  />
  <p className="text-right text-[10px] text-slate-500 font-medium">{editBio.length}/200</p>
</div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    Currently Learning
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editLearningTags || []).map((tag, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            setEditLearningTags((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                          className="hover:text-red-400 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {(editLearningTags || []).length < 5 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Rust, DSA, System Design"
                        value={learningInput}
                        onChange={(e) => setLearningInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = learningInput.trim();
                            if (
                              val &&
                              !(editLearningTags || []).includes(val)
                            ) {
                              setEditLearningTags((prev) => [
                                ...(prev || []),
                                val,
                              ]);
                              setLearningInput("");
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-violet-500 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = learningInput.trim();
                          if (val && !(editLearningTags || []).includes(val)) {
                            setEditLearningTags((prev) => [
                              ...(prev || []),
                              val,
                            ]);
                            setLearningInput("");
                          }
                        }}
                        className="px-3 py-1 text-xs rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500">
                    Add up to 5 tags (press Enter or click Add)
                  </p>
                </div>
                {/* Submit & Cancel Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <GradientButton
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    {updating ? "Saving..." : "Save Changes"}
                  </GradientButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEmbedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEmbedModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800/80 rounded-3xl shadow-2xl p-6 text-slate-100 flex flex-col gap-6"
            >
              <button
                onClick={() => setIsEmbedModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white my-0 flex items-center gap-2">
                  <Code className="w-5 h-5 text-violet-500" /> Embed on GitHub
                </h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Copy the Markdown snippet below to showcase your live
                  RankerHub stats on your GitHub profile README.
                </p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-xl blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <div className="relative bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto">
                  <code className="text-xs text-emerald-400 break-all select-all font-mono">
                    {getEmbedMarkdown()}
                  </code>
                </div>
              </div>

              <GradientButton
                onClick={handleCopyEmbed}
                className="w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy Markdown Snippet
              </GradientButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
