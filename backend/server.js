require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');

const db = require('./src/db');
const { hashPassword } = require('./src/utils/helpers');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const businessRoutes = require('./src/routes/businessRoutes');
const ownerRoutes = require('./src/routes/ownerRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow Leaflet CDN, Unsplash images, Google Fonts, OpenStreetMap tiles
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists and is served statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Ensure admin user exists from .env
async function ensureAdminUser() {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@locafy.in').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (!existing) {
      const passwordHash = await hashPassword(adminPassword);
      db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
      `).run('Locafy Admin', adminEmail, '+91 98765 43210', passwordHash, 'admin');
      console.log(`👑 Admin initialized: ${adminEmail}`);
    }
  } catch (err) {
    console.error('Failed to ensure admin user:', err.message);
  }
}
ensureAdminUser();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/me', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', app: 'Locafy API', timestamp: new Date().toISOString() });
});

// Serve frontend static files
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API endpoint not found' } });
});

// Frontend fallback for missing pages -> 404.html
app.use((req, res) => {
  const custom404 = path.join(frontendDir, '404.html');
  if (fs.existsSync(custom404)) {
    res.status(404).sendFile(custom404);
  } else {
    res.status(404).send('Page not found');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Locafy server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
