/**
 * BBYO Global Music Tracker - Production JavaScript
 * Mobile-first music discovery for BBYO event planning
 */

class BBYOMusicTracker {
    constructor() {
        this.artists = [];
        this.filteredArtists = [];
        this.expandedCards = new Set();
        this.playlist = new Set();
        this.currentFilter = 'all';
        this.currentSort = 'popularity';
        this.searchTerm = '';
        this.isLoading = true;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.loadSharedPlaylist();
        this.renderArtists();
    }

    setupEventListeners() {
        // Search with debounce
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.filterAndRender();
            }, 300);
        });

        // Filter chips
        document.getElementById('filters').addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-chip')) {
                document.querySelectorAll('.filter-chip').forEach(chip => 
                    chip.classList.remove('active')
                );
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterAndRender();
            }
        });

        // Sort button
        document.getElementById('sortBtn').addEventListener('click', () => {
            this.toggleSort();
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Show all button (no results)
        document.getElementById('showAllBtn').addEventListener('click', () => {
            this.showAllArtists();
        });

        // Floating playlist
        document.getElementById('floatingPlaylist').addEventListener('click', () => {
            this.openPlaylistModal();
        });

        // Modal controls
        this.setupModalListeners();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupModalListeners() {
        const modal = document.getElementById('playlistModal');
        
        // Close modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closePlaylistModal();
        });

        // Modal backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePlaylistModal();
            }
        });

        // Export options
        document.getElementById('exportSpotify').addEventListener('click', () => this.exportToSpotify());
        document.getElementById('exportList').addEventListener('click', () => this.exportList());
        document.getElementById('exportEmail').addEventListener('click', () => this.exportEmail());
        document.getElementById('shareLink').addEventListener('click', () => this.shareLink());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Focus search with '/'
            if (e.key === '/' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            
            // Close modal with Escape
            if (e.key === 'Escape') {
                this.closePlaylistModal();
                document.getElementById('searchInput').blur();
            }
            
            // Open playlist with Cmd/Ctrl + P
            if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                this.openPlaylistModal();
            }
        });
    }

    async loadData() {
        // Try to load real artists.json data
        const attempts = [
            'artists.json',
            './artists.json',
            `${window.location.pathname}artists.json`.replace('//', '/')
        ];
        
        for (const url of attempts) {
            try {
                console.log(`🔍 Attempting to load: ${url}`);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (response.ok) {
                    const text = await response.text();
                    
                    if (text.trim()) {
                        const data = JSON.parse(text);
                        if (data && Array.isArray(data) && data.length > 0) {
                            this.artists = this.processArtistData(data);
                            console.log(`✅ Successfully loaded ${data.length} real artists from ${url}`);
                            this.hideLoading();
                            return;
                        }
                    }
                }
            } catch (error) {
                console.log(`❌ Failed ${url}: ${error.message}`);
            }
        }
        
        // Fallback to built-in sample data
        console.log('📊 Loading built-in sample data');
        this.loadSampleData();
    }

    processArtistData(data) {
        // Ensure data matches expected format from artists.json
        return data.map(item => ({
            artist: item.artist || 'Unknown Artist',
            countries_charted: item.countries_charted || [],
            country_count: item.country_count || item.countries_charted?.length || 0
        })).filter(item => item.artist !== 'Unknown Artist');
    }

    loadSampleData() {
        // High-quality sample data for demo
        this.artists = [
            { artist: "Taylor Swift", countries_charted: ["Global", "USA", "UK", "Canada", "Germany", "France", "Australia", "Netherlands", "Spain", "Italy", "Sweden", "Norway", "Denmark", "Belgium", "Switzerland", "Austria", "Ireland", "New Zealand"], country_count: 18 },
            { artist: "The Weeknd", countries_charted: ["Global", "USA", "UK", "Canada", "Germany", "France", "Australia", "Netherlands", "Sweden", "Norway", "Denmark", "Belgium"], country_count: 12 },
            { artist: "Bad Bunny", countries_charted: ["Global", "USA", "Spain", "Mexico", "Argentina", "Colombia", "Chile", "Brazil", "France", "Italy"], country_count: 10 },
            { artist: "Olivia Rodrigo", countries_charted: ["Global", "USA", "UK", "Canada", "Australia", "Germany", "France", "Netherlands", "New Zealand"], country_count: 9 },
            { artist: "Dua Lipa", countries_charted: ["Global", "UK", "Germany", "France", "Netherlands", "Belgium", "Italy", "Spain", "Austria"], country_count: 9 },
            { artist: "Harry Styles", countries_charted: ["Global", "USA", "UK", "Canada", "Australia", "Ireland", "Netherlands", "Germany"], country_count: 8 },
            { artist: "Ed Sheeran", countries_charted: ["Global", "UK", "Germany", "Netherlands", "Australia", "Ireland", "Canada", "Belgium"], country_count: 8 },
            { artist: "Billie Eilish", countries_charted: ["Global", "USA", "UK", "Canada", "Germany", "France", "Australia"], country_count: 7 },
            { artist: "Drake", countries_charted: ["Global", "USA", "UK", "Canada", "Australia", "Germany", "France"], country_count: 7 },
            { artist: "Sabrina Carpenter", countries_charted: ["Global", "USA", "UK", "Canada", "Australia", "Germany"], country_count: 6 },
            { artist: "Post Malone", countries_charted: ["Global", "USA", "UK", "Canada", "Germany", "Australia"], country_count: 6 },
            { artist: "SZA", countries_charted: ["USA", "UK", "Canada", "Australia", "Germany"], country_count: 5 },
            { artist: "Chappell Roan", countries_charted: ["USA", "UK", "Canada", "Australia", "Netherlands"], country_count: 5 },
            { artist: "Ariana Grande", countries_charted: ["USA", "UK", "Canada", "Germany", "France"], country_count: 5 },
            { artist: "Lana Del Rey", countries_charted: ["USA", "UK", "France", "Germany"], country_count: 4 },
            { artist: "Bruno Mars", countries_charted: ["USA", "UK", "Australia", "Canada"], country_count: 4 },
            { artist: "Beyoncé", countries_charted: ["USA", "UK", "France", "Germany"], country_count: 4 },
            { artist: "Rihanna", countries_charted: ["USA", "UK", "Canada"], country_count: 3 },
            { artist: "Justin Bieber", countries_charted: ["Canada", "USA", "UK"], country_count: 3 },
            { artist: "Adele", countries_charted: ["UK", "Germany", "Netherlands"], country_count: 3 }
        ];
        
        this.hideLoading();
    }

    hideLoading() {
        this.isLoading = false;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('artistsGrid').style.display = 'block';
        this.filterAndRender();
    }

    filterAndRender() {
        this.filteredArtists = this.artists.filter(artist => {
            // Apply search filter
            if (this.searchTerm) {
                const searchMatch = artist.artist.toLowerCase().includes(this.searchTerm) ||
                                  artist.countries_charted.some(country => 
                                      country.toLowerCase().includes(this.searchTerm)
                                  );
                if (!searchMatch) return false;
            }

            // Apply category filter
            switch (this.currentFilter) {
                case 'global':
                    return artist.country_count >= 5;
                case 'mega':
                    return artist.country_count >= 15;
                case 'trending':
                    return ['Sabrina Carpenter', 'Chappell Roan', 'Olivia Rodrigo', 'SZA', 'Billie Eilish'].includes(artist.artist);
                default:
                    return true;
            }
        });

        this.sortArtists();
        this.renderArtists();
        this.updateStats();
    }

    sortArtists() {
        this.filteredArtists.sort((a, b) => {
            if (this.currentSort === 'popularity') {
                return b.country_count - a.country_count;
            } else {
                return a.artist.localeCompare(b.artist);
            }
        });
    }

    toggleSort() {
        const btn = document.getElementById('sortBtn');
        if (this.currentSort === 'popularity') {
            this.currentSort = 'alphabetical';
            btn.textContent = '🔤 A-Z';
        } else {
            this.currentSort = 'popularity';
            btn.textContent = '⏷ Popularity';
        }
        this.filterAndRender();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        this.searchTerm = '';
        this.currentFilter = 'all';
        
        // Reset filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => 
            chip.classList.remove('active')
        );
        document.querySelector('[data-filter="all"]').classList.add('active');
        
        // Reset sort
        this.currentSort = 'popularity';
        document.getElementById('sortBtn').textContent = '⏷ Popularity';
        
        this.filterAndRender();
    }

    showAllArtists() {
        this.clearFilters();
    }

    renderArtists() {
        const grid = document.getElementById('artistsGrid');
        const noResults = document.getElementById('noResults');

        if (this.filteredArtists.length === 0) {
            grid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        noResults.style.display = 'none';

        grid.innerHTML = this.filteredArtists.map(artist => 
            this.createArtistCard(artist)
        ).join('');

        this.attachCardListeners();
    }

    createArtistCard(artist) {
        const isExpanded = this.expandedCards.has(artist.artist);
        const isInPlaylist = this.playlist.has(artist.artist);
        const popularityLevel = this.getPopularityLevel(artist.country_count);
        
        return `
            <div class="artist-card ${isExpanded ? 'expanded' : ''}" data-artist="${this.escapeHtml(artist.artist)}">
                <div class="artist-header">
                    <div class="artist-info">
                        <h3>${this.escapeHtml(artist.artist)}</h3>
                        <div class="artist-meta">
                            <span class="popularity-badge ${popularityLevel.class}">${popularityLevel.label}</span>
                            <span>•</span>
                            <span>${artist.country_count} region${artist.country_count !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <div class="artist-actions">
                        <div class="playlist-btn ${isInPlaylist ? 'added' : ''}" data-artist="${this.escapeHtml(artist.artist)}">
                            ${isInPlaylist ? '✓' : '+'}
                        </div>
                        <span class="expand-icon">${isExpanded ? '▲' : '▼'}</span>
                    </div>
                </div>
                ${isExpanded ? this.createArtistDetails(artist) : ''}
            </div>
        `;
    }

    createArtistDetails(artist) {
        const majorRegions = ['USA', 'UK', 'Canada', 'Germany', 'France', 'Global', 'Australia'];
        
        return `
            <div class="artist-details">
                <div class="regions-section">
                    <div class="regions-grid">
                        ${artist.countries_charted.map(country => `
                            <div class="region-chip ${majorRegions.includes(country) ? 'major' : ''}">
                                ${this.escapeHtml(country)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getPopularityLevel(count) {
        if (count >= 20) return { class: 'mega-global', label: 'Mega Global' };
        if (count >= 15) return { class: 'super-global', label: 'Super Global' };
        if (count >= 10) return { class: 'very-global', label: 'Very Global' };
        if (count >= 5) return { class: 'global', label: 'Global' };
        return { class: 'regional', label: 'Regional' };
    }

    attachCardListeners() {
        // Card expansion
        document.querySelectorAll('.artist-card').forEach(card => {
            const header = card.querySelector('.artist-header');
            header.addEventListener('click', (e) => {
                if (e.target.closest('.playlist-btn')) return;
                
                const artist = card.dataset.artist;
                this.toggleCardExpansion(artist);
            });

            // Add keyboard support
            card.setAttribute('tabindex', '0');
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (e.target.closest('.playlist-btn')) return;
                    
                    const artist = card.dataset.artist;
                    this.toggleCardExpansion(artist);
                }
            });
        });

        // Playlist buttons
        document.querySelectorAll('.playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const artist = btn.dataset.artist;
                this.togglePlaylist(artist);
            });
        });
    }

    toggleCardExpansion(artistName) {
        if (this.expandedCards.has(artistName)) {
            this.expandedCards.delete(artistName);
        } else {
            this.expandedCards.add(artistName);
        }
        this.renderArtists();
    }

    togglePlaylist(artistName) {
        if (this.playlist.has(artistName)) {
            this.playlist.delete(artistName);
        } else {
            this.playlist.add(artistName);
        }
        this.updatePlaylistUI();
        this.renderArtists();
    }

    updatePlaylistUI() {
        const floating = document.getElementById('floatingPlaylist');
        const count = document.getElementById('playlistCount');
        
        count.textContent = this.playlist.size;
        
        if (this.playlist.size > 0) {
            floating.classList.remove('hidden');
        } else {
            floating.classList.add('hidden');
        }

        this.renderPlaylistModal();
    }

    renderPlaylistModal() {
        const container = document.getElementById('playlistArtists');
        const emptyState = document.getElementById('playlistEmpty');
        
        const playlistArtists = this.artists.filter(artist => 
            this.playlist.has(artist.artist)
        ).sort((a, b) => b.country_count - a.country_count);

        if (playlistArtists.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'flex';
        emptyState.style.display = 'none';

        container.innerHTML = playlistArtists.map(artist => `
            <div class="playlist-artist">
                <div class="playlist-artist-info">
                    <strong>${this.escapeHtml(artist.artist)}</strong>
                    <small>${artist.country_count} region${artist.country_count !== 1 ? 's' : ''} • ${this.getPopularityLevel(artist.country_count).label}</small>
                </div>
                <div class="remove-btn" data-artist="${this.escapeHtml(artist.artist)}">✕</div>
            </div>
        `).join('');

        // Attach remove listeners
        container.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.togglePlaylist(btn.dataset.artist);
            });
        });
    }

    updateStats() {
        document.getElementById('showingCount').textContent = this.filteredArtists.length;
    }

    openPlaylistModal() {
        document.getElementById('playlistModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closePlaylistModal() {
        document.getElementById('playlistModal').classList.remove('show');
        document.body.style.overflow = '';
    }

    // Export Functions
    exportToSpotify() {
        const artists = Array.from(this.playlist);
        if (artists.length === 0) {
            alert('Add some artists to your playlist first!');
            return;
        }

        const searchList = artists.join('\n');
        navigator.clipboard.writeText(searchList).then(() => {
            alert(`✅ Copied ${artists.length} artists!\n\nOpen Spotify and search for each artist to add them to your playlist.`);
        }).catch(() => {
            this.fallbackCopy(searchList);
        });
    }

    exportList() {
        const artists = Array.from(this.playlist);
        if (artists.length === 0) {
            alert('Add some artists to your playlist first!');
            return;
        }

        const artistData = this.artists.filter(artist => this.playlist.has(artist.artist));
        const list = `BBYO Event Playlist - ${new Date().toLocaleDateString()}\n` +
                    `${artists.length} Artists with Global Teen Appeal\n\n` +
                    artistData.map((artist, i) => 
                        `${i + 1}. ${artist.artist} (${artist.country_count} regions)`
                    ).join('\n') +
                    `\n\nGenerated by BBYO Global Music Tracker`;
        
        navigator.clipboard.writeText(list).then(() => {
            alert(`✅ Copied detailed playlist with ${artists.length} artists!`);
        }).catch(() => {
            this.fallbackCopy(list);
        });
    }

    exportEmail() {
        const artists = Array.from(this.playlist);
        if (artists.length === 0) {
            alert('Add some artists to your playlist first!');
            return;
        }

        const artistData = this.artists.filter(artist => this.playlist.has(artist.artist));
        const subject = `BBYO Event Music Recommendations`;
        const body = `Hi!\n\nHere are ${artists.length} artists with proven global teen appeal for our BBYO event:\n\n` +
                    artistData.map((artist, i) => 
                        `${i + 1}. ${artist.artist} - Popular in ${artist.country_count} regions`
                    ).join('\n') +
                    `\n\nThese artists have chart success across multiple BBYO regions, making them perfect for events with diverse audiences.\n\n` +
                    `Generated by BBYO Global Music Tracker`;
        
        const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
    }

    shareLink() {
        const artists = Array.from(this.playlist);
        if (artists.length === 0) {
            alert('Add some artists to your playlist first!');
            return;
        }

        try {
            const playlistData = btoa(JSON.stringify(artists));
            const shareUrl = `${window.location.origin}${window.location.pathname}?playlist=${playlistData}`;
            
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert(`🔗 Playlist link copied!\n\nShare this URL with your team to load your ${artists.length}-artist playlist automatically.`);
            }).catch(() => {
                this.fallbackCopy(shareUrl);
            });
        } catch (error) {
            alert('Unable to create share link. Try using the copy list option instead.');
        }
    }

    fallbackCopy(text) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            alert('✅ Copied to clipboard!');
        } catch (error) {
            alert('Unable to copy. Please select and copy the text manually.');
            console.log(text);
        }
        
        document.body.removeChild(textarea);
    }

    loadSharedPlaylist() {
        const urlParams = new URLSearchParams(window.location.search);
        const playlistData = urlParams.get('playlist');
        
        if (playlistData) {
            try {
                const artists = JSON.parse(atob(playlistData));
                artists.forEach(artist => this.playlist.add(artist));
                this.updatePlaylistUI();
                
                // Clean URL and show notification
                window.history.replaceState({}, document.title, window.location.pathname);
                
                setTimeout(() => {
                    alert(`🎵 Loaded shared playlist with ${artists.length} artists!\n\nClick the floating playlist button to view and manage your selections.`);
                }, 1000);
            } catch (error) {
                console.error('Failed to load shared playlist:', error);
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app
    const tracker = new BBYOMusicTracker();
    
    // Add touch support for better mobile experience
    document.addEventListener('touchstart', () => {}, { passive: true });
    
    // Performance logging
    if (window.performance && window.performance.now) {
        const loadTime = window.performance.now();
        console.log(`🎵 BBYO Music Tracker loaded in ${loadTime.toFixed(1)}ms`);
    }
    
    console.log('🚀 BBYO Global Music Tracker - Production Ready');
    console.log('📱 Optimized for mobile-first experience');
    console.log('🎯 Perfect for BBYO event planning');
});