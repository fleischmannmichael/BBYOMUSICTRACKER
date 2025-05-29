// BBYO Music Tracker - Clean & Efficient Frontend

class MusicTracker {
    constructor() {
        this.artists = [];
        this.filteredArtists = [];
        this.expandedRows = new Set();
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.renderTable();
    }

    setupEventListeners() {
        // Search input with debounce
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 250);
        });

        // Filter dropdown
        document.getElementById('minCountries').addEventListener('change', (e) => {
            this.handleFilter(parseInt(e.target.value));
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetFilters();
        });
    }

    async loadData() {
        try {
            this.showLoading();
            const response = await fetch('../data/artists.json');
            
            if (!response.ok) throw new Error('Data not found');
            
            this.artists = await response.json();
            this.filteredArtists = [...this.artists];
            this.updateStats();
            this.hideLoading();
            
        } catch (error) {
            console.log('Using sample data for demo');
            this.loadSampleData();
            document.getElementById('error').style.display = 'block';
            setTimeout(() => {
                document.getElementById('error').style.display = 'none';
            }, 3000);
        }
    }

    loadSampleData() {
        this.artists = [
            { artist: "Taylor Swift", countries_charted: ["USA", "UK", "Canada", "Germany", "France", "Australia", "Netherlands", "Belgium"], country_count: 8 },
            { artist: "The Weeknd", countries_charted: ["USA", "UK", "Canada", "Germany", "France", "Netherlands", "Australia"], country_count: 7 },
            { artist: "Bad Bunny", countries_charted: ["Argentina", "Mexico", "Spain", "Colombia", "Chile", "Brazil"], country_count: 6 },
            { artist: "Ed Sheeran", countries_charted: ["UK", "Germany", "France", "Netherlands", "Australia", "Canada"], country_count: 6 },
            { artist: "Dua Lipa", countries_charted: ["UK", "Germany", "France", "Netherlands", "Belgium"], country_count: 5 },
            { artist: "Olivia Rodrigo", countries_charted: ["USA", "UK", "Canada", "Australia", "Netherlands"], country_count: 5 },
            { artist: "Harry Styles", countries_charted: ["USA", "UK", "Canada", "Australia", "Germany"], country_count: 5 },
            { artist: "Billie Eilish", countries_charted: ["USA", "UK", "Canada", "Germany"], country_count: 4 },
            { artist: "Drake", countries_charted: ["USA", "UK", "Canada", "Australia"], country_count: 4 },
            { artist: "Ariana Grande", countries_charted: ["USA", "UK", "Canada"], country_count: 3 },
            { artist: "Post Malone", countries_charted: ["USA", "UK", "Canada"], country_count: 3 },
            { artist: "Imagine Dragons", countries_charted: ["USA", "Germany", "France"], country_count: 3 }
        ];
        
        this.filteredArtists = [...this.artists];
        this.updateStats();
        this.hideLoading();
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('results').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('results').style.display = 'block';
    }

    updateStats() {
        const total = this.filteredArtists.length;
        const avgOverlap = total > 0 
            ? (this.filteredArtists.reduce((sum, artist) => sum + artist.country_count, 0) / total).toFixed(1)
            : '0';

        document.getElementById('showingCount').textContent = total;
        document.getElementById('totalCount').textContent = this.artists.length;
        document.getElementById('avgOverlap').textContent = avgOverlap;
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredArtists = [...this.artists];
        } else {
            this.filteredArtists = this.artists.filter(artist => {
                const artistMatch = artist.artist.toLowerCase().includes(searchTerm);
                const countryMatch = artist.countries_charted.some(country => 
                    country.toLowerCase().includes(searchTerm)
                );
                return artistMatch || countryMatch;
            });
        }
        
        this.applyCountryFilter();
        this.renderTable();
        this.updateStats();
    }

    handleFilter(minCountries) {
        this.applyCountryFilter(minCountries);
        this.renderTable();
        this.updateStats();
    }

    applyCountryFilter(minCountries = null) {
        if (minCountries === null) {
            minCountries = parseInt(document.getElementById('minCountries').value);
        }

        this.filteredArtists = this.filteredArtists.filter(artist => 
            artist.country_count >= minCountries
        );
    }

    resetFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('minCountries').value = '1'; // Changed to show all artists by default
        
        this.filteredArtists = [...this.artists];
        this.applyCountryFilter(1); // Apply "All Artists" filter
        this.expandedRows.clear();
        this.renderTable();
        this.updateStats();
    }

    renderTable() {
        const tbody = document.getElementById('artistTableBody');
        const noResults = document.getElementById('noResults');

        if (this.filteredArtists.length === 0) {
            tbody.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        
        // Sort by country count (descending)
        const sortedArtists = [...this.filteredArtists].sort((a, b) => b.country_count - a.country_count);
        
        tbody.innerHTML = sortedArtists.map((artist, index) => {
            const isExpanded = this.expandedRows.has(artist.artist);
            return this.createTableRow(artist, index + 1, isExpanded);
        }).join('');

        // Add click listeners for expansion
        tbody.querySelectorAll('.artist-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.expand-btn')) return;
                this.toggleRow(row.dataset.artist);
            });
        });

        tbody.querySelectorAll('.expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleRow(btn.dataset.artist);
            });
        });
    }

    createTableRow(artist, rank, isExpanded) {
        const expandIcon = isExpanded ? '▲' : '▼';
        const expandedClass = isExpanded ? 'expanded' : '';
        const expandedBtnClass = isExpanded ? 'expanded' : '';
        
        // Create visual indicators based on country count - no emojis
        let popularityLevel = '';
        if (artist.country_count >= 15) {
            popularityLevel = 'mega-global';
        } else if (artist.country_count >= 10) {
            popularityLevel = 'super-global';
        } else if (artist.country_count >= 7) {
            popularityLevel = 'very-global';
        } else if (artist.country_count >= 5) {
            popularityLevel = 'global';
        } else {
            popularityLevel = 'regional';
        }
        
        let html = `
            <tr class="artist-row ${expandedClass} ${popularityLevel}" data-artist="${this.escapeHtml(artist.artist)}">
                <td class="rank">${rank}</td>
                <td class="artist-name">${this.escapeHtml(artist.artist)}</td>
                <td class="country-count">
                    <strong>${artist.country_count}</strong>
                    <span class="country-label">${artist.country_count === 1 ? 'country' : 'countries'}</span>
                </td>
                <td>
                    <button class="expand-btn ${expandedBtnClass}" data-artist="${this.escapeHtml(artist.artist)}">
                        ${expandIcon}
                    </button>
                </td>
            </tr>
        `;

        if (isExpanded) {
            // Group countries by region for better visualization
            const regions = this.groupCountriesByRegion(artist.countries_charted);
            
            html += `
                <tr class="country-details">
                    <td colspan="4">
                        <div class="countries-header">
                            <strong>Global Reach: ${artist.country_count} Countries</strong>
                        </div>
                        <div class="regions-container">
                            ${Object.entries(regions).map(([region, countries]) => `
                                <div class="region-group">
                                    <div class="region-title">${region} (${countries.length})</div>
                                    <div class="countries-grid">
                                        ${countries.map(country => 
                                            `<span class="country-tag ${this.getCountryClass(country)}">${country}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="intersection-note">
                            This artist has strong global appeal across ${Object.keys(regions).length} regions
                        </div>
                    </td>
                </tr>
            `;
        }

        return html;
    }

    groupCountriesByRegion(countries) {
        const regions = {
            'Global': [],
            'North America': [],
            'Europe': [],
            'Latin America': [],
            'Asia Pacific': [],
            'Other': []
        };

        countries.forEach(country => {
            if (country === 'Global') {
                regions['Global'].push(country);
            } else if (['USA', 'Canada'].includes(country)) {
                regions['North America'].push(country);
            } else if (['UK', 'Germany', 'France', 'Netherlands', 'Spain', 'Italy', 'Sweden', 'Norway', 'Denmark', 'Belgium', 'Switzerland', 'Austria', 'Ireland', 'Poland', 'Czech Republic', 'Portugal', 'Finland'].includes(country)) {
                regions['Europe'].push(country);
            } else if (['Mexico', 'Argentina', 'Colombia', 'Chile', 'Brazil', 'Peru', 'Uruguay'].includes(country)) {
                regions['Latin America'].push(country);
            } else if (['Australia', 'New Zealand', 'Japan', 'South Korea', 'India', 'Philippines', 'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Vietnam', 'Taiwan', 'Hong Kong'].includes(country)) {
                regions['Asia Pacific'].push(country);
            } else {
                regions['Other'].push(country);
            }
        });

        // Remove empty regions
        Object.keys(regions).forEach(region => {
            if (regions[region].length === 0) {
                delete regions[region];
            }
        });

        return regions;
    }

    getCountryClass(country) {
        if (country === 'Global') return 'global-tag';
        if (['USA', 'UK', 'Canada', 'Germany', 'France'].includes(country)) return 'major-market';
        return 'standard-market';
    }

    toggleRow(artistName) {
        if (this.expandedRows.has(artistName)) {
            this.expandedRows.delete(artistName);
        } else {
            this.expandedRows.add(artistName);
        }
        this.renderTable();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MusicTracker();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});