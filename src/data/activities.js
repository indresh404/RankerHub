export const activityFeed = [
  {
    id: "act-1",
    user: "You",
    type: "commit",
    detail: "Pushed 5 commits to origin/main on RankerHub",
    time: "2 hours ago",
    project: "RankerHub",
    points: 50,
  },
  {
    id: "act-2",
    user: "Sarah Chen",
    type: "rank_up",
    detail: "Promoted to rank #2: Kernel Guru",
    time: "4 hours ago",
    project: "Rust Kernel Project",
    points: 150,
  },
  {
    id: "act-3",
    user: "You",
    type: "challenge",
    detail: "Solved 'Valid Parentheses' (Medium) challenge in JS",
    time: "6 hours ago",
    project: "CodingVerse",
    points: 40,
  },
  {
    id: "act-4",
    user: "Alex Rivera",
    type: "pr_merge",
    detail: "Merged PR #12: Glassmorphism core CSS rules",
    time: "1 day ago",
    project: "RankerHub",
    points: 80,
  },
  {
    id: "act-5",
    user: "Elena Rostova",
    type: "badge",
    detail: "Earned the 'AI Explorer' badge for ML Model validation",
    time: "1 day ago",
    project: "Image Recognition API",
    points: 100,
  },
  {
    id: "act-6",
    user: "You",
    type: "streak",
    detail: "Maintained a 12-day coding streak on CodingOwl mascot",
    time: "2 days ago",
    project: "CodingOwl",
    points: 120,
  },
];

export const mockNotifications = [
  {
    id: "notif-1",
    title: "Pull Request Merged",
    description:
      "Your PR #34 'Enhance sidebar responsiveness' was successfully merged.",
    time: "10 mins ago",
    read: false,
    type: "pr_merge",
  },
  {
    id: "notif-2",
    title: "12-Day Streak Achieved!",
    description:
      "Incredible consistency! The CodingOwl mascot is proud of you.",
    time: "2 hours ago",
    read: false,
    type: "streak",
  },
  {
    id: "notif-3",
    title: "Challenge Unlocked",
    description:
      "You've unlocked the legendary 'Graph Traverser' daily challenge.",
    time: "1 day ago",
    read: true,
    type: "challenge",
  },
  {
    id: "notif-4",
    title: "Badge Earned: CSS Sorceress",
    description:
      "Congratulations! You earned the 'CSS Sorceress' badge for frontend achievements.",
    time: "2 days ago",
    read: true,
    type: "badge",
  },
];
