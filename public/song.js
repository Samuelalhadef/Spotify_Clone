// song.js
document.addEventListener('DOMContentLoaded', async () => {
    // Récupérer l'album ID de l'URL et les infos stockées
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');

    if (!albumId) {
        console.error('Aucun ID d\'album fourni');
        return;
    }

    // État global
    const state = {
        albumData: null,
        currentTrack: null,
        isPlaying: false,
        tracks: []
    };

    // Éléments DOM
    const elements = {
        songCover: document.getElementById('songCover'),
        songTitle: document.getElementById('songTitle'),
        artistImage: document.getElementById('artistImage'),
        artistName: document.getElementById('artistName'),
        albumName: document.getElementById('albumName'),
        releaseYear: document.getElementById('releaseYear'),
        lyrics: document.getElementById('lyrics'),
        popularTracks: document.getElementById('popularTracks'),
        popularArtistName: document.getElementById('popularArtistName'),
        playButton: document.querySelector('.play-button')
    };

    // Charger les détails de l'album
    async function loadAlbumDetails() {
        try {
            const response = await fetch(`/api/albums/${albumId}`);
            const albumData = await response.json();
            state.albumData = albumData;
            updateAlbumUI(albumData);
            await loadArtistDetails(albumData.artists[0].id);
            await loadAlbumTracks(albumId);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'album:', error);
            showError('Impossible de charger les détails de l\'album');
        }
    }

    // Charger les pistes de l'album
    async function loadAlbumTracks(albumId) {
        try {
            const response = await fetch(`/api/albums/${albumId}/tracks`);
            const data = await response.json();
            state.tracks = data.items;
            updateTracksUI(data.items);
        } catch (error) {
            console.error('Erreur lors du chargement des pistes:', error);
        }
    }

    // Charger les détails de l'artiste
    async function loadArtistDetails(artistId) {
        try {
            const response = await fetch(`/api/artists/${artistId}`);
            const artistData = await response.json();
            updateArtistUI(artistData);
            await loadTopTracks(artistId);
        } catch (error) {
            console.error('Erreur lors du chargement des détails de l\'artiste:', error);
        }
    }

    // Charger les tops tracks de l'artiste
    async function loadTopTracks(artistId) {
        try {
            const response = await fetch(`/api/artists/${artistId}/top-tracks`);
            const data = await response.json();
            updatePopularTracksUI(data.tracks);
        } catch (error) {
            console.error('Erreur lors du chargement des tops tracks:', error);
        }
    }

    // Mettre à jour l'interface avec les détails de l'album
    function updateAlbumUI(album) {
        document.title = `${album.name} - ${album.artists[0].name} | Spotify`;
        
        elements.songCover.src = album.images[0]?.url || '/api/placeholder/300/300';
        elements.songCover.alt = `Couverture de l'album ${album.name}`;
        
        elements.songTitle.textContent = album.name;
        elements.albumName.textContent = album.name;
        elements.albumName.href = `/album/${album.id}`;
        
        elements.releaseYear.textContent = new Date(album.release_date).getFullYear();
    }

    // Mettre à jour l'interface avec les détails de l'artiste
    function updateArtistUI(artist) {
        elements.artistImage.src = artist.images[0]?.url || '/api/placeholder/40/40';
        elements.artistImage.alt = `Photo de ${artist.name}`;
        
        elements.artistName.textContent = artist.name;
        elements.artistName.href = `/artist/${artist.id}`;
        
        elements.popularArtistName.textContent = artist.name;
    }

    // Mettre à jour l'interface avec les pistes
    function updateTracksUI(tracks) {
        const tracksList = tracks.map((track, index) => `
            <div class="track-item" data-track-id="${track.id}">
                <span class="track-number">${index + 1}</span>
                <div class="track-info">
                    <div class="track-name">${track.name}</div>
                    <div class="track-meta">
                        ${track.artists.map(artist => artist.name).join(', ')}
                    </div>
                </div>
                <span class="track-duration">${formatDuration(track.duration_ms)}</span>
            </div>
        `).join('');

        elements.popularTracks.innerHTML = tracksList;
        attachTrackEvents();
    }

    // Mettre à jour l'interface avec les tops tracks
    function updatePopularTracksUI(tracks) {
        const popularTracksList = tracks.slice(0, 5).map((track, index) => `
            <div class="track-item" data-track-id="${track.id}">
                <span class="track-number">${index + 1}</span>
                <img src="${track.album.images[track.album.images.length-1].url}" 
                     alt="${track.name}" 
                     class="track-image">
                <div class="track-info">
                    <div class="track-name">${track.name}</div>
                    <div class="track-meta">${formatNumber(track.popularity)} lectures</div>
                </div>
                <span class="track-duration">${formatDuration(track.duration_ms)}</span>
            </div>
        `).join('');

        const popularTracksContainer = document.createElement('div');
        popularTracksContainer.className = 'popular-tracks';
        popularTracksContainer.innerHTML = popularTracksList;

        const currentContainer = elements.popularTracks.querySelector('.popular-tracks');
        if (currentContainer) {
            elements.popularTracks.replaceChild(popularTracksContainer, currentContainer);
        } else {
            elements.popularTracks.appendChild(popularTracksContainer);
        }
    }

    // Attacher les événements aux pistes
    function attachTrackEvents() {
        const trackItems = document.querySelectorAll('.track-item');
        trackItems.forEach(item => {
            item.addEventListener('click', () => {
                const trackId = item.dataset.trackId;
                playTrack(trackId);
            });
        });
    }

    // Jouer une piste
    function playTrack(trackId) {
        const track = state.tracks.find(t => t.id === trackId);
        if (track) {
            state.currentTrack = track;
            state.isPlaying = true;
            updatePlaybackUI();
            // Ici, vous pourriez ajouter la logique de lecture réelle
            console.log('Lecture de:', track.name);
        }
    }

    // Mettre à jour l'interface de lecture
    function updatePlaybackUI() {
        if (state.currentTrack) {
            // Mettre à jour le lecteur en bas
            // Cette partie dépendra de votre implémentation du lecteur
        }
    }

    // Utilitaires
    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('fr-FR').format(num);
    }

    function showError(message) {
        // Vous pouvez implémenter votre propre logique d'affichage d'erreur ici
        console.error(message);
    }

    // Événements des boutons
    elements.playButton?.addEventListener('click', () => {
        if (state.tracks.length > 0) {
            playTrack(state.tracks[0].id);
        }
    });

    // Initialisation
    await loadAlbumDetails();
});