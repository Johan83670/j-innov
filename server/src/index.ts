/**
 * J-Innov Backend Server
 * Main entry point with Express configuration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import filesRoutes from './routes/files.routes';
import usersRoutes from './routes/users.routes';
import assignmentsRoutes from './routes/assignments.routes';

// Import middleware
import { generalLimiter } from './middleware/rateLimit';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ===================
// Security Middleware
// ===================

// Helmet for security headers including anti-iframe protection
app.use(
  helmet({
    // X-Frame-Options: DENY - prevents page from being in iframe
    frameguard: { action: 'deny' },
    // Content Security Policy with frame-ancestors 'none'
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        frameAncestors: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    // Hide X-Powered-By header
    hidePoweredBy: true,
    // Prevent MIME type sniffing
    noSniff: true,
    // XSS protection
    xssFilter: true,
  })
);

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ===================
// Routes
// ===================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/files', filesRoutes);
app.use('/users', usersRoutes);
app.use('/assignments', assignmentsRoutes);

// ===================
// Error Handling
// ===================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
);

// ===================
// Start Server
// ===================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    J-INNOV BACKEND                         ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                  ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║  CORS Origin: ${corsOrigin.substring(0, 30).padEnd(30)}       ║
║  Download Mode: ${process.env.DOWNLOAD_MODE || 'presigned'}                             ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
