# Modern Portal CMS (Node.js + React + MongoDB)

A complete, portable, and high-performance Content Management System (CMS) designed to run seamlessly from your pendrive across both **macOS** and **Windows**.

> 📖 **Full Mac & Windows Run & Sync Guide:** See [MAC_AND_WINDOWS_GUIDE.md](./MAC_AND_WINDOWS_GUIDE.md) for step-by-step instructions and command cheat sheet.

---

## 🌟 Key Features

1. **Category & Sub-Category Tree Hierarchy**:
   - Organize all content by **Parent Categories ➔ Sub-Categories ➔ Content Items**.
   - Example: `Indian` (Parent) ➔ `Uncle` (Sub-Category) ➔ `Videos / Stories / Galleries`.
   - Each category contains: Category Name, Description, Parent Category selector, Thumbnail image, and Top Banner.
2. **Video Management**:
   - Upload MP4/WebM video files directly OR paste streaming/external video URLs.
   - Upload Video Poster (Cover/Banner) & Video Thumbnail.
   - Assign Category and Sub-category hierarchy with tree selector.
   - Duration, Tags, Views counter, and Published/Draft status.
3. **Photo Galleries (Multi-Image Drag & Drop)**:
   - Batch drag & drop upload for multiple photos at once.
   - Reorder images, assign album cover photo, and link to category tree.
4. **Stories & Posts (Rich HTML / WYSIWYG Editor)**:
   - WordPress-style visual editor with bold, italic, headings (H2, H3), quotes, lists, links, and images.
   - Featured card image, article banner, excerpt, tags, and category hierarchy.
5. **Custom Pages Manager**:
   - Create, edit, and delete custom pages (About Us, Contact Us, Privacy Policy, Terms).
6. **Navigation Menu Builder**:
   - Dedicated panel to build and arrange Header and Footer menus.
   - Add links to Categories, Sub-categories, Pages, or Custom URLs.
7. **User & Access Management**:
   - Public user registration and login with secure JWT authentication.
   - Admin control panel: manage roles (`admin`, `editor`, `user`), suspend/activate accounts, and delete users.
8. **WordPress-Style Media Library**:
   - Central media asset vault with one-click URL copying for photos and video clips.

---

## 🚀 How to Run from Pendrive

### On macOS:
- **Option 1 (Double-Click)**: In Finder, open the project folder and double-click `start-mac.command`.
- **Option 2 (Terminal)**: Open Terminal in the project folder and run:
  ```bash
  chmod +x start-mac.sh
  ./start-mac.sh
  ```

### On Windows:
- Open your pendrive drive in Windows Explorer and double-click **`start-win.bat`**.

---

## 🔑 Default Admin Account

- **Email**: `admin@portal.com`
- **Password**: `admin123`
- **Role**: Super Administrator

---

## 🗄️ Database Setup (MongoDB)

### Database Sync Between Mac & Windows (Pendrive Portability):
Your database content (all 7 pages, 24 categories, 56 videos, 9 galleries, 15 posts, users, menus, and themesettings) is saved right inside the pendrive at `backend/database_dump/`.

1. **Auto-Restore on Windows**:
   When you run `start-win.bat` on Windows, the backend automatically detects if your Windows local MongoDB is empty and **auto-restores all pages, categories, and content immediately**.
2. **To Save Latest Changes from Mac to Pendrive**:
   ```bash
   npm run db:dump
   ```
3. **To Manually Restore Database Anytime (Mac or Windows)**:
   ```bash
   npm run db:restore
   ```
   Or force overwrite:
   ```bash
   npm run db:restore:force
   ```

### Recommended: Free MongoDB Atlas (Cloud - 100% Real-Time Shared Database)
If you don't want to export/import and want Mac & Windows to always share the exact same live database simultaneously:
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Open `backend/.env` file.
3. Replace the `MONGO_URI` with your Atlas connection string:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/cms_portal?retryWrites=true&w=majority
   ```
4. Run `npm run db:restore:force` once to push all current data to Atlas. Both Mac and Windows will now stay 100% in sync automatically!

---

## 📁 Project Architecture

```text
cms-portal/
├── backend/                  # Node.js + Express REST API
│   ├── config/               # Database connection (config/db.js)
│   ├── models/               # Category, Video, Gallery, Post, Page, Menu, User, Media
│   ├── controllers/          # CRUD & Business logic
│   ├── routes/               # Express endpoints
│   ├── middleware/           # JWT Auth & Multer multi-file uploader
│   ├── uploads/              # Local storage for videos, photos, banners, thumbnails
│   ├── server.js             # Express entry point
│   ├── seed.js               # Sample data generator
│   └── .env                  # Configuration & Mongo URI
│
├── frontend/                 # React + Vite Client
│   ├── src/
│   │   ├── components/       # Navbar, Footer, RichEditor, CategoryTreeSelector, AuthModal
│   │   ├── components/admin/ # AdminLayout, Sidebar
│   │   ├── pages/admin/      # Dashboard, Categories, Videos, Galleries, Posts, Pages, Menus, Users, Media
│   │   ├── pages/public/     # Home, CategoryView, VideoDetail, GalleryDetail, PostDetail, CustomPage
│   │   ├── context/          # AuthContext (sessions, JWT, roles)
│   │   └── services/         # Axios API endpoints
│   └── package.json
│
├── start-mac.command         # 1-Click Mac Finder runner
├── start-mac.sh              # Mac shell launcher
├── start-win.bat             # 1-Click Windows Explorer runner
└── README.md
```
