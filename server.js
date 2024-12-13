// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuration Spotify
const CLIENT_ID = 'Client_ID';
const CLIENT_SECRET = 'Client_secret';
let spotifyToken = null;
let tokenExpirationTime = null;

// Fonction pour obtenir un token Spotify
async function getSpotifyToken() {
    try {
        if (spotifyToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
            return spotifyToken;
        }

        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            params: {
                grant_type: 'client_credentials'
            },
            headers: {
                'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        spotifyToken = response.data.access_token;
        tokenExpirationTime = Date.now() + (response.data.expires_in * 1000);
        return spotifyToken;
    } catch (error) {
        console.error('Erreur lors de l\'obtention du token:', error);
        throw error;
    }
}

// Routes existantes
app.get('/api/new-releases', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get('https://api.spotify.com/v1/browse/new-releases', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { limit: 20, country: 'FR' }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des nouveautés' });
    }
});

// Nouvelles routes pour les albums
app.get('/api/albums/:id', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get(`https://api.spotify.com/v1/albums/${req.params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'album:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'album' });
    }
});

app.get('/api/albums/:id/tracks', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get(`https://api.spotify.com/v1/albums/${req.params.id}/tracks`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { limit: 50 }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la récupération des pistes:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des pistes de l\'album' });
    }
});

// Routes pour les artistes
app.get('/api/artists/:id', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get(`https://api.spotify.com/v1/artists/${req.params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'artiste:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'artiste' });
    }
});

app.get('/api/artists/:id/top-tracks', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get(`https://api.spotify.com/v1/artists/${req.params.id}/top-tracks`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { market: 'FR' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la récupération des top tracks:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des top tracks' });
    }
});

// Route pour la recherche
app.get('/api/search', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: {
                q: req.query.q,
                type: 'track,artist,album',
                limit: 20,
                market: 'FR'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        res.status(500).json({ error: 'Erreur lors de la recherche' });
    }
});

// Route pour obtenir une playlist
app.get('/api/playlists/:id', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${req.params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la récupération de la playlist:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de la playlist' });
    }
});

// Route pour les vues HTML
app.get('/song/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'song.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
