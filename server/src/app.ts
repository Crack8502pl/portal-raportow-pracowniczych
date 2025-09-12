import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import models to initialize database
import './models';

// Import routes
import authRoutes from './routes/auth';
import reportRoutes from './routes/reports';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';

// Import middleware
import { requestLogger } from './middleware/logging';
import { ApiResponse } from './utils/helpers';
import { config } from './config/app';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000', 'https://your-domain.com'] 
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Serve static files
app.use('/static', express.static(path.join(__dirname, '../../client')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// File download endpoint
app.get('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Security: Prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return ApiResponse.error(res, 'Invalid filename', 400);
  }
  
  res.download(filePath, (err) => {
    if (err) {
      console.error('File download error:', err);
      return ApiResponse.notFound(res, 'File not found');
    }
  });
});

// Serve frontend for SPA routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return ApiResponse.notFound(res, 'API endpoint not found');
  }
  
  res.sendFile(path.join(__dirname, '../../client/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (err.type === 'entity.too.large') {
    return ApiResponse.error(res, 'Request payload too large', 413);
  }
  
  if (err.name === 'ValidationError') {
    return ApiResponse.validationError(res, err.message);
  }
  
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e: any) => e.message);
    return ApiResponse.validationError(res, errors.join(', '));
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return ApiResponse.error(res, 'Duplicate entry detected', 409);
  }
  
  return ApiResponse.error(res, 'Internal server error', 500);
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  return ApiResponse.notFound(res, 'API endpoint not found');
});

export default app;