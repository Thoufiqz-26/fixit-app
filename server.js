require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');
const path        = require('path');

const connectDB      = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler   = require('./middleware/errorHandler');
const logger         = require('./utils/logger');

// ── Route modules ──────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const mechanicRoutes = require('./routes/mechanic');
const userRoutes     = require('./routes/user');
const adminRoutes    = require('./routes/admin');
const bookingRoutes  = require('./routes/booking');

const app    = express();
app.set('trust proxy', 1); 
const PORT   = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Database ───────────────────────────────────────────────
connectDB();

// ── Security middleware ────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false        // inline scripts allowed (SPA)
}));
app.use(compression());
app.use(morgan(IS_PROD ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) }
}));

// ── CORS ───────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// ── Body parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Static frontend ────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rate limiting (all /api/* routes) ─────────────────────
app.use('/api/', generalLimiter);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({
    status:      'ok',
    app:         'FixIt API',
    version:     '3.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString()
  })
);

// ── API routes ─────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/mechanic', mechanicRoutes);
app.use('/api/user',     userRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/bookings', bookingRoutes);

// ── SPA fallback (serve index.html for any unknown route) ──
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/'))
    return res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global error handler (must be last) ───────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀  FixIt API v3.0  →  http://localhost:${PORT}`);
  logger.info(`🌍  Environment    :  ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒  Admin phone    :  ${process.env.ADMIN_PHONE || '(not set)'}`);
});

// ── Graceful shutdown ──────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  process.exit(0);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
