import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { setRoutes } from './routes/index';
import { authenticate } from './middleware/auth';

// Runtime Node version guard – jsdom/webidl-conversions needs Node >= 20 for ArrayBuffer.resizable descriptor
const requiredMajor = 20;
const currentMajor = parseInt(process.versions.node.split('.')[0], 10);
if (currentMajor < requiredMajor) {
    // Fail fast with clear message instead of cryptic TypeError later
    // eslint-disable-next-line no-console
    console.error(`FATAL: Node.js ${process.versions.node} detected. Please run on Node >= ${requiredMajor}.`);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Logging
if (NODE_ENV === 'production') {
    app.use(morgan('combined')); // Apache combined format
} else {
    app.use(morgan('dev')); // Colored, concise output
}

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoint (public, no auth required)
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV
    });
});

// Apply authentication to all routes except /health
app.use(authenticate);

// Routes
setRoutes(app);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
});