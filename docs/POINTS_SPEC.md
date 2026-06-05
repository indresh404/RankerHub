# 🧮 RankerHub Game Mechanics & Points Specification

This document serves as the mathematical foundation for the RankerHub scoring engines. All leaderboards, badges, and developer rankings are dynamically computed based on the equations outlined below.

---

## 🐙 1. GitRank Engine (GitHub Activity)

The GitRank engine audits a connected GitHub account to evaluate real-world development activity. Points are awarded based on development impact and code review participation.

### Current Computation Formula

```text
GitRank Points = (Commits × 2) + (Pull Requests × 5) + (Code Reviews × 10)
```
