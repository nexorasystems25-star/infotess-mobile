import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (dev)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ ok: true, service: 'infotess-sdms-api', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', publicRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`\n🚀 INFOTESS SDMS API running on http://localhost:${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/api/v1/health`);
  console.log(`   Auth:   http://localhost:${config.port}/api/v1/auth/login`);
  console.log(`   DB:     Supabase (${config.supabaseUrl})`);
  console.log(`\nTest accounts:`);
  console.log(`  Admin:    admin@infotess.com / admin123`);
  console.log(`  Student:  student@infotess.com / student123`);
  console.log(`  Index:    INF/2024/001\n`);
});
