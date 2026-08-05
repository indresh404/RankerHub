import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReportModal from "../components/ReportModal";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Award,
  ShieldCheck,
  Edit2,
  X,
  Building2,
  AlertCircle,
  Share2,
  Code,
  ImageIcon,
} from "lucide-react";
import { Github, Linkedin, Instagram } from "../components/ui/Icons";
import {
  query,
  collection,
  where,
  getCountFromServer,
  doc,
  getDoc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import RankingBreakdown from "../components/dashboard/RankingBreakdown";
import Card from "../components/ui/Card";
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
    if (unsafe === null) return "";
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
          where("githubUsername", "==", username)
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
              (e) => e.username !== entry.username
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
  const [rank, setRank] = useState("Loading...");
  const [toasts, setToasts] = useState([]);
  const [updating, setUpdating] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  const editLearningTags = useMemo(() => [], []);
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

  const filteredColleges = useMemo(() => {
    if (collegeSearch.trim() === "" || collegeSearch === "Other") {
      return collegesList;
    }
    const searchLower = collegeSearch.toLowerCase();
    return collegesList.filter((col) =>
      col.toLowerCase().includes(searchLower)
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
          })
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


// Clean effect dedicated solely to GitHub syncing (no setState inside!)
useEffect(() => {
  if (userData?.githubUsername && typeof syncGitHubData === "function") {
    syncGitHubData();
  }
}, [userData?.githubUsername, syncGitHubData]);
  

  // Safely handle social links and github syncing without causing render loop errors// 1. This calculates the social links directly from userData during every render
const localSocialLinks = useMemo(
  () => ({
    linkedinUrl: userData?.linkedinUrl || null,
    instagramHandle: userData?.instagramHandle || null,
    discordUsername: userData?.discordUsername || null,
  }),
  [userData?.linkedinUrl, userData?.instagramHandle, userData?.discordUsername]
);

// 2. This effect only handles the GitHub sync (no state updates inside!)
useEffect(() => {
  if (userData?.githubUsername && typeof syncGitHubData === "function") {
    syncGitHubData();
  }
}, [userData?.githubUsername, syncGitHubData]);

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
            userData.points.gitRankPoints ?? 0
          )
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
            userData.timezone
          );
        }
      } catch (err) {
        console.error("Error calculating dynamic rank:", err);
        setRank("#N/A");
      }
    };

    fetchRank();
  }, [userData, isOwnProfile, user]);

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

  const getEmbedMarkdown = useCallback(() => {
    const domain = window.location.origin;
    const usernameParam = userData?.githubUsername || username || "developer";
    return `[![${userData?.name || "Developer"}'s RankerHub Stats](${domain}/api/og/profile/${usernameParam})](${domain}/#/profile/${usernameParam})`;
  }, [userData?.githubUsername, userData?.name, username]);

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
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
      );
      svgParts.push(`<defs>`);
      svgParts.push(`<style><![CDATA[
        .title{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;fill:#ffffff;font-weight:800}
        .meta{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto;fill:#93c5fd}
        .body{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto;fill:rgba(255,255,255,0.85)}
      ]]></style>`);
      svgParts.push(
        `<linearGradient id="g1" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#0b1220"/></linearGradient>`
      );
      svgParts.push(`</defs>`);
      svgParts.push(
        `<rect width="100%" height="100%" rx="16" fill="url(#g1)"/>`
      );

      const avatarX = 48;
      const avatarY = 48;
      const avatarSize = 160;
      if (avatarData) {
        svgParts.push(
          `<image href="${avatarData}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" style="border-radius:16px;" preserveAspectRatio="xMidYMid slice" />`
        );
      } else {
        svgParts.push(
          `<rect x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" rx="16" fill="#111827"/>`
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
        (userData && userData.college) || "Campus";
      const referralCode = (userData && userData.referralCode) || "N/A";

      svgParts.push(
        `<text x="${textX}" y="${textY}" class="title" font-size="48">${escapeXml(displayName)}</text>`
      );
      svgParts.push(
        `<text x="${textX}" y="${textY + 40}" class="meta" font-size="18">@${escapeXml(usernameHandle)} • ${escapeXml(collegeName)}</text>`
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
          `<text x="${textX}" y="${y}" class="body" font-size="14">${escapeXml(line)}</text>`
        );
      }

      svgParts.push(
        `<g transform="translate(${width - 260},${avatarY})">`
      );
      svgParts.push(
        `<text x="0" y="20" class="meta" font-size="14">RankerHub</text>`
      );
      svgParts.push(
        `<text x="0" y="50" class="title" font-size="20">Shareable Profile Card</text>`
      );
      svgParts.push(
        `<rect x="0" y="80" width="220" height="60" rx="8" fill="rgba(255,255,255,0.04)" />`
      );
      svgParts.push(
        `<text x="12" y="105" class="meta" font-size="12">Referral</text>`
      );
      svgParts.push(
        `<text x="12" y="137" class="title" font-size="18">${escapeXml(referralCode)}</text>`
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
            ctx.fillStyle = "#0b1220";
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

      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Profile card exported as PNG successfully!",
          type: "success",
        },
      ]);
    } catch (err) {
      console.error("Export failed:", err);
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

  if (loadingPublicProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading Profile..." />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          User Not Found
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
          The requested profile @{username} doesn't exist or has been removed.
        </p>
        <GradientButton onClick={() => navigate("/")}>
          Return Home
        </GradientButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
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
      </div>

      {/* Main Profile Header Card */}
      <div ref={profileCardRef}>
        <Card className="relative overflow-hidden p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 border-violet-500/30 shadow-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                <img
                  src={
                    userData.avatar ||
                    user?.photoURL ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${userData.githubUsername || "user"}`
                  }
                  alt={userData.name || "User Avatar"}
                  className="w-full h-full object-cover"
                />
              </div>
              {userData.gender && (
                <span className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-xs px-2 py-1 rounded-full border border-slate-700 shadow">
                  {userData.gender}
                </span>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                    {userData.name || "Developer"}
                    <ShieldCheck className="w-5 h-5 text-violet-500 inline-block" />
                  </h1>
                  <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                    @{userData.githubUsername || "username"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                  {isOwnProfile ? (
                    <>
                      <GradientButton
                        onClick={handleOpenEditModal}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1.5"
                        aria-label="Edit Profile"
                      >
                        <Edit2 className="w-4 h-4" /> Edit Profile
                      </GradientButton>
                      <button
                        type="button"
                        onClick={() => setIsEmbedModalOpen(true)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                        title="Embed Badge"
                        aria-label="Embed Profile Badge"
                      >
                        <Code className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadProfileCard}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                        title="Export Card as Image"
                        aria-label="Export Card as Image"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSharePublicProfile}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 text-xs font-semibold px-3"
                        aria-label="Share Profile"
                      >
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReport(true)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition text-xs font-semibold px-3"
                        aria-label="Report User"
                      >
                        Report
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              {userData.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                  {userData.bio}
                </p>
              )}

              {/* Badges / Meta Info */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                {userData.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {userData.city}
                  </span>
                )}
                {userData.college && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {userData.college}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  Global Rank: <strong className="text-violet-600 dark:text-violet-400">{rank}</strong>
                </span>
              </div>

              {/* Social Links */}
              <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                {userData.githubUsername && (
                  <a
                    href={`https://github.com/${userData.githubUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub Profile"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {localSocialLinks.linkedinUrl && (
                  <a
                    href={localSocialLinks.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn Profile"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {localSocialLinks.instagramHandle && (
                  <a
                    href={`https://instagram.com/${localSocialLinks.instagramHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram Profile"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-pink-600 transition"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Ranking Breakdown */}
      <RankingBreakdown userData={userData} />

      {/* Report Modal */}
      {showReport && (
        <ReportModal
          reportedUser={userData}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Embed Modal */}
      {isEmbedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Embed Profile Badge
              </h3>
              <button
                type="button"
                onClick={() => setIsEmbedModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Copy the Markdown snippet below to display your live RankerHub profile badge inside your GitHub README or personal portfolio:
            </p>
            <textarea
              readOnly
              rows={4}
              value={getEmbedMarkdown()}
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <GradientButton size="sm" onClick={handleCopyEmbed}>
                Copy Markdown
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 id="edit-profile-title" className="text-xl font-bold text-slate-900 dark:text-white">
                Edit Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close edit profile dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
              <div>
                <label htmlFor="edit-name-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  id="edit-name-input"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-avatar-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Avatar Image URL
                </label>
                <input
                  id="edit-avatar-input"
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-gender-select" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Gender *
                  </label>
                  <select
                    id="edit-gender-select"
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-dob-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    id="edit-dob-input"
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-city-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  City *
                </label>
                <input
                  id="edit-city-input"
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div ref={editDropdownRef} className="relative">
                <label htmlFor="edit-college-search" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  College / Institution *
                </label>
                <input
                  id="edit-college-search"
                  type="text"
                  value={collegeSearch}
                  onFocus={() => setShowCollegeDropdown(true)}
                  onChange={(e) => {
                    setCollegeSearch(e.target.value);
                    setEditCollege(e.target.value);
                    setShowCollegeDropdown(true);
                  }}
                  placeholder="Search college name..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />

                {showCollegeDropdown && (
                  <ul className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 text-xs">
                    {filteredColleges.slice(0, 50).map((col) => (
                      <li
                        key={col}
                        onClick={() => {
                          setEditCollege(col);
                          setCollegeSearch(col);
                          setShowCollegeDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-800 dark:text-slate-200"
                      >
                        {col}
                      </li>
                    ))}
                    <li
                      onClick={() => {
                        setEditCollege("Other");
                        setCollegeSearch("Other");
                        setShowCollegeDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer font-semibold text-violet-600 dark:text-violet-400"
                    >
                      Other (Specify manually)
                    </li>
                  </ul>
                )}
              </div>

              {editCollege === "Other" && (
                <div>
                  <label htmlFor="edit-custom-college" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Custom College Name *
                  </label>
                  <input
                    id="edit-custom-college"
                    type="text"
                    value={customCollege}
                    onChange={(e) => setCustomCollege(e.target.value)}
                    placeholder="Enter full college name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="edit-bio-textarea" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Bio / About Me
                </label>
                <textarea
                  id="edit-bio-textarea"
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell other developers about yourself..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
                >
                  Cancel
                </button>
                <GradientButton type="submit" disabled={updating}>
                  {updating ? "Saving..." : "Save Changes"}
                </GradientButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};