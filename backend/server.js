const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();
// Server initialized

const app = express();

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(cors({
  origin: '*', // Allow connections from frontend dev server
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve uploaded media files statically (Images, Videos, Banners, Thumbnails)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Welcome & Dashboard Redirect Endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>CMS Backend API Server</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0d14; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: #121829; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 40px; max-width: 580px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        h1 { font-size: 1.8rem; margin-bottom: 12px; background: linear-gradient(135deg, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { color: #94a3b8; line-height: 1.6; font-size: 1rem; margin-bottom: 26px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1.05rem; box-shadow: 0 4px 20px rgba(99,102,241,0.45); transition: transform 0.2s; }
        .btn:hover { transform: translateY(-2px); }
        .endpoints { margin-top: 30px; text-align: left; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); padding: 18px; border-radius: 10px; font-size: 0.88rem; }
        .endpoints a { color: #818cf8; text-decoration: none; font-weight: 600; }
        .endpoints a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🚀 CMS Backend Engine is Online!</h1>
        <p>You have opened the <strong>Node.js API Server (Port 5001)</strong>.<br>To open your visual <strong>Admin Panel & Website</strong>, click the button below:</p>
        <a href="http://localhost:5173" class="btn">👉 Open Visual CMS Dashboard (Port 5173)</a>
        <div class="endpoints">
          <div style="color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">Available API Routes</div>
          <div>• <a href="/api/health">/api/health</a> - Health Check</div>
          <div>• <a href="/api/categories/tree">/api/categories/tree</a> - Category Hierarchy Tree</div>
          <div>• <a href="/api/videos">/api/videos</a> - Videos Endpoint</div>
          <div>• <a href="/api/galleries">/api/galleries</a> - Photo Galleries Endpoint</div>
          <div>• <a href="/api/posts">/api/posts</a> - Stories & Posts Endpoint</div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Modern CMS Backend API',
    uptime: `${Math.floor(process.uptime())}s`
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/galleries', require('./routes/galleryRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/pages', require('./routes/pageRoutes'));
app.use('/api/menus', require('./routes/menuRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/theme', require('./routes/themeRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/video-fields', require('./routes/videoFieldRoutes'));

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Modern CMS Backend Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Uploads served from: ${path.join(__dirname, 'uploads')}`);
  console.log(`======================================================\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

module.exports = app;
 