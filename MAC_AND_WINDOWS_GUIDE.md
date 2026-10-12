# 📘 Modern CMS Portal - Complete Mac & Windows Portable Guide

> **Project Location:** Saved directly on your portable pendrive / external drive.  
> **Backend Port:** `http://localhost:5001`  
> **Frontend Port:** `http://localhost:5173`  
> **Admin Login:** `admin@portal.com` | Password: `admin123`

---

## 📑 Table of Contents
1. [How It Works (Pendrive Architecture)](#1-how-it-works)
2. [Running on macOS](#2-running-on-macos)
3. [Running on Windows](#3-running-on-windows)
4. [Database Sync (Mac ⇄ Windows)](#4-database-sync-mac--windows)
5. [Commands Quick Reference Cheat Sheet](#5-commands-quick-reference-cheat-sheet)
6. [Best Practice: Shared Cloud Database (MongoDB Atlas)](#6-best-practice-shared-cloud-database-mongodb-atlas)
7. [Troubleshooting & FAQs](#7-troubleshooting--faqs)

---

## 1. How It Works

This project is built to run portably off an external drive / pendrive:
- **Code & Components**: All stored inside `frontend/` and `backend/` on the pendrive.
- **Uploaded Media**: All videos, photos, and banners are stored in `backend/uploads/` on the pendrive.
- **Database Dump**: A complete snapshot of all collections (Pages, Categories, Videos, Galleries, Posts, Users) is stored in `backend/database_dump/` on the pendrive.

---

## 2. Running on macOS

### Option A: 1-Click Launch (Recommended)
1. Plug your pendrive into your Mac.
2. Open the project folder in **Finder**.
3. Double-click **`start-mac.command`** (or open Terminal and run `./start-mac.sh`).
4. Both Backend (Port 5001) and Frontend (Port 5173) will launch automatically.
5. Open your browser at: **`http://localhost:5173`**.

### Option B: Using Terminal Commands
Open Terminal in the project root folder:
```bash
# 1. Run both servers together:
npm run dev

# OR run in separate terminals:
# Terminal 1 (Backend):
cd backend && npm run start

# Terminal 2 (Frontend):
cd frontend && npm run dev
```

---

## 3. Running on Windows

### Prerequisites for Windows (One-time setup on your PC):
1. **Node.js**: Installed (v18, v20 or newer) from [nodejs.org](https://nodejs.org).
2. **MongoDB**: Installed locally (MongoDB Community Server) OR use free Cloud MongoDB Atlas (see Section 6).

### Step-by-Step on Windows:
1. Plug your pendrive into your Windows PC.
2. Open the project folder in **Windows Explorer**.
3. Double-click **`start-win.bat`**.
   - It will start the Backend server in a command window.
   - It will start the Frontend Vite server in a second command window.
   - It will automatically launch your browser at `http://localhost:5173`.
4. **First time on Windows?** Load your Mac database into Windows:
   Open Command Prompt in the project folder and run:
   ```cmd
   npm run db:restore
   ```
   *(This restores all 7 pages, 24 categories, 56 videos, 9 galleries, 15 posts into your Windows MongoDB)*.

---

## 4. Database Sync (Mac ⇄ Windows)

### Why is this needed?
MongoDB stores its physical database files inside your computer's operating system (`/opt/homebrew/var/mongodb` on Mac, and `C:\Program Files\MongoDB\...` on Windows).  
Because of this, Mac and Windows have separate local databases.

Humne iska aasan solution bana diya hai with 2 simple commands:

### Workflow:

#### Step 1: When you make changes on Mac (add video, edit layout, change categories):
Save your live Mac database into the pendrive backup folder:
```bash
npm run db:dump
```
> **What this does:** Exports all 7 pages, 24 categories, 56 videos, 9 galleries, 15 posts, and settings to `backend/database_dump/*.json` on the pendrive.

#### Step 2: When you plug the pendrive into Windows:
Load the backup into Windows MongoDB:
```cmd
npm run db:restore
```
Or to force clean & replace with exact fresh Mac data:
```cmd
npm run db:restore:force
```

---

## 5. Commands Quick Reference Cheat Sheet

| Command | Machine | Description |
| :--- | :--- | :--- |
| **`npm run dev`** | Mac / Win | Starts both backend (5001) and frontend (5173) simultaneously. |
| **`npm run db:dump`** | Mac / Win | **Saves** current database to pendrive (`backend/database_dump/`). |
| **`npm run db:restore`** | Mac / Win | **Loads** pendrive data into local MongoDB (Safe: skips existing). |
| **`npm run db:restore:force`** | Mac / Win | **Force Overwrites** local database with exact 100% pendrive backup. |
| **`start-mac.command`** | Mac | 1-Click double-click launcher for macOS. |
| **`start-win.bat`** | Windows | 1-Click double-click launcher for Windows. |

---

## 6. Best Practice: Shared Cloud Database (MongoDB Atlas)

Agar aap chahte hain ki **koi dump ya restore command bhi na chalani pade** aur Mac aur Windows dono **100% exact same live database** use karein:

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a **Free Cluster (M0)**.
2. In Database Access, create a user (e.g. `admin` and a password).
3. In Network Access, click **Add IP Address** ➔ Select **Allow Access from Anywhere (0.0.0.0/0)**.
4. Copy your Connection String, e.g.:
   ```text
   mongodb+srv://admin:YourPassword@cluster0.abcde.mongodb.net/cms_portal?retryWrites=true&w=majority
   ```
5. Open `backend/.env` on the pendrive and paste it:
   ```env
   MONGO_URI=mongodb+srv://admin:YourPassword@cluster0.abcde.mongodb.net/cms_portal?retryWrites=true&w=majority
   ```
6. Run this command **once** on your Mac to push all current data to your Cloud DB:
   ```bash
   npm run db:restore:force
   ```

**Fayda (Benefit):**
- Ab aap chahe Mac par kaam karein ya Windows par, dono computer ek hi live cloud database se connect honge.
- Mac par jo bhi video ya layout update karenge, wo Windows par **real-time** me automatically dikhega.

---

## 7. Troubleshooting & FAQs

### Q1: Windows par website blank dikh rahi hai ya "Network Error" aa raha hai?
- **Check Backend:** Port 5001 chal raha hai ya nahi? Check terminal window.
- **Check MongoDB:** Windows par MongoDB service start hai ya nahi? Run `net start MongoDB` in admin cmd.
- **Restore Data:** Run `npm run db:restore:force` in project root.

### Q2: Mac par Port 5001 already in use error?
Terminal me ye command chalayein to kill any stuck background process:
```bash
kill -9 $(lsof -ti :5001) 2>/dev/null || true
```

### Q3: Admin login credentials kya hain?
- **URL:** `http://localhost:5173/login`
- **Email:** `admin@portal.com`
- **Password:** `admin123`

---
*Created for Modern CMS Portal | Ready for Mac & Windows portability*
