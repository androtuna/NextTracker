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

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Proxy API requests to TMDB
// Endpoint: /api/tmdb/search/multi?query=inception -> https://api.themoviedb.org/3/search/multi?query=inception&api_key=SECRET
app.use('/api/tmdb', createProxyMiddleware({
    target: 'https://api.themoviedb.org/3',
    changeOrigin: true,
    pathRewrite: {
        '^/api/tmdb': '', // strip /api/tmdb from the path
    },
    onProxyReq: (proxyReq, req, res) => {
        // Inject API Key from Environment Variable
        const apiKey = process.env.TMDB_API_KEY;

        if (!apiKey) {
            console.error('TMDB_API_KEY is missing in environment variables!');
            return;
        }

        // Append api_key to query parameters
        // Check if there are existing query params
        const currentPath = proxyReq.path;
        const separator = currentPath.includes('?') ? '&' : '?';
        const newPath = `${currentPath}${separator}api_key=${apiKey}&language=tr-TR`;

        proxyReq.path = newPath;

        // Log for debugging (Do not log full keys in production ideally, but helpful for setup)
        console.log(`Proxied request to: ${newPath.replace(apiKey, 'HIDDEN')}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ error: 'Proxy Error', details: err.message });
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
                const target = new URL(r.headers['x-target-url']);
                // Ensure base path doesn't have double slashes
                const base = target.pathname.endsWith('/') ? target.pathname.slice(0, -1) : target.pathname;

                // Extract everything after /api/proxy
                const subMatch = path.match(/^\/api\/proxy(.*)/);
                const sub = subMatch ? subMatch[1] : '';
                const cleanSub = sub.startsWith('/') ? sub : '/' + sub;

                const finalPath = base + (cleanSub === '/' ? '' : cleanSub);
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
