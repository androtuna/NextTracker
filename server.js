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

// --- MANUEL WEBDAV PROXY ---
app.use('/api/proxy', async (req, res) => {
    const targetUrlHeader = req.headers['x-target-url'];
    if (!targetUrlHeader) return res.status(400).send('Missing x-target-url');

    try {
        const targetUrl = new URL(targetUrlHeader);
        // Basit bir forward mekanizması
        const response = await fetch(targetUrlHeader, {
            method: req.method,
            headers: {
                'Authorization': req.headers['authorization'] || '',
                'Content-Type': req.headers['content-type'] || 'application/xml'
            },
            body: ['POST', 'PUT'].includes(req.method) ? req : undefined
        });

        const data = await response.text();
        res.status(response.status).send(data);
    } catch (error) {
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
