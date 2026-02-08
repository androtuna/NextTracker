import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[Incoming Request] ${req.method} ${req.url}`);
    next();
});

// Security: Enable CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PROPFIND', 'PROPPATCH', 'MKCOL', 'COPY', 'MOVE', 'LOCK', 'UNLOCK'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-target-url', 'Depth', 'Destination', 'If-Match', 'If-None-Match'],
    exposedHeaders: ['ETag', 'Content-Length']
}));

// --- PROXY DEFINITIONS ---

// 1. TMDB Proxy
const tmdbProxy = createProxyMiddleware({
    target: 'https://api.themoviedb.org/3',
    changeOrigin: true,
    pathRewrite: {
        '^/api/tmdb': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        const apiKey = (process.env.TMDB_API_KEY || '').trim();
        if (!apiKey) {
            console.error('[TMDB Proxy Error] TMDB_API_KEY IS MISSING');
            return;
        }

        const urlObj = new URL(proxyReq.path, 'https://api.themoviedb.org');
        const params = new URLSearchParams(urlObj.search);
        params.set('api_key', apiKey);
        params.set('language', 'tr-TR');

        proxyReq.path = urlObj.pathname + '?' + params.toString();
        console.log(`[TMDB Proxy] Forwarding: ${req.method} ${urlObj.pathname}`);
        proxyReq.setHeader('Accept', 'application/json');
    },
    onError: (err, req, res) => {
        console.error('[TMDB Proxy Error]:', err.message);
        res.status(500).json({ error: 'Proxy Error', details: err.message });
    }
});

// 2. WebDAV/Generic Proxy
const genericWebdavProxy = (req, res, next) => {
    const targetHeader = req.headers['x-target-url'];
    if (!targetHeader) {
        return req.method === 'OPTIONS' ? next() : res.status(400).json({ error: 'Missing x-target-url' });
    }

    try {
        const targetUrl = new URL(targetHeader);
        createProxyMiddleware({
            target: targetUrl.origin,
            changeOrigin: true,
            secure: false,
            pathRewrite: (path) => {
                const targetHeaderUrl = new URL(req.headers['x-target-url']);
                let base = targetHeaderUrl.pathname.endsWith('/') ? targetHeaderUrl.pathname.slice(0, -1) : targetHeaderUrl.pathname;
                const sub = path.replace(/^\/api\/proxy/, '').replace(/^\/proxy/, '');
                return base + (sub.startsWith('/') ? sub : '/' + sub);
            },
            onProxyReq: (proxyReq) => {
                proxyReq.removeHeader('Cookie');
                proxyReq.setHeader('Host', targetUrl.host);
                proxyReq.removeHeader('Origin');
                proxyReq.removeHeader('Referer');
            },
            onError: (err, req, res) => {
                console.error('[Generic Proxy Error]:', err.message);
                res.status(500).json({ error: 'Proxy failure' });
            }
        })(req, res, next);
    } catch (e) {
        res.status(400).json({ error: 'Invalid target URL' });
    }
};

// --- RATE LIMITING ---
const rateLimitStore = {};
const RATE_LIMIT_THRESHOLD = 500; // Increased for media discovery
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

const simpleLimiter = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    if (!rateLimitStore[ip]) {
        rateLimitStore[ip] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
    } else if (now > rateLimitStore[ip].resetAt) {
        rateLimitStore[ip] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
    } else {
        rateLimitStore[ip].count++;
    }
    if (rateLimitStore[ip].count > RATE_LIMIT_THRESHOLD) {
        return res.status(429).json({ error: 'Too Many Requests' });
    }
    next();
};

// --- ROUTING ---

// API Proxies FIRST (No prefix stripping issues)
app.use('/api/tmdb', tmdbProxy);
app.use('/api/proxy', genericWebdavProxy);

// Rate Limiter SECOND
app.use('/api', simpleLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Static Files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Catch-all
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
