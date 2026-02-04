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

// Security: Enable CORS if needed (though we are serving same origin)
app.use(cors());

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

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - return index.html for any unknown route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Proxy endpoint: http://localhost:${PORT}/api/tmdb`);
});
