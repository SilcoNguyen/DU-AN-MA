# Project Gantt Tracker

A lightweight, modern project tracking and Gantt dashboard built with React, Vite, TypeScript, and Tailwind CSS.

---

## 1. First-time GitHub Setup

1. Open your terminal or Command Prompt in this project folder:
   ```bash
   git init
   git branch -M main
   ```
2. Create a new repository on GitHub (e.g. `project-tracker`).
3. Link your local project to GitHub and make your initial push:
   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git add .
   git commit -m "Initial commit - Project Gantt Tracker"
   git push -u origin main
   ```
4. Enable GitHub Pages:
   - Go to your GitHub repository: **Settings** → **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
   - The workflow (`.github/workflows/deploy.yml`) will automatically build and publish your website.

---

## 2. How to Run Locally (Local Admin Mode)

Simply **double-click** `start.bat`:
- Starts the local API server and Vite.
- Opens `http://localhost:5173` in your browser.
- Allows you to create, edit, delete projects and tasks.
- All edits automatically save to `public/data/projects.json`.

*(Alternative via command line: `npm run dev`)*

---

## 3. How to Publish

When you finish updating projects on your laptop:
1. Double-click `publish.bat`.
2. The script validates your data, updates the `lastUpdated` timestamp, commits with `Update project progress - <DATE>`, and pushes to GitHub.
3. GitHub Actions automatically builds and updates the static website.

Once published, you can turn off your laptop. The website stays online 24/7.

---

## 4. Where to Find the GitHub Pages URL

Your live website will be available at:

```
https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/
```

You can also find it under your repository's **Settings** → **Pages**, or in the **Environments** section on the repository homepage.
