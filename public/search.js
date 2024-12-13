
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
const CLIENT_ID = 'client_id';
const CLIENT_SECRET = 'client_secret';
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

// Route de recherche principale
app.get('/api/search', async (req, res) => {
    try {
        const { q, type = 'track,artist,album' } = req.query;
        const token = await getSpotifyToken();
        
        const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: {
                q: q,
                type: type,
                market: 'FR',
                limit: 20,
                include_external: 'audio'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la recherche',
            details: error.response?.data || error.message 
        });
    }
});

// Route pour les nouveautés
app.get('/api/new-releases', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get('https://api.spotify.com/v1/browse/new-releases', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { 
                country: 'FR',
                limit: 20 
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la récupération des nouveautés:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des nouveautés' });
    }
});

// Route pour les détails d'un artiste
app.get('/api/artists/:id', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const { id } = req.params;

        const [artistResponse, topTracksResponse] = await Promise.all([
            axios.get(`https://api.spotify.com/v1/artists/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            axios.get(`https://api.spotify.com/v1/artists/${id}/top-tracks`, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { market: 'FR' }
            })
        ]);

        res.json({
            ...artistResponse.data,
            topTracks: topTracksResponse.data.tracks
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de l\'artiste:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des détails de l\'artiste' });
    }
});

// Route pour les tops tracks d'un artiste
app.get('/api/artists/:id/top-tracks', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get(`https://api.spotify.com/v1/artists/${req.params.id}/top-tracks`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { market: 'FR' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la récupération des tops tracks:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des tops tracks' });
    }
});

// Route pour les détails d'un album
app.get('/api/albums/:id', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const [albumResponse, tracksResponse] = await Promise.all([
            axios.get(`https://api.spotify.com/v1/albums/${req.params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            axios.get(`https://api.spotify.com/v1/albums/${req.params.id}/tracks`, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { limit: 50 }
            })
        ]);

        res.json({
            ...albumResponse.data,
            tracks: tracksResponse.data
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de l\'album:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des détails de l\'album' });
    }
});

// Route pour les pistes d'un album
app.get('/api/albums/:id/tracks', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get(`https://api.spotify.com/v1/albums/${req.params.id}/tracks`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { 
                limit: 50,
                market: 'FR'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la récupération des pistes:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des pistes' });
    }
});

// Route pour les détails d'une piste
app.get('/api/tracks/:id', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get(`https://api.spotify.com/v1/tracks/${req.params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { market: 'FR' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la récupération de la piste:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de la piste' });
    }
});

// Route pour les playlists
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

// Route pour générer des images placeholder
app.get('/api/placeholder/:width/:height', (req, res) => {
    const { width, height } = req.params;
    res.redirect(`https://via.placeholder.com/${width}x${height}`);
});

// Routes HTML
app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

app.get('/song/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'song.html'));
});

app.get('/artist/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'artist.html'));
});

// Route par défaut
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

