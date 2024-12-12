document.addEventListener('DOMContentLoaded', () => {
    // État global de l'application
    const state = {
        currentTrack: null,
        isPlaying: false,
        volume: 0.75,
        playlists: []
    };

    // Sélecteurs DOM fréquemment utilisés
    const elements = {
        recentTracks: document.getElementById('recent-tracks'),
        playlistList: document.getElementById('playlist-list'),
        playButton: document.querySelector('.play-pause'),
        volumeSlider: document.querySelector('.volume-slider'),
        progressBar: document.querySelector('.progress-bar'),
        trackName: document.querySelector('.track-name'),
        artistName: document.querySelector('.artist-name'),
        trackArtwork: document.querySelector('.track-artwork')
    };

    // Fonction pour charger les nouveautés
    async function loadNewReleases() {
        try {
            const response = await fetch('/api/new-releases');
            const data = await response.json();
            
            if (elements.recentTracks) {
                elements.recentTracks.innerHTML = data.albums.items.map(album => `
                    <div class="media-card" data-album-id="${album.id}">
                        <div class="media-image">
                            <img src="${album.images[0].url}" alt="${album.name}">
                            <button class="play-button">
                                <svg role="img" height="24" width="24" viewBox="0 0 24 24">
                                    <path d="M7.05 3.606l13.49 7.788a.7.7 0 010 1.212L7.05 20.394A.7.7 0 016 19.788V4.212a.7.7 0 011.05-.606z"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="media-info">
                            <div class="media-title">${album.name}</div>
                            <div class="media-artist">${album.artists.map(artist => artist.name).join(', ')}</div>
                        </div>
                    </div>
                `).join('');

                // Ajouter les événements de clic pour la navigation et la lecture
                attachCardEvents();
            }
        } catch (error) {
            console.error('Erreur lors du chargement des nouveautés:', error);
        }
    }

    // Nouvelle fonction pour attacher les événements aux cartes média
    function attachCardEvents() {
        const mediaCards = document.querySelectorAll('.media-card');
        mediaCards.forEach(card => {
            // Événement pour le clic sur la carte (navigation vers chanson.html)
            card.addEventListener('click', function(e) {
                if (!e.target.closest('.play-button')) {
                    const albumId = this.dataset.albumId;
                    navigateToSong(albumId);
                }
            });

            // Événement pour le bouton play
            const playButton = card.querySelector('.play-button');
            playButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const albumId = card.dataset.albumId;
                playAlbum(albumId);
            });
        });
    }

    // Fonction pour naviguer vers la page chanson.html
    function navigateToSong(albumId) {
        // Sauvegarder l'état actuel si nécessaire
        localStorage.setItem('lastPlayedAlbum', albumId);
        // Rediriger vers chanson.html avec l'ID de l'album
        window.location.href = `/chanson.html?id=${albumId}`;
    }

    // Fonction pour jouer un album
    async function playAlbum(albumId) {
        try {
            // Charger les informations de l'album
            const response = await fetch(`/api/track/${albumId}`);
            const albumData = await response.json();
            
            // Mettre à jour l'état et l'interface
            state.currentTrack = albumData;
            state.isPlaying = true;
            updatePlayerUI();
            
            // Sauvegarder l'album en cours dans le localStorage
            localStorage.setItem('currentlyPlaying', JSON.stringify({
                albumId: albumId,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Erreur lors de la lecture de l\'album:', error);
        }
    }

    // Fonction pour charger les playlists
    async function loadPlaylists() {
        try {
            const response = await fetch('/api/featured-playlists');
            const data = await response.json();
            state.playlists = data.playlists.items;

            if (elements.playlistList) {
                elements.playlistList.innerHTML = state.playlists.map(playlist => `
                    <a href="#" data-playlist-id="${playlist.id}">${playlist.name}</a>
                `).join('');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des playlists:', error);
        }
    }

    // Fonction pour mettre à jour l'interface du lecteur
    function updatePlayerUI() {
        if (!state.currentTrack) return;

        elements.trackName.textContent = state.currentTrack.name;
        elements.artistName.textContent = state.currentTrack.artists[0].name;
        if (state.currentTrack.album.images.length > 0) {
            elements.trackArtwork.src = state.currentTrack.album.images[0].url;
        }

        elements.playButton.innerHTML = state.isPlaying ? `
            <svg role="img" height="16" width="16" viewBox="0 0 16 16">
                <path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"></path>
            </svg>
        ` : `
            <svg role="img" height="16" width="16" viewBox="0 0 16 16">
                <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"></path>
            </svg>
        `;
    }

    // Gestionnaires d'événements pour les contrôles du lecteur
    elements.playButton?.addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        updatePlayerUI();
    });

    elements.volumeSlider?.addEventListener('input', (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const volume = Math.max(0, Math.min(1, x / rect.width));
        state.volume = volume;
        
        const volumeProgress = elements.volumeSlider.querySelector('.volume-progress');
        if (volumeProgress) {
            volumeProgress.style.width = `${volume * 100}%`;
        }
    });

    // Fonction de recherche
    async function searchContent(query) {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            // Traiter les résultats de la recherche ici
            console.log('Résultats de la recherche:', data);
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
        }
    }

    // Gestionnaire d'événements pour le champ de recherche
    const searchInput = document.querySelector('input[type="search"]');
    let searchTimeout;
    
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query) {
                searchContent(query);
            }
        }, 300);
    });

    // Restaurer l'état précédent lors du chargement
    function restoreState() {
        const currentlyPlaying = localStorage.getItem('currentlyPlaying');
        if (currentlyPlaying) {
            const { albumId, timestamp } = JSON.parse(currentlyPlaying);
            // Vérifier si les données ne sont pas trop anciennes (par exemple, 24h)
            const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
            
            if (!isExpired) {
                playAlbum(albumId);
            } else {
                localStorage.removeItem('currentlyPlaying');
            }
        }
    }

    // Initialisation
    async function initialize() {
        await Promise.all([
            loadNewReleases(),
            loadPlaylists()
        ]);
        restoreState();
    }

    // Lancer l'initialisation
    initialize();
});

