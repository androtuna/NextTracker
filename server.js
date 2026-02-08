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

// Security: Enable CORS with WebDAV headers allowed
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PROPFIND', 'PROPPATCH', 'MKCOL', 'COPY', 'MOVE', 'LOCK', 'UNLOCK'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-target-url', 'Depth', 'Destination', 'If-Match', 'If-None-Match'],
    exposedHeaders: ['ETag', 'Content-Length']
}));

// Simple Rate Limiter to prevent API abuse
const rateLimitStore = {};
const RATE_LIMIT_THRESHOLD = 100; // per 15 minutes
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

const simpleLimiter = (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitStore[ip]) {
        rateLimitStore[ip] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
    } else {
        if (now > rateLimitStore[ip].resetAt) {
            rateLimitStore[ip] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
        } else {
            rateLimitStore[ip].count++;
        }
    }

    if (rateLimitStore[ip].count > RATE_LIMIT_THRESHOLD) {
        console.warn(`[Rate Limit] Blocked IP: ${ip} (Count: ${rateLimitStore[ip].count})`);
        return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Hız sınırını aştınız. Lütfen 15 dakika sonra tekrar deneyin.'
        });
    }
    next();
};

app.use('/api', simpleLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Proxy API requests to TMDB
app.use('/api/tmdb', createProxyMiddleware({
    target: 'https://api.themoviedb.org/3',
    changeOrigin: true,
    pathRewrite: {
        '^/api/tmdb': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        // Fallback for different env variable naming or potential issues
        // In production, process.env is usually populated by the host (Coolify)
        const apiKey = (process.env.TMDB_API_KEY || '').trim();

        if (!apiKey) {
            console.error('[TMDB Proxy Error] TMDB_API_KEY IS MISSING IN PROCESS.ENV');
            return;
        }

        const urlObj = new URL(proxyReq.path, 'https://api.themoviedb.org');
        const params = new URLSearchParams(urlObj.search);

        params.set('api_key', apiKey);
        params.set('language', 'tr-TR');

        proxyReq.path = urlObj.pathname + '?' + params.toString();

        // Security-conscious debug log
        const maskedKey = apiKey.substring(0, 3) + '...' + apiKey.substring(apiKey.length - 3);
        console.log(`[TMDB Proxy] Method: ${req.method} | Path: ${urlObj.pathname} | KeyLength: ${apiKey.length} | KeyPrefix: ${maskedKey}`);

        // Standard headers for TMDB
        proxyReq.setHeader('Accept', 'application/json');
    },
    onProxyRes: (proxyRes, req, res) => {
        if (proxyRes.statusCode >= 400) {
            console.error(`[TMDB Proxy Response Error] Status: ${proxyRes.statusCode} for ${req.url}`);
        }
    },
    onError: (err, req, res) => {
        console.error('[TMDB Proxy Critical Error]:', err);
        res.status(500).json({ status: 'error', message: 'TMDB Proxy failed', details: err.message });
    }
}));

// Generic Proxy for WebDAV / External APIs to avoid CORS issues
app.use('/api/proxy', (req, res, next) => {
    console.log(`[Proxy Request] ${req.method} ${req.url}`);
    const targetHeader = req.headers['x-target-url'];

    if (!targetHeader) {
        if (req.method !== 'OPTIONS') {
            console.warn('[Proxy] Missing x-target-url header');
            return res.status(400).json({ error: 'Missing x-target-url header' });
        }
        return next();
    }

    try {
        const targetUrl = new URL(targetHeader);
        const origin = targetUrl.origin;

        createProxyMiddleware({
            target: origin,
            changeOrigin: true,
            secure: false, // For self-signed Nextcloud certs
            xfwd: true,    // Preserve forwarded headers
            pathRewrite: (path, r) => {
                const tHeader = r.headers['x-target-url'];
                const target = new URL(tHeader);
                let base = target.pathname;
                if (base.endsWith('/')) base = base.slice(0, -1);

                const sub = path.replace('/api/proxy', '');
                const cleanSub = sub.startsWith('/') ? sub : '/' + sub;

                const finalPath = base + (cleanSub === '/' ? '' : cleanSub);
                console.log(`[Proxy] ${req.method} ${path} -> ${finalPath}`);
                return finalPath;
            },
            onProxyReq: (proxyReq, req, res) => {
                proxyReq.removeHeader('Cookie');
                proxyReq.setHeader('Host', targetUrl.host);
                proxyReq.removeHeader('Origin');
                proxyReq.removeHeader('Referer');
            },
            onProxyRes: (proxyRes, req, res) => {
                // Log only in dev or on error to keep production logs clean
                if (proxyRes.statusCode >= 400) {
                    console.error(`[Proxy Error] ${req.method} ${proxyRes.statusCode} on ${req.url}`);
                }
            },
            onError: (err, req, res) => {
                console.error('[Proxy Critical Error]:', err);
                res.status(500).json({ status: 'error', message: 'Proxy failure', details: err.message });
            }
        })(req, res, next);
    } catch (e) {
        res.status(400).json({ error: 'Invalid target URL' });
    }
});

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - return index.html for any unknown route
// Use general middleware to avoid Express 5 path-to-regexp issues
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Proxy endpoint: http://localhost:${PORT}/api/tmdb`);
    console.log(`CORS Proxy: http://localhost:${PORT}/api/proxy`);
});
