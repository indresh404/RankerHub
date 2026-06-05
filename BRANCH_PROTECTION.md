# Branch Protection Setup Guide 🔒

To ensure repository integrity and maintain high code quality standards, please set up branch protection rules for the default branch (`main` or `master`) in the GitHub Repository Settings.

## 🛠️ Step-by-Step Instructions

1. Navigate to the repository page on GitHub.
2. Click on the **Settings** tab at the top.
3. In the left sidebar, click on **Branches** (under _Code and automation_).
4. Under **Branch protection rules**, click **Add rule** (or edit the existing rule for `main`).
5. Set the **Branch name pattern** to `main` (or the default branch name).
6. Enable the following recommended settings:

---

### 1. Require a Pull Request Before Merging

- [x] Check **Require a pull request before merging**.
- [x] Check **Require approvals**.
  - Set _Required number of approvals before merging_ to **1**.
- [x] Check **Dismiss stale pull request approvals when new commits are pushed**.
- [x] Check **Require review from Code Owners**. (Forces PRs to be approved by owner of code owners path).

### 2. Require Status Checks to Pass Before Merging

- [x] Check **Require status checks to pass before merging**.
- [x] Check **Require branches to be up to date before merging**.
- In the search box, find and select the following status checks (they will appear after running the workflows at least once):
  - `Lint Check`
  - `Unit Tests`
  - `Build Application`

### 3. Block Force Pushes & Deletions

- [x] Check **Restrict who can push to matching branches**. (Ensures write-access users can only merge via PRs).
- [x] (Enabled by default) **Block force pushes** and **Block deletions**.

---

## 💾 Save Changes

Scroll down to the bottom of the page and click **Create** or **Save changes**. You might be prompted to enter your GitHub password.
