import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Calendar,
  Building2,
  AlertCircle,
  HelpCircle,
  MapPin,
  Gift,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Linkedin, Instagram } from "../components/ui/Icons";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  runTransaction
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import GradientButton from "../components/ui/GradientButton";
import collegesList from "../data/colleges.json";

export const Onboarding = () => {
  const { user, userData, fetchGitHubStats } = useAuth();
  const navigate = useNavigate();

  // Fields state
  const suggestedName = userData?.name || user?.displayName || "";
  const [name, setName] = useState("");
  const [hasEditedName, setHasEditedName] = useState(false);
  const displayName = hasEditedName ? name : suggestedName;
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  
  // Searchable college dropdown state
  const [collegeSearch, setCollegeSearch] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [customCollege, setCustomCollege] = useState("");
  const filteredColleges = useMemo(() => {
    if (collegeSearch.trim() === "") {
      return collegesList;
    }

    const searchLower = collegeSearch.toLowerCase();
    return collegesList.filter((col) => col.toLowerCase().includes(searchLower));
  }, [collegeSearch]);

  const [referralCode, setReferralCode] = useState(() =>
    typeof sessionStorage === "undefined" ? "" : sessionStorage.getItem("referred_by_code") || ""
  );
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  
  // UX State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const dropdownRef = useRef(null);

  // Prefill referral code from session storage (URL parse cache)
  useEffect(() => {
    const savedRef = sessionStorage.getItem("referred_by_code");
    if (savedRef) {
      sessionStorage.removeItem("referred_by_code");
    }
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCollegeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to generate a unique 6-character uppercase code using
  // crypto.getRandomValues() for better randomness than Math.random()
  const generateReferralCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomValues = new Uint8Array(6);
    crypto.getRandomValues(randomValues);
    return Array.from(randomValues)
      .map((byte) => chars[byte % chars.length])
      .join("");
  };

  const handleSelectCollege = (college) => {
    setSelectedCollege(college);
    setCollegeSearch(college);
    setShowCollegeDropdown(false);
    setError("");
    if (college !== "Other") {
      setCustomCollege("");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    // 1. Validations
    const finalName = displayName.trim();

    if (!finalName) {
      setError("Please enter your full name.");
      setIsLoading(false);
      return;
    }
    if (!gender) {
      setError("Please select your gender.");
      setIsLoading(false);
      return;
    }
    if (!dob) {
      setError("Please select your date of birth.");
      setIsLoading(false);
      return;
    }

    // Validate that DOB is in the past and user is at least 13 years old (COPPA compliance)
    const today = new Date().toISOString().split("T")[0];
    if (dob > today) {
      setError("Date of birth cannot be in the future.");
      setIsLoading(false);
      return;
    }

    const birthDate = new Date(dob);
    const ageLimitDate = new Date();
    ageLimitDate.setFullYear(ageLimitDate.getFullYear() - 13);
    if (birthDate > ageLimitDate) {
      setError("You must be at least 13 years old to join RankerHub.");
      setIsLoading(false);
      return;
    }
    if (!selectedCollege || !collegesList.includes(selectedCollege) || collegeSearch !== selectedCollege) {
      setError("Please select a valid college from the searchable dropdown list.");
      setIsLoading(false);
      return;
    }

    if (selectedCollege === "Other" && !customCollege.trim()) {
      setError("Please specify your college name.");
      setIsLoading(false);
      return;
    }

    if (linkedinUrl.trim()) {
      const normalizedLinkedin = linkedinUrl.trim().toLowerCase();
      const validPrefixes = ["https://linkedin.com/in/", "https://www.linkedin.com/in/"];
      const isValidLinkedin = validPrefixes.some((prefix) => normalizedLinkedin.startsWith(prefix));
      if (!isValidLinkedin) {
        setError("LinkedIn URL must start with https://linkedin.com/in/ or https://www.linkedin.com/in/");
        setIsLoading(false);
        return;
      }
    }

    if (!city.trim()) {
      setError("Please enter your city.");
      setIsLoading(false);
      return;
    }

    try {
      const activeUid = user.uid;
      const githubUsername = (userData?.githubUsername || user.reloadUserInfo?.screenName || "").trim();

      if (!githubUsername) {
        throw new Error("Unable to identify your GitHub username from this session. Please log in again.");
      }

      // 2. Fetch Verified GitHub Stats Snapshot
      setSuccessMsg("Snapshotting your GitHub contributions securely...");
      const ghStats = await fetchGitHubStats(activeUid, githubUsername);

      setSuccessMsg("Validating referrals and locking account credentials...");

      // Generate unique referral code for this user
      let newReferralCode = generateReferralCode();
      
      // Ensure the generated code is unique by checking existing ones
      let codeUnique = false;
      let attempts = 0;
      while (!codeUnique && attempts < 10) {
        const uniqueQuery = query(collection(db, "users"), where("referralCode", "==", newReferralCode));
        const uniqueSnap = await getDocs(uniqueQuery);
        if (uniqueSnap.empty) {
          codeUnique = true;
        } else {
          newReferralCode = generateReferralCode();
          attempts++;
        }
      }

      if (!codeUnique) {
        setError("Could not generate a unique referral code after multiple attempts. Please try again.");
        setIsLoading(false);
        return;
      }

      // Referral variables
      let referrerUid = null;
      let referrerCodeClean = referralCode.trim().toUpperCase();

      // If a referral code is entered, verify it
      if (referrerCodeClean) {
        const refQuery = query(collection(db, "users"), where("referralCode", "==", referrerCodeClean));
        const refSnap = await getDocs(refQuery);
        
        if (refSnap.empty) {
          setError("The referral code you entered is invalid. Please double-check or leave it blank.");
          setIsLoading(false);
          return;
        }

        const referrerDoc = refSnap.docs[0];
        referrerUid = referrerDoc.id;

        if (referrerUid === activeUid) {
          setError("You cannot use your own referral code!");
          setIsLoading(false);
          return;
        }
      }

      // 3. Execute isolated Firestore transaction
      // Note: The referral code uniqueness check above (lines 196-217) prevents most
      // collisions, but in high-concurrency scenarios two users might pass the check
      // simultaneously. This transaction-level defensive check catches late collisions
      // and throws an error, prompting the user to retry with a newly generated code.
      await runTransaction(db, async (transaction) => {
        const myUserRef = doc(db, "users", activeUid);
        const myReferralRef = doc(db, "referrals", activeUid);

        // Defensive check: re-verify the referral code is still unique right before
        // writing. If another user wrote the same code between our earlier check and
        // now, we'll detect it here and throw, causing the onboarding to fail so the
        // user can retry with a new code.
        const myExistingUserDoc = await transaction.get(myUserRef);
        if (myExistingUserDoc.exists()) {
          throw new Error("Your account has already been set up. Please log in.");
        }

        const existingCodeQuery = query(collection(db, "users"), where("referralCode", "==", newReferralCode));
        const existingCodeSnap = await getDocs(existingCodeQuery);
        if (!existingCodeSnap.empty) {
          throw new Error("Referral code collision detected. Please try onboarding again.");
        }

        // Determine starting points
        let initialReferralPoints = 0;
        if (referrerUid) {
          initialReferralPoints = 50; // New user gets 50 bonus points
        }

        const totalPoints = ghStats.gitRankPoints + initialReferralPoints;

        // Provision user profile doc
        const fullUserProfile = {
          uid: activeUid,
          githubUsername,
          githubId: userData?.githubId || user.providerData[0]?.uid || null,
          name: finalName,
          email: user.email || "",
          avatar: userData?.avatar || user.photoURL || "",
          gender,
          dob,
          city: city.trim(),
          college: selectedCollege === "Other" ? customCollege.trim() : selectedCollege,
          linkedinUrl: linkedinUrl.trim() || "",
          instagramHandle: instagramHandle.trim().replace(/^@/, "") || "",
          referralCode: newReferralCode,
          referredBy: referrerUid ? referrerCodeClean : null,
          onboardingStatus: "complete",
          streak: 1,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          githubStats: {
            commits: ghStats.commits,
            prs: ghStats.prs,
            reviews: ghStats.reviews,
            repos: ghStats.publicRepos,
            stars: ghStats.stars,
            followers: ghStats.followers,
            primaryLanguage: ghStats.primaryLanguage
          },
          points: {
            gitRankPoints: ghStats.gitRankPoints,
            codingVersePoints: 0,
            streakPoints: 0,
            referralPoints: initialReferralPoints,
            totalPoints: totalPoints
          }
        };

        // If referred, update the Referrer's data
        if (referrerUid) {
          const referrerUserRef = doc(db, "users", referrerUid);
          const referrerIndexRef = doc(db, "referrals", referrerUid);

          const referrerDocSnap = await transaction.get(referrerUserRef);
          const referrerIndexSnap = await transaction.get(referrerIndexRef);

          if (referrerDocSnap.exists()) {
            const currentRefPoints = referrerDocSnap.data().points?.referralPoints || 0;
            const currentTotalPoints = referrerDocSnap.data().points?.totalPoints || 0;

            // Increment points for referrer (+100 points)
            transaction.update(referrerUserRef, {
              "points.referralPoints": currentRefPoints + 100,
              "points.totalPoints": currentTotalPoints + 100
            });
          }

          if (referrerIndexSnap.exists()) {
            const currentUsedBy = referrerIndexSnap.data().usedBy || [];
            const currentTotalEarned = referrerIndexSnap.data().totalEarned || 0;

            // Append referred user and increment logged total
            transaction.update(referrerIndexRef, {
              usedBy: [...currentUsedBy, activeUid],
              totalEarned: currentTotalEarned + 100
            });
          } else {
            // Only create fallback if referrer user doc exists to prevent orphaned records
            if (referrerDocSnap.exists()) {
              transaction.set(referrerIndexRef, {
                referralCode: referrerCodeClean,
                usedBy: [activeUid],
                totalEarned: 100
              });
            } else {
              // Referrer user no longer exists, fail the transaction
              throw new Error("Referrer user not found, unable to process referral");
            }
          }
        }

        // Write my user profile
        transaction.set(myUserRef, fullUserProfile);

        // Write my own referral sharing document
        transaction.set(myReferralRef, {
          referralCode: newReferralCode,
          usedBy: [],
          totalEarned: 0
        });
      });

      setSuccessMsg("Onboarding complete! Syncing dashboard...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

    } catch (err) {
      console.error("Onboarding transaction failed:", err);
      setError(err.message || "An error occurred during onboarding. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-blue-50/20 dark:from-[#090D1A] dark:via-[#0A0F26] dark:to-[#0B122C] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-25%] left-[-15%] w-[70vw] h-[70vw] bg-gradient-to-br from-violet-500/10 to-indigo-500/10 pointer-events-none rounded-full blur-3xl" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[70vw] h-[70vw] bg-gradient-to-tl from-blue-500/10 to-cyan-500/10 pointer-events-none rounded-full blur-3xl" />
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 20 }}
        className="w-full max-w-xl relative z-10"
      >
        <Card className="backdrop-blur-xl bg-white/90 dark:bg-slate-950/40 border border-white/50 dark:border-slate-800/40 shadow-2xl p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-3 relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="h-8" />
            <h1 className="text-3xl font-black bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent my-0">
              Finish Onboarding
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Create your gamified developer profile and join the leaderboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-5">
            
            {/* Status Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="flex-1">{error}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-400 text-xs font-semibold"
                >
                  <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5 animate-bounce" />
                  <span className="flex-1">{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid for Name & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => {
                    setHasEditedName(true);
                    setName(e.target.value);
                  }}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all"
                >
                  <option value="" disabled className="dark:bg-slate-950">Select gender</option>
                  <option value="male" className="dark:bg-slate-950">Male</option>
                  <option value="female" className="dark:bg-slate-950">Female</option>
                  <option value="non-binary" className="dark:bg-slate-950">Non-Binary</option>
                  <option value="prefer-not-to-say" className="dark:bg-slate-950">Prefer not to say</option>
                </select>
              </div>

            </div>

            {/* Grid for DOB & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> City
                </label>
                <input
                  type="text"
                  placeholder="Enter your city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all placeholder:text-slate-400"
                />
              </div>

            </div>

            {/* Searchable College Dropdown */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Mumbai College (Searchable Select)
              </label>
              
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Type to filter Mumbai colleges..."
                  value={collegeSearch}
                  onFocus={() => setShowCollegeDropdown(true)}
                  onChange={(e) => {
                    setCollegeSearch(e.target.value);
                    setShowCollegeDropdown(true);
                  }}
                  className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 ${
                    selectedCollege
                      ? "border-violet-500 bg-violet-50/5 dark:bg-violet-950/5 text-violet-700 dark:text-violet-400 font-semibold"
                      : "border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 dark:text-white"
                  }`}
                />
              </div>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showCollegeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl divide-y divide-slate-100 dark:divide-slate-800"
                  >
                    {filteredColleges.length > 0 ? (
                      filteredColleges.map((col) => (
                        <div
                          key={col}
                          onClick={() => handleSelectCollege(col)}
                          className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-medium transition-colors"
                        >
                          {col}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center font-bold">
                        No colleges match search filter.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Custom College Input field if "Other" is selected */}
            <AnimatePresence>
              {selectedCollege === "Other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Specify College Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your college/university name"
                    value={customCollege}
                    onChange={(e) => setCustomCollege(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all placeholder:text-slate-400"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Social Links (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* LinkedIn URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/yourname"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Instagram Handle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5" /> Instagram (Optional)
                </label>
                <input
                  type="text"
                  placeholder="@yourhandle"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all placeholder:text-slate-400"
                />
              </div>

            </div>

            {/* Optional Referral Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" /> Referral Code (Optional)
                </label>
                <span className="text-[10px] text-violet-500 font-bold bg-violet-500/10 px-2 py-0.5 rounded-full">
                  🎁 +50 Points Bonus
                </span>
              </div>
              <input
                type="text"
                placeholder="Enter 6-digit inviter code (e.g., GFDKEA)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white uppercase transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="px-5 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
              >
                Cancel
              </button>

              <GradientButton
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/15"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Signup</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </GradientButton>
            </div>

          </form>

        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
