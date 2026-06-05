import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  MoreHorizontal, 
  Terminal,
  Code2, 
  Target, 
  CheckCircle2, 
  Award, 
  Play, 
  Square, 
  Loader2 
} from "lucide-react";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { doc, updateDoc, query, collection, where, getCountFromServer } from "firebase/firestore";

// --- Language Definitions ---
const LANGUAGES = [
  { id: "javascript", label: "JavaScript", monacoId: "javascript" },
  { id: "python", label: "Python (Pyodide)", monacoId: "python" },
];

const STARTER_CODE = {
  javascript: `// JavaScript Sandbox — runs in your browser via eval()
// console.log outputs appear below.

function twoSum(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map[complement] !== undefined) return [map[complement], i];
    map[nums[i]] = i;
  }
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6));       // [1, 2]
`,
  python: `# Python Sandbox — runs via Pyodide (WebAssembly)
# First run loads Pyodide (~10MB), subsequent runs are instant.

def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [seen[complement], i]
        seen[n] = i
    return []

print(two_sum([2, 7, 11, 15], 9))  # [0, 1]
print(two_sum([3, 2, 4], 6))        # [1, 2]
`,
};

// --- JavaScript Sandboxed Executor ---
function runJavaScript(code) {
  const logs = [];
  const errors = [];
  const fakeconsole = {
    log: (...args) => logs.push(args.map(formatValue).join(" ")),
    error: (...args) => errors.push(args.map(formatValue).join(" ")),
    warn: (...args) => logs.push("[WARN] " + args.map(formatValue).join(" ")),
    info: (...args) => logs.push("[INFO] " + args.map(formatValue).join(" ")),
  };

  try {
    const fn = new Function("console", code);
    fn(fakeconsole);
  } catch (e) {
    errors.push(`RuntimeError: ${e.message}`);
  }

  return { logs, errors };
}

function formatValue(v) {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (Array.isArray(v) || typeof v === "object") {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
}

// --- Pyodide Python Executor ---
let pyodideInstance = null;
let pyodideLoading = false;

async function loadPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading) {
    // Wait for it
    await new Promise((res) => {
      const t = setInterval(() => { if (pyodideInstance) { clearInterval(t); res(); } }, 200);
    });
    return pyodideInstance;
  }
  pyodideLoading = true;
  // Dynamically load Pyodide from CDN
  if (!window.loadPyodide) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load Pyodide script"));
      document.head.appendChild(s);
    });
  }
  pyodideInstance = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/" });
  pyodideLoading = false;
  return pyodideInstance;
}

async function runPython(code) {
  const logs = [];
  const errors = [];
  try {
    const pyodide = await loadPyodide();
    // Redirect stdout/stderr
    pyodide.runPython(`
import sys, io
_stdout = io.StringIO()
_stderr = io.StringIO()
sys.stdout = _stdout
sys.stderr = _stderr
`);
    try {
      pyodide.runPython(code);
      const out = pyodide.runPython("_stdout.getvalue()");
      const err = pyodide.runPython("_stderr.getvalue()");
      if (out) logs.push(...out.split("\n").filter(Boolean));
      if (err) errors.push(...err.split("\n").filter(Boolean));
    } catch (e) {
      errors.push(String(e));
    }
  } catch (e) {
    errors.push(`Pyodide load error: ${e.message}`);
  }
  return { logs, errors };
}

// --- Challenge Data ---
const categories = [
  { name: "Arrays & Hashing", count: 48, solved: 12, icon: Target },
  { name: "Two Pointers & Sliders", count: 32, solved: 8, icon: Code2 },
  { name: "Stacks & Queues", count: 24, solved: 4, icon: CheckCircle2 },
  { name: "Trees & Graphs", count: 56, solved: 15, icon: Award },
];

const recentChallenges = [
  { id: 1, title: "Two Sum", difficulty: "Easy", diffColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25", xp: "+20 XP", category: "Arrays & Hashing" },
  { id: 2, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", diffColor: "text-amber-500 bg-amber-500/10 border-amber-500/25", xp: "+40 XP", category: "Two Pointers" },
  { id: 3, title: "Merge k Sorted Lists", difficulty: "Hard", diffColor: "text-red-500 bg-red-500/10 border-red-500/25", xp: "+80 XP", category: "Linked Lists" },
  { id: 4, title: "Trapping Rain Water", difficulty: "Hard", diffColor: "text-red-500 bg-red-500/10 border-red-500/25", xp: "+80 XP", category: "Arrays & Hashing" },
];

// --- Main CodingVerse Component ---
export const CodingVerse = () => {
  const { userData, user } = useAuth();
  
  // Solved, Attempted and Answer states fallback for guest users
  const [localSolvedQuestions, setLocalSolvedQuestions] = useState([]);
  const [localAttemptedQuestions, setLocalAttemptedQuestions] = useState([]);
  const [localAnswersState, setLocalAnswersState] = useState({});
  
  // Track input text box contents before verification
  const [inputsState, setInputsState] = useState({});

  // Track solved, attempted, and answers state either from Firestore (if logged in) or local state
  const answeredQuestions = user && userData
    ? (userData.solvedCodingVerseQuestions || [])
    : localSolvedQuestions;

  const attemptedQuestions = user && userData
    ? (userData.attemptedCodingVerseQuestions || [])
    : localAttemptedQuestions;

  const answersState = user && userData
    ? (userData.codingVerseAnswers || {})
    : localAnswersState;

  // Derive wrongAnswers dynamically during render
  const wrongAnswers = {};
  attemptedQuestions.forEach(qId => {
    if (!answeredQuestions.includes(qId)) {
      wrongAnswers[qId] = true;
    }
  });

  // Instagram Like States
  const [likedPosts, setLikedPosts] = useState({});
  const [likesCount, setLikesCount] = useState(() => {
    const counts = {};
    for (let i = 1; i <= 15; i++) {
      counts[i] = Math.floor(Math.random() * 400) + 120;
    }
    return counts;
  });

  // Double-tap tracker animation state
  const [showHeartAnimation, setShowHeartAnimation] = useState({});

  // Dynamic CodingVerse leaderboards rank state
  const [codingVerseRank, setCodingVerseRank] = useState("Loading...");

  const theoryQuestions = [
    {
      id: 1,
      language: "Java",
      type: "option",
      difficulty: "Medium",
      question: "Predict the output of these increment operations:",
      code: "int a = 5;\nSystem.out.println(a++ + ++a);",
      options: ["10", "11", "12", "13"],
      correctIndex: 2,
      explanation: "a++ returns 5 (a becomes 6). Then ++a increments a to 7 and returns 7. 5 + 7 = 12."
    },
    {
      id: 2,
      language: "Python",
      type: "input",
      difficulty: "Easy",
      question: "What is the output of this list comprehension?",
      code: "nums = [i * 2 for i in range(3)]\nprint(\"\".join(map(str, nums)))",
      correctAnswer: "024",
      placeholder: "Type the output string...",
      explanation: "range(3) yields 0, 1, 2. The list comprehension computes [0, 2, 4]. Mapping str and joining them results in the string '024'."
    },
    {
      id: 3,
      language: "Java",
      type: "option",
      difficulty: "Hard",
      question: "Determine what this String comparison outputs:",
      code: "String s1 = \"Java\";\nString s2 = new String(\"Java\");\nSystem.out.println(s1 == s2);",
      options: ["true", "false", "Compilation Error", "Exception"],
      correctIndex: 1,
      explanation: "== compares references. s1 is in the String constant pool, while s2 is created on the heap. They are different objects, yielding false."
    },
    {
      id: 4,
      language: "Python",
      type: "input",
      difficulty: "Easy",
      question: "Determine the output of this string slicing step:",
      code: "s = \"RankerHub\"\nprint(s[1:6:2])",
      correctAnswer: "akh",
      placeholder: "Type the output string...",
      explanation: "Slicing starts at index 1 ('a'), goes up to index 6 (exclusive), with a step of 2. Selected indices: 1 ('a'), 3 ('k'), 5 ('h'). Output: 'akh'."
    },
    {
      id: 5,
      language: "Java",
      type: "input",
      difficulty: "Medium",
      question: "Calculate the mathematical accumulation of this loop:",
      code: "int val = 0;\nfor(int i = 1; i <= 3; i++) {\n    val += i * i;\n}\nSystem.out.println(val);",
      correctAnswer: "14",
      placeholder: "Type the integer output...",
      explanation: "Loop adds 1^2 (1), 2^2 (4), and 3^2 (9). val = 1 + 4 + 9 = 14."
    },
    {
      id: 6,
      language: "Python",
      type: "option",
      difficulty: "Easy",
      question: "Determine the output of calling get() on this dictionary for a missing key:",
      code: "d = {\"x\": 10, \"y\": 20}\nprint(d.get(\"z\", 30))",
      options: ["None", "KeyError", "30", "10"],
      correctIndex: 2,
      explanation: "The dictionary get() method returns the specified default value (30) if the key is not present."
    },
    {
      id: 7,
      language: "Java",
      type: "input",
      difficulty: "Medium",
      question: "Determine the output of this mixed addition and string concatenation:",
      code: "int x = 10;\nint y = 20;\nString z = \"30\";\nSystem.out.println(x + y + z);",
      correctAnswer: "3030",
      placeholder: "Type the output string...",
      explanation: "Evaluates left to right. x + y is 30. Then 30 + \"30\" performs string concatenation, resulting in '3030'."
    },
    {
      id: 8,
      language: "Java",
      type: "option",
      difficulty: "Hard",
      question: "Determine the output of this try-catch-finally control flow:",
      code: "try {\n    int x = 10 / 0;\n} catch (ArithmeticException e) {\n    System.out.print(\"B\");\n} finally {\n    System.out.print(\"C\");\n}",
      options: ["B", "C", "BC", "Error"],
      correctIndex: 2,
      explanation: "Dividing by zero throws ArithmeticException, caught in catch block printing 'B'. The finally block executes printing 'C'. Result: 'BC'."
    },
    {
      id: 9,
      language: "Python",
      type: "input",
      difficulty: "Hard",
      question: "Predict the output of referencing and modifying lists:",
      code: "x = [1, 2, 3]\ny = x\ny.append(4)\nprint(len(x))",
      correctAnswer: "4",
      placeholder: "Type the output length...",
      explanation: "y points to the same list object as x. Modifying y modifies the shared list. len(x) becomes 4."
    },
    {
      id: 10,
      language: "Python",
      type: "option",
      difficulty: "Hard",
      question: "Determine the output of mutable default parameters:",
      code: "def f(a, b=[]):\n    b.append(a)\n    return b\nprint(f(1))\nprint(f(2))",
      options: ["[1] and [2]", "[1] and [1, 2]", "[1] and [2, 2]", "Error"],
      correctIndex: 1,
      explanation: "Python default arguments are evaluated once when the function is defined. The list b is shared, returning [1, 2] on the second call."
    },
    {
      id: 11,
      language: "Python",
      type: "code",
      difficulty: "Medium",
      question: "Complete the list comprehension filter condition to select only even numbers from the list:",
      code: "# nums is a list of integers\nevens = [x for x in nums if ________]",
      correctAnswer: "x % 2 == 0",
      placeholder: "Type the condition code (e.g. x % 2 == 0)",
      explanation: "The modulo operator % returns the remainder. A number is even if dividing by 2 leaves a remainder of 0."
    },
    {
      id: 12,
      language: "Java",
      type: "code",
      difficulty: "Easy",
      question: "Complete the ternary expression statement to return the absolute value of the float 'val':",
      code: "float absValue(float val) {\n    return ________;\n}",
      correctAnswer: "val >= 0 ? val : -val",
      placeholder: "Type the ternary expression (e.g. val >= 0 ? val : -val)",
      explanation: "If val is non-negative, return val; otherwise return -val (which negates the negative float to positive)."
    },
    {
      id: 13,
      language: "Java",
      type: "code",
      difficulty: "Hard",
      question: "Complete the return statement for the recursive Fibonacci function:",
      code: "int fib(int n) {\n    if (n <= 1) return n;\n    return ________;\n}",
      correctAnswer: "fib(n-1) + fib(n-2)",
      placeholder: "Type the recursive formula (e.g. fib(n-1) + fib(n-2))",
      explanation: "The Fibonacci sequence is recursively defined as the sum of the preceding two Fibonacci values."
    },
    {
      id: 14,
      language: "Python",
      type: "code",
      difficulty: "Easy",
      question: "Complete the slicing expression to return the string 's' reversed:",
      code: "def reverse_string(s):\n    return ________",
      correctAnswer: "s[::-1]",
      placeholder: "Type the slice code (e.g. s[::-1])",
      explanation: "Python slicing with step -1 traverses the string backwards, producing the reversed string."
    },
    {
      id: 15,
      language: "Java",
      type: "code",
      difficulty: "Medium",
      question: "Complete the outer loop statement header to run exactly 'N' times to print stars:",
      code: "void printStars(int n) {\n    ________ {\n        System.out.println(\"*\");\n    }\n}",
      correctAnswer: "for(int i = 0; i < n; i++)",
      placeholder: "Type the loop header (e.g. for(int i=0; i<n; i++))",
      explanation: "A loop starting at 0 and running as long as i is less than n executes exactly n times."
    }
  ];

  // Sandbox state
  const [lang, setLang] = useState("javascript");
  const [code, setCode] = useState(STARTER_CODE.javascript);
  const [output, setOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const [pyodideStatus, setPyodideStatus] = useState("idle"); // idle | loading | ready

  const handleLangChange = (newLang) => {
    setLang(newLang);
    setCode(STARTER_CODE[newLang]);
    setOutput([]);
  };

  const runCode = useCallback(async () => {
    setRunning(true);
    setOutput([]);
    const start = performance.now();

    let result;
    if (lang === "javascript") {
      result = runJavaScript(code);
    } else {
      setPyodideStatus("loading");
      result = await runPython(code);
      setPyodideStatus("ready");
    }

    const elapsed = ((performance.now() - start) / 1000).toFixed(3);
    const lines = [
      ...result.logs.map((l) => ({ type: "log", text: l })),
      ...result.errors.map((e) => ({ type: "error", text: e })),
      { type: "info", text: `--- Done in ${elapsed}s ---` },
    ];
    setOutput(lines);
    setRunning(false);
  }, [lang, code]);

  // Fetch CodingVerse leaderboards rank
  useEffect(() => {
    const fetchCodingVerseRank = async () => {
      if (!user) {
        setCodingVerseRank("Guest");
        return;
      }
      try {
        const codingVersePoints = userData?.points?.codingVersePoints || 0;
        const q = query(
          collection(db, "users"),
          where("onboardingStatus", "==", "complete"),
          where("points.codingVersePoints", ">", codingVersePoints)
        );
        const snapshot = await getCountFromServer(q);
        const currentRank = snapshot.data().count + 1;
        setCodingVerseRank(`#${currentRank}`);
      } catch (err) {
        console.error("Error calculating codingVerseRank:", err);
        setCodingVerseRank("#N/A");
      }
    };
    fetchCodingVerseRank();
  }, [user, userData]);

  const checkCodeCorrectness = (qId, val) => {
    const cleanVal = val.toLowerCase().replace(/\s+/g, "");
    if (qId === 11) {
      return cleanVal === "x%2==0" || cleanVal === "i%2==0" || cleanVal === "val%2==0";
    }
    if (qId === 12) {
      return cleanVal === "val>=0?val:-val" || cleanVal === "val<0?-val:val" || cleanVal === "val>=0.0f?val:-val" || cleanVal === "val>=0?val:(-val)";
    }
    if (qId === 13) {
      return cleanVal === "fib(n-1)+fib(n-2)" || cleanVal === "fib(n-2)+fib(n-1)";
    }
    if (qId === 14) {
      return cleanVal === "s[::-1]";
    }
    if (qId === 15) {
      return cleanVal.includes("for(int") && cleanVal.includes("i=0;") && (cleanVal.includes("i<n;") || cleanVal.includes("i<=n-1;")) && cleanVal.includes("i++");
    }
    return false;
  };

  const handleLike = (qId) => {
    setLikedPosts((prev) => {
      const isLiked = !prev[qId];
      setLikesCount((c) => ({
        ...c,
        [qId]: isLiked ? c[qId] + 1 : c[qId] - 1
      }));
      return { ...prev, [qId]: isLiked };
    });
  };

  const handleDoubleTap = (qId) => {
    if (!likedPosts[qId]) {
      handleLike(qId);
    }
    setShowHeartAnimation((prev) => ({ ...prev, [qId]: true }));
    setTimeout(() => {
      setShowHeartAnimation((prev) => ({ ...prev, [qId]: false }));
    }, 800);
  };

  const handleVerifyAnswer = async (qId, isCorrect, submittedVal) => {
    // Prevent double attempts
    if (attemptedQuestions.includes(qId)) return;

    const targetQ = theoryQuestions.find(item => item.id === qId);
    const difficulty = targetQ?.difficulty || "Easy";
    const pointsMap = { "Easy": 100, "Medium": 150, "Hard": 200 };
    const earnedPoints = pointsMap[difficulty];

    const newAttemptedQuestions = [...attemptedQuestions, qId];
    let newSolvedQuestions = [...answeredQuestions];
    let newCodingVersePoints = userData?.points?.codingVersePoints || 0;
    let newTotalPoints = userData?.points?.totalPoints || 0;
    
    // CodingVerse Streak Implementation (Issue #201)
    let newCodingVerseStreak = userData?.codingVerseStreak || 0;
    let newStreakPoints = userData?.points?.streakPoints || 0;
    let newLastCodingVerseSolveDate = userData?.lastCodingVerseSolveDate || null;
    let earnedStreakPoints = 0;

    if (isCorrect) {
      newSolvedQuestions = [...answeredQuestions, qId];
      newCodingVersePoints += earnedPoints;

      // Ensure timezone-agnostic boundaries using strict UTC Date strings
      const today = new Date();
      const todayUTCStr = today.toISOString().split('T')[0];
      const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

      if (newLastCodingVerseSolveDate) {
        if (todayUTCStr !== newLastCodingVerseSolveDate) {
          const lastDateParts = newLastCodingVerseSolveDate.split('-');
          const lastUTC = Date.UTC(parseInt(lastDateParts[0]), parseInt(lastDateParts[1]) - 1, parseInt(lastDateParts[2]));
          const diffDays = Math.floor((todayUTC - lastUTC) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newCodingVerseStreak += 1; // Maintained consecutive sequence
          } else if (diffDays > 1) {
            newCodingVerseStreak = 1; // Broken streak, reset
          }
          earnedStreakPoints = 5; // +5 XP for each new active solving day
          newLastCodingVerseSolveDate = todayUTCStr;
        }
      } else {
        newCodingVerseStreak = 1;
        earnedStreakPoints = 5;
        newLastCodingVerseSolveDate = todayUTCStr;
      }

      newStreakPoints += earnedStreakPoints;
      newTotalPoints = (userData?.points?.gitRankPoints || 0) + 
                       (userData?.points?.referralPoints || 0) + 
                       newStreakPoints + 
                       newCodingVersePoints;
    }

    const newAnswersState = { ...answersState, [qId]: submittedVal };

    if (user && userData) {
      const userRef = doc(db, "users", user.uid);
      try {
        const updatePayload = {
          "points.codingVersePoints": newCodingVersePoints,
          "points.totalPoints": newTotalPoints,
          "solvedCodingVerseQuestions": newSolvedQuestions,
          "attemptedCodingVerseQuestions": newAttemptedQuestions,
          "codingVerseAnswers": newAnswersState
        };

        // Only update streak data if they successfully answered and progressed
        if (isCorrect) {
          updatePayload["points.streakPoints"] = newStreakPoints;
          updatePayload["codingVerseStreak"] = newCodingVerseStreak;
          updatePayload["lastCodingVerseSolveDate"] = newLastCodingVerseSolveDate;
        }

        await updateDoc(userRef, updatePayload);
        console.log(`Submitted answer for ${qId}. Correct: ${isCorrect}. Arena Points: ${isCorrect ? earnedPoints : 0}. Streak Points: ${earnedStreakPoints}`);
      } catch (err) {
        console.error("Failed to update points in database:", err);
      }
    } else {
      // Fallback local update for guests
      setLocalAttemptedQuestions(newAttemptedQuestions);
      setLocalAnswersState(newAnswersState);
      if (isCorrect) {
        setLocalSolvedQuestions(newSolvedQuestions);
      }
    }
  };

  // Calculate total XP gained from solved questions dynamically
  const codingVerseXPGained = answeredQuestions.reduce((sum, qId) => {
    const q = theoryQuestions.find(item => item.id === qId);
    if (!q) return sum;
    const pointsMap = { "Easy": 100, "Medium": 150, "Hard": 200 };
    return sum + (pointsMap[q.difficulty] || 100);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <SectionHeader
        title="CodingVerse Arena"
        subtitle="Scroll through Oliver the Mascot's engineering feed, solve output puzzles and write logic code, and level up your global XP."
        badge="Practice Feed"
      />

      {/* Live Code Sandbox */}
      <Card className="p-6 space-y-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
              Live Execution Sandbox
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Run JavaScript instantly or Python via Pyodide (WebAssembly).
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                onClick={() => handleLangChange(l.id)}
                className={`px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  lang === l.id
                    ? "bg-violet-600 text-white"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor (simple textarea) */}
        <div className="relative">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            spellCheck={false}
            className="w-full font-mono text-sm bg-slate-950 text-slate-100 rounded-xl p-4 border border-slate-800 resize-y focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            style={{ tabSize: 2 }}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const newCode = code.substring(0, start) + "  " + code.substring(end);
                setCode(newCode);
                setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2; });
              }
            }}
          />
          <button
            onClick={runCode}
            disabled={running}
            className={`absolute top-3 right-3 px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              running
                ? "bg-violet-600/50 text-violet-200 cursor-not-allowed"
                : "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/30"
            }`}
          >
            {running ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            {running ? (lang === "python" && pyodideStatus === "loading" ? "Loading Pyodide…" : "Running…") : "Run"}
          </button>
        </div>

        {/* Output Console */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 min-h-[100px] font-mono text-xs">
          <div className="text-slate-500 font-bold text-[10px] uppercase mb-2 flex items-center gap-1.5">
            <Square className="w-2.5 h-2.5 fill-current text-emerald-400" />
            Output
          </div>
          {output.length === 0 ? (
            <span className="text-slate-600">
              {running ? "Executing…" : "Press Run to see output here."}
            </span>
          ) : (
            output.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === "error"
                    ? "text-red-400"
                    : line.type === "info"
                    ? "text-slate-500 mt-1"
                    : "text-emerald-300"
                }
              >
                {line.text}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Hero Daily Challenge Panel */}
      <Card className="p-8 relative overflow-hidden bg-gradient-to-br from-purple-600/10 via-slate-50/0 to-slate-50/0 dark:from-purple-600/5 dark:via-slate-900/0 dark:to-slate-900/0 border-purple-500/15 max-w-6xl mx-auto">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wider">
              Daily Featured Challenge
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white my-0 leading-tight">
              Edit Distance (Levenshtein)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Given two strings <code className="bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-xs">word1</code> and <code className="bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-xs">word2</code>, return the minimum number of operations required to convert <code className="bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-xs">word1</code> to <code className="bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-xs">word2</code>.
            </p>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-2">
              <span>Difficulty: <span className="text-red-500">Hard (80 XP)</span></span>
              <span>•</span>
              <span>Target Time: 45 mins</span>
            </div>
          </div>
          <button
            onClick={() => {
              setCode(`// Edit Distance — try it in the sandbox above!\nfunction minDistance(word1, word2) {\n  const m = word1.length, n = word2.length;\n  const dp = Array.from({length: m+1}, (_, i) => Array.from({length: n+1}, (_, j) => i || j));\n  for (let i = 1; i <= m; i++)\n    for (let j = 1; j <= n; j++)\n      dp[i][j] = word1[i-1] === word2[j-1]\n        ? dp[i-1][j-1]\n        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);\n  return dp[m][n];\n}\nconsole.log(minDistance("horse", "ros"));   // 3\nconsole.log(minDistance("intention", "execution")); // 5`);
              setLang("javascript");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full lg:w-auto px-8 py-3.5 rounded-xl font-bold bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" /> Load in Sandbox
          </button>
        </div>
      </Card>

      {/* Main Feed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
        
        {/* Left/Main Column: Instagram feed of posts */}
        <div className="lg:col-span-2 space-y-8">
          {theoryQuestions.map((q) => {
            const isSolved = answeredQuestions.includes(q.id);
            const isAttempted = attemptedQuestions.includes(q.id);
            const isWrong = wrongAnswers[q.id] === true;
            const currentTypedVal = inputsState[q.id] || "";
            const currentAnsweredVal = answersState[q.id] || "";
            const isLiked = likedPosts[q.id] === true;
            const likesVal = likesCount[q.id] || 120;
            
            const difficultyXP = q.difficulty === "Easy" ? 100 : q.difficulty === "Medium" ? 150 : 200;

            return (
              <Card 
                key={q.id} 
                className={`p-0 overflow-hidden border-slate-200/60 dark:border-slate-800/60 transition-all duration-300 ${
                  isSolved 
                    ? "ring-1 ring-emerald-500/25 shadow-md shadow-emerald-500/5 bg-slate-900/10" 
                    : isAttempted 
                    ? "ring-1 ring-red-500/20 shadow-md shadow-red-500/5 bg-slate-900/5" 
                    : "hover:shadow-lg"
                }`}
              >
                {/* 1. Mascot Post Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 flex items-center justify-center shadow-md">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-lg select-none">
                        🦉
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block hover:underline cursor-pointer leading-none">
                          oliver_mascot
                        </span>
                        <span className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold select-none" title="Verified Mascot">
                          ✔
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5 uppercase tracking-wide">
                        CodingVerse Arena • {q.type === "code" ? "Code Completion" : q.type === "option" ? "MCQ Theory" : "Output prediction"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-lg border ${
                      q.difficulty === "Easy"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : q.difficulty === "Medium"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-red-500/10 text-red-600 border-red-500/20"
                    }`}>
                      {q.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      +{difficultyXP} XP
                    </span>
                    <button className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 2. Post Media / Code Box Container */}
                <div 
                  onDoubleClick={() => handleDoubleTap(q.id)}
                  className="relative bg-slate-950 p-6 min-h-[160px] flex flex-col justify-center border-b border-slate-100 dark:border-slate-800 select-none group cursor-pointer"
                >
                  <div className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[9px] font-bold text-slate-500 tracking-wide flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">Double-tap to like</span>
                  </div>

                  <AnimatePresence>
                    {showHeartAnimation[q.id] && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.3, 1], opacity: [0, 0.95, 0] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-full shadow-2xl border border-white/10"
                        >
                          <Heart className="w-16 h-16 text-red-500 fill-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.65)]" />
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-emerald-500" /> SOURCE_CODE.{q.language === "Python" ? "py" : "java"}
                  </div>

                  <div className="font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed select-text whitespace-pre bg-black/30 p-4 rounded-xl border border-slate-900">
                    {q.code}
                  </div>
                </div>

                {/* 3. Action bar */}
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleLike(q.id)}
                        className="transition hover:scale-110 active:scale-95 cursor-pointer text-slate-600 dark:text-slate-350 hover:text-red-500 dark:hover:text-red-500"
                      >
                        <Heart className={`w-6 h-6 ${isLiked ? "text-red-500 fill-red-500 drop-shadow-sm" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-700 dark:text-slate-350 select-none">
                    Liked by <span className="hover:underline cursor-pointer font-black text-slate-900 dark:text-white">git_wizard</span> and{" "}
                    <span className="hover:underline cursor-pointer font-black text-slate-900 dark:text-white">
                      {likesVal.toLocaleString()} others
                    </span>
                  </div>

                  <div className="text-xs leading-relaxed">
                    <span className="font-extrabold text-slate-900 dark:text-white mr-1.5 hover:underline cursor-pointer">
                      oliver_mascot
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {q.question}
                    </span>
                  </div>

                  {/* 4. Interactive Input/MCQ Block */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                    {q.type === "option" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, optIdx) => {
                          const isCorrectOpt = optIdx === q.correctIndex;
                          const isSelectedOpt = currentAnsweredVal === optIdx;
                          
                          let btnStyle = "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/60";
                          
                          if (isAttempted) {
                            if (isCorrectOpt) {
                              btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm shadow-emerald-500/5";
                            } else if (isSelectedOpt) {
                              btnStyle = "bg-red-500/10 border-red-500 text-red-500 opacity-60";
                            } else {
                              btnStyle = "border-slate-100 dark:border-slate-900 text-slate-400 opacity-40 cursor-not-allowed";
                            }
                          } else if (isSelectedOpt) {
                            btnStyle = "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/15";
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={isAttempted}
                              onClick={() => {
                                handleVerifyAnswer(q.id, optIdx === q.correctIndex, optIdx);
                              }}
                              className={`p-3 rounded-xl border font-bold text-xs text-left cursor-pointer transition-all flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {isSolved && isCorrectOpt && <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wide">✔ Correct</span>}
                              {isAttempted && isSelectedOpt && !isCorrectOpt && <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-wide">✘ Incorrect</span>}
                            </button>
                          );
                        })}
                      </div>
                    ) : q.type === "code" ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            disabled={isAttempted}
                            placeholder={q.placeholder}
                            value={isAttempted ? currentAnsweredVal : currentTypedVal}
                            onChange={(e) => {
                              if (!isAttempted) {
                                setInputsState((prev) => ({ ...prev, [q.id]: e.target.value }));
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !isAttempted && currentTypedVal.trim()) {
                                const check = checkCodeCorrectness(q.id, currentTypedVal);
                                handleVerifyAnswer(q.id, check, currentTypedVal);
                              }
                            }}
                            className={`flex-1 px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-950 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/25 transition-all text-slate-800 dark:text-slate-100 disabled:opacity-75 ${
                              isSolved 
                                ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" 
                                : isWrong 
                                ? "border-red-500/50 bg-red-500/5 text-red-500" 
                                : "border-slate-200 dark:border-slate-800"
                            }`}
                          />
                          <button
                            disabled={isAttempted || !currentTypedVal.trim()}
                            onClick={() => {
                              const check = checkCodeCorrectness(q.id, currentTypedVal);
                              handleVerifyAnswer(q.id, check, currentTypedVal);
                            }}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition hover:scale-[1.02] active:scale-100 cursor-pointer shadow-sm shadow-purple-500/10"
                          >
                            Verify Code
                          </button>
                        </div>
                        {isAttempted && !isSolved && (
                          <div className="text-[11px] font-bold text-red-500 bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg select-text font-mono">
                            ✘ Locked (Incorrect). The correct code logic was: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[10px] ml-1">{q.correctAnswer}</code>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            disabled={isAttempted}
                            placeholder={q.placeholder}
                            value={isAttempted ? currentAnsweredVal : currentTypedVal}
                            onChange={(e) => {
                              if (!isAttempted) {
                                setInputsState((prev) => ({ ...prev, [q.id]: e.target.value }));
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !isAttempted && currentTypedVal.trim()) {
                                const check = currentTypedVal.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                                handleVerifyAnswer(q.id, check, currentTypedVal);
                              }
                            }}
                            className={`flex-1 px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/25 transition-all text-slate-800 dark:text-slate-100 disabled:opacity-75 ${
                              isSolved 
                                ? "border-emerald-500/50 bg-emerald-500/5" 
                                : isWrong 
                                ? "border-red-500/50 bg-red-500/5 text-red-500" 
                                : "border-slate-200 dark:border-slate-800"
                            }`}
                          />
                          <button
                            disabled={isAttempted || !currentTypedVal.trim()}
                            onClick={() => {
                              const check = currentTypedVal.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                              handleVerifyAnswer(q.id, check, currentTypedVal);
                            }}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition hover:scale-[1.02] active:scale-100 cursor-pointer shadow-sm shadow-purple-500/10"
                          >
                            Verify Answer
                          </button>
                        </div>
                        {isAttempted && !isSolved && (
                          <div className="text-[11px] font-bold text-red-500 bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg select-text">
                            ✘ Locked (Incorrect). The correct answer is: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[10px] ml-1">{q.correctAnswer}</code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 5. Mascot Explanation (Visible if Attempted) */}
                  {isAttempted && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-sm shadow border border-purple-550/15 flex-shrink-0">
                          🦉
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="text-xs flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white hover:underline cursor-pointer">
                              oliver_mascot
                            </span>
                            <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 inline-flex items-center leading-none">
                              Mascot
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 font-semibold select-text">
                            <span className={`${isSolved ? "text-emerald-500" : "text-amber-500"} font-extrabold uppercase tracking-wide block mb-1`}>
                              {isSolved ? "✔ Answer verified • mascot logic:" : "✘ attempt locked • mascot logic:"}
                            </span>
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </Card>
            );
          })}
        </div>

        {/* Right Column: Sticky Stats Panel */}
        <div className="lg:sticky lg:top-6 space-y-6">
          
          {/* User Progress Stats Card */}
          <Card className="p-6 border-purple-500/15 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 select-none">
            <div className="space-y-4">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                Arena Progress
              </span>
              
              <div className="flex items-center gap-3">
                {/* Real User Profile picture */}
                <img 
                  src={userData?.avatar || user?.photoURL || "https://avatars.githubusercontent.com/u/9919?v=4"} 
                  alt="Profile Avatar"
                  className="w-12 h-12 rounded-full object-cover shadow border border-purple-450/20"
                />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white my-0 leading-tight">
                    {userData?.name || "Ranker Guest"}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mt-1 tracking-wider">
                    {userData?.githubStats?.primaryLanguage || "Developer"}
                  </span>
                </div>
              </div>

              {/* Progress Bar & CodingVerse dynamic leaderboard rank */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>Solved / Attempted</span>
                  <span className="text-purple-600 dark:text-purple-400 font-extrabold">{answeredQuestions.length} / {attemptedQuestions.length}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(answeredQuestions.length / 15) * 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                  />
                </div>
                <div className="flex justify-between items-center text-xs font-bold pt-2 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                  <span className="text-slate-400">CodingVerse XP Gained</span>
                  <span className="text-emerald-500 font-extrabold">+{codingVerseXPGained} XP</span>
                </div>
                
                {/* NEW LOGIC UI: Live CodingVerse Streak Display */}
                <div className="flex justify-between items-center text-xs font-bold pt-1 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                  <span className="text-slate-400">Arena Streak</span>
                  <span className="text-orange-500 font-extrabold">🔥 {userData?.codingVerseStreak || 0} Days</span>
                </div>

                {/* Displaying CodingVerse global leaderboard rank */}
                <div className="flex justify-between items-center text-xs font-bold pt-1">
                  <span className="text-slate-400">CodingVerse Rank</span>
                  <span className="text-purple-600 dark:text-purple-400 font-extrabold">{codingVerseRank}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Categories Grid (from 215) */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider my-0">
              Top Categories
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {categories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <Card key={idx} className="p-4 flex items-center justify-between group border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 w-9 h-9 flex items-center justify-center text-slate-500 border border-slate-200/20 dark:border-slate-800/20 group-hover:scale-110 transition-transform duration-200">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-900 dark:text-white my-0">{cat.name}</h5>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">{cat.solved} / {cat.count} Solved</p>
                      </div>
                    </div>
                    <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500" style={{ width: `${(cat.solved / cat.count) * 100}%` }} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Algorithmic Catalog (from 215) */}
          <Card className="p-4 border-slate-200/50 dark:border-slate-800/50">
            <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider my-0 mb-4">
              Featured Challenges
            </h4>
            <div className="space-y-3">
              {recentChallenges.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full border ${item.diffColor}`}>
                      {item.difficulty[0]}
                    </span>
                    <button
                      onClick={() => {
                        setCode(STARTER_CODE.javascript);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[10px] font-bold text-violet-600 hover:underline cursor-pointer"
                    >
                      Solve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Oliver Mascot Daily Tip Card */}
          <Card className="p-5 border-slate-200/50 dark:border-slate-800/50 select-none bg-slate-50/20 dark:bg-slate-950/20">
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-0.5">🦉</div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider my-0">
                  Oliver's Arena Pro-Tip
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Always inspect scope evaluation and reference comparisons closely! In Java, check cached values; in Python, track shared default argument references. Speed is nice, but precision builds streaks.
                </p>
              </div>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
};

export default CodingVerse;
