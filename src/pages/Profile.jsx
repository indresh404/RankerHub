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

  // Keyboard navigation for Edit Modal
  useEffect(() => {
    const handleModalKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isEditModalOpen) setIsEditModalOpen(false);
        if (isEmbedModalOpen) setIsEmbedModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleModalKeyDown);
    return () => window.removeEventListener("keydown", handleModalKeyDown);
  }, [isEditModalOpen, isEmbedModalOpen]);

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
  }, [user]);

  useEffect(() => {
    if (userData) {
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

  const platformHeatmap = useMemo(() => {
    const logs = userData?.platformActivityLogs || [];
    const weeks = 16;
    const daysPerWeek = 7;
    const data = [];
    let activityTotal = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        // user cancelled; fallback to clipboard
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
        const success = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!success) throw new Error("execCommand copy failed");
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
        // user cancelled
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
        const success = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!success) throw new Error("execCommand copy failed");
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
        const success = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!success) throw new Error("execCommand copy failed");
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
        const previousFocus = document.activeElement;

        const overlay = document.createElement("div");
        overlay.style.cssText = `position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,0.8);z-index:999999;padding:24px;`;

        const container = document.createElement("div");
        container.style.cssText = `position:relative;max-width:calc(100% - 48px);max-height:calc(100% - 48px);overflow:auto;padding:18px;border-radius:12px;`;

        const dbg = document.createElement("div");
        dbg.style.cssText =
          "position:absolute;left:12px;top:12px;padding:6px 10px;background:rgba(0,0,0,0.6);color:#fff;border-radius:6px;font-size:12px;z-index:100000";
        dbg.textContent = `Preview nodes: ${clone.getElementsByTagName("*").length}`;

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.textContent = "Close Preview";
        closeBtn.setAttribute("aria-label", "Close profile preview overlay");
        closeBtn.style.cssText =
          "position:absolute;right:12px;top:12px;padding:6px 10px;background:#111827;color:#fff;border-radius:8px;border:none;cursor:pointer;z-index:100000";

        const handleClose = () => {
          if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          window.removeEventListener("keydown", handleKeyDown);
          if (previousFocus && typeof previousFocus.focus === "function") {
            previousFocus.focus();
          }
        };

        const handleKeyDown = (e) => {
          if (e.key === "Escape") handleClose();
        };

        closeBtn.onclick = handleClose;
        window.addEventListener("keydown", handleKeyDown);

        const downloadBtn = document.createElement("button");
        downloadBtn.type = "button";
        downloadBtn.textContent = "Download Preview as PNG";
        downloadBtn.setAttribute("aria-label", "Download profile card as PNG image");
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

        container.appendChild(dbg);
        container.appendChild(downloadBtn);
        container.appendChild(closeBtn);
        container.appendChild(clone);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        setTimeout(() => closeBtn.focus(), 0);
      }
    } catch (err) {
      console.error("Profile card export failed", err);
    }
  };

  if (loadingPublicProfile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!userData && !loadingPublicProfile) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <h2 className="text-2xl font-bold text-white">Profile Not Found</h2>
        <p className="mt-2 text-slate-400">
          The requested user profile does not exist or has been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Profile Header / Card */}
      <Card ref={profileCardRef} className="relative overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <img
              src={userData?.avatar || user?.photoURL || "https://avatars.githubusercontent.com/u/9919?v=4"}
              alt={userData?.name || "User Avatar"}
              className="h-24 w-24 rounded-2xl border-2 border-indigo-500/30 object-cover shadow-lg"
            />
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold text-white md:text-3xl">
                  {userData?.name || "Developer"}
                </h1>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    aria-label="Edit Profile"
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-sm font-medium text-indigo-400">
                @{userData?.githubUsername || "developer"}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 sm:justify-start">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {userData?.college || "College Not Specified"}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {userData?.city || "City Not Specified"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <GradientButton
              type="button"
              onClick={handleSharePublicProfile}
              aria-label="Share Profile Link"
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </GradientButton>
            <button
              type="button"
              onClick={() => setIsEmbedModalOpen(true)}
              aria-label="Get Embed Code"
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
            >
              <Code className="h-4 w-4" />
              Embed
            </button>
          </div>
        </div>
      </Card>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 id="edit-profile-title" className="text-xl font-bold text-white">
                  Edit Profile
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  aria-label="Close edit profile modal"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
                {editError && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    {editError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <GradientButton type="submit" disabled={updating}>
                    {updating ? "Saving..." : "Save Changes"}
                  </GradientButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embed Code Modal */}
      <AnimatePresence>
        {isEmbedModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="embed-modal-title"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 id="embed-modal-title" className="text-xl font-bold text-white">
                  Embed Profile Card
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEmbedModalOpen(false)}
                  aria-label="Close embed modal"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-400">
                  Copy this Markdown snippet to embed your live RankerHub profile badge in your GitHub README or personal portfolio.
                </p>
                <div className="relative rounded-lg bg-slate-950 p-3 font-mono text-xs text-indigo-300">
                  {getEmbedMarkdown()}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyEmbed}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Markdown
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;