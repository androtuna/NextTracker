import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Global Logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

app.use(cors());

// --- MANUEL TMDB PROXY ---
app.use('/api/tmdb', async (req, res) => {
    const apiKey = (process.env.TMDB_API_KEY || '').trim();
    if (!apiKey) {
        console.error('[TMDB] API Key missing');
        return res.status(500).json({ error: 'TMDB_API_KEY is not set' });
    }

    const subPath = req.url;
    const targetUrl = new URL(`https://api.themoviedb.org/3${subPath}`);

    targetUrl.searchParams.set('api_key', apiKey);
    targetUrl.searchParams.set('language', 'tr-TR');

    console.log(`[TMDB Proxy] Fetching: ${targetUrl.pathname}`);

    try {
        const response = await fetch(targetUrl.toString());
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('[TMDB Proxy Error]', error.message);
        res.status(500).json({ error: 'TMDB Connection Failed' });
    }
});

// --- MANUEL OMDB PROXY ---
app.get('/api/omdb/:imdbId', async (req, res) => {
    const apiKey = (process.env.OMDB_API_KEY || '').trim();
    if (!apiKey) {
        console.error('[OMDb] API Key missing');
        return res.status(500).json({ error: 'OMDB_API_KEY is not set' });
    }

    const imdbId = req.params.imdbId;
    if (!imdbId) return res.status(400).json({ error: 'Missing imdbId' });

    const targetUrl = new URL('http://www.omdbapi.com/');
    targetUrl.searchParams.set('i', imdbId);
    targetUrl.searchParams.set('apikey', apiKey);
    targetUrl.searchParams.set('plot', 'short');

    console.log(`[OMDb Proxy] Fetching: ${imdbId}`);

    try {
        const response = await fetch(targetUrl.toString());
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('[OMDb Proxy Error]', error.message);
        res.status(500).json({ error: 'OMDb Connection Failed' });
    }
});

// SPA & Static Files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Catch-all (Express 5 uyumlu)
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Secure API Gateway running on port ${PORT}`);
});
