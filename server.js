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
// Bu bölüm Express'in rota motoruna güvenmeden isteği yakalar
app.use('/api/tmdb', async (req, res) => {
    const apiKey = (process.env.TMDB_API_KEY || '').trim();
    if (!apiKey) {
        console.error('[TMDB] API Key missing');
        return res.status(500).json({ error: 'TMDB_API_KEY is not set' });
    }

    // req.url burada /movie/popular veya /search/multi?query=... şeklindedir
    const subPath = req.url;
    const targetUrl = new URL(`https://api.themoviedb.org/3${subPath}`);

    // API anahtarını ve dili ekle
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

// --- MANUEL WEBDAV PROXY ---
app.use('/api/proxy', async (req, res) => {
    const targetUrlHeader = req.headers['x-target-url'];
    if (!targetUrlHeader) return res.status(400).send('Missing x-target-url');

    try {
        const targetUrl = new URL(targetUrlHeader);

        // Forward all relevant headers for WebDAV
        const headers = {};
        const skipHeaders = ['host', 'connection', 'x-target-url'];
        Object.entries(req.headers).forEach(([key, value]) => {
            if (!skipHeaders.includes(key.toLowerCase())) {
                headers[key] = value;
            }
        });
        headers['host'] = targetUrl.host;

        // Methods that usually have a body in WebDAV
        const hasBody = !['GET', 'HEAD', 'DELETE'].includes(req.method);

        const response = await fetch(targetUrlHeader, {
            method: req.method,
            headers: headers,
            body: hasBody ? req : undefined,
            // @ts-ignore - duplex is needed for streaming request body in Node.js fetch
            duplex: hasBody ? 'half' : undefined
        });

        const data = await response.text();

        // Forward back response headers
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        res.status(response.status).send(data);
    } catch (error) {
        console.error('[Generic Proxy Error]', error.message);
        res.status(500).send(error.message);
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
