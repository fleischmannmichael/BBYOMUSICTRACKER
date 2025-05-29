// BBYO Global Music Tracker - Final Production JavaScript

class BBYOMusicTracker {
    constructor() {
        this.artists = [];
        this.filteredArtists = [];
        this.expandedRows = new Set();
        this.dataSource = 'unknown';
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
            }, 300);
        });

        // Filter dropdown
        document.getElementById('minCountries').addEventListener('change', (e) => {
            this.handleFilter(parseInt(e.target.value));
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetFilters();
        });

        // Expand/Collapse all buttons
        document.getElementById('expandAllBtn').addEventListener('click', () => {
            this.expandAll();
        });

        document.getElementById('collapseAllBtn').addEventListener('click', () => {
            this.collapseAll();
        });

        // Show all button (in no results)
        document.getElementById('showAllBtn').addEventListener('click', () => {
            this.showAllArtists();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            if (e.key === 'Escape') {
                this.resetFilters();
            }
        });
    }

    async loadData() {
        this.showLoading();
        
        // Try to load real data from multiple possible paths
        const attempts = [
            'artists.json',
            './artists.json',
            `${window.location.pathname}artists.json`.replace('//', '/'),
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
                            this.artists = data;
                            this.filteredArtists = [...this.artists];
                            this.dataSource = 'real';
                            console.log(`✅ Successfully loaded ${data.length} real artists from ${url}`);
                            this.updateDataSourceIndicator('Real Data');
                            this.applyInitialFilter();
                            this.updateStats();
                            this.hideLoading();
                            return;
                        }
                    }
                }
                
            } catch (error) {
                console.log(`❌ Failed ${url}: ${error.message}`);
            }
        }
        
        // If all attempts failed, use built-in data
        console.log('📊 Loading built-in sample data');
        this.loadBuiltInData();
    }

    loadBuiltInData() {
        // Comprehensive built-in data for demonstration
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
            { artist: "Beyonce", countries_charted: ["USA", "UK", "France", "Germany"], country_count: 4 },
            { artist: "Rihanna", countries_charted: ["USA", "UK", "Canada"], country_count: 3 },
            { artist: "Justin Bieber", countries_charted: ["Canada", "USA", "UK"], country_count: 3 },
            { artist: "Adele", countries_charted: ["UK", "Germany", "Netherlands"], country_count: 3 }
        ];
        
        this.filteredArtists = [...this.artists];
        this.dataSource = 'sample';
        this.updateDataSourceIndicator('Sample Data');
        this.applyInitialFilter();
        this.updateStats();
        this.hideLoading();
        
        console.log(`✅ Loaded ${this.artists.length} sample artists`);
        
        // Show helpful info about getting real data - simplified
        setTimeout(() => {
            console.log('To use real data from all 50 BBYO regions:');
            console.log('1. Run: python generate_data.py');
            console.log('2. Ensure artists.json is in the same folder');
            console.log('3. For local testing: python -m http.server 8000');
        }, 1500);
    }

    applyInitialFilter() {
        const minCountries = parseInt(document.getElementById('minCountries').value);
        this.handleFilter(minCountries);
    }

    updateDataSourceIndicator(source) {
        const indicator = document.querySelector('#dataSource strong');
        if (indicator) {
            indicator.textContent = source;
            indicator.className = this.dataSource === 'real' ? 'real-data' : 'sample-data';
        }
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
        document.getElementById('minCountries').value = '1';
        
        this.filteredArtists = [...this.artists];
        this.expandedRows.clear();
        this.renderTable();
        this.updateStats();
    }

    showAllArtists() {
        document.getElementById('minCountries').value = '1';
        document.getElementById('searchInput').value = '';
        this.resetFilters();
    }

    expandAll() {
        this.filteredArtists.forEach(artist => {
            this.expandedRows.add(artist.artist);
        });
        this.renderTable();
    }

    collapseAll() {
        this.expandedRows.clear();
        this.renderTable();
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

        // Add click listeners for expansion - simplified
        tbody.querySelectorAll('.artist-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.expand-btn')) return;
                this.toggleRow(row.dataset.artist);
            });
            
            // Simple keyboard accessibility
            row.setAttribute('tabindex', '0');
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleRow(row.dataset.artist);
                }
            });
        });

        tbody.querySelectorAll('.expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleRow(btn.dataset.artist);
            });
        });

        // Simple fade-in animation
        tbody.querySelectorAll('.artist-row').forEach((row, index) => {
            setTimeout(() => {
                row.classList.add('fade-in');
            }, index * 25);
        });
    }

    createTableRow(artist, rank, isExpanded) {
        const expandIcon = isExpanded ? '▲' : '▼';
        const expandedClass = isExpanded ? 'expanded' : '';
        const expandedBtnClass = isExpanded ? 'expanded' : '';
        
        // Determine popularity level
        const popularityData = this.getPopularityData(artist.country_count);
        
        let html = `
            <tr class="artist-row ${expandedClass}" data-artist="${this.escapeHtml(artist.artist)}">
                <td class="rank">${rank}</td>
                <td class="artist-name">${this.escapeHtml(artist.artist)}</td>
                <td class="popularity-indicator">
                    <div class="popularity-bar">
                        <div class="popularity-fill ${popularityData.level}"></div>
                    </div>
                    <span class="popularity-label ${popularityData.level}">${popularityData.label}</span>
                </td>
                <td class="country-count">
                    <span class="country-count-number">${artist.country_count}</span>
                    <span class="country-count-label">${artist.country_count === 1 ? 'region' : 'regions'}</span>
                </td>
                <td class="expand-col">
                    <button class="expand-btn ${expandedBtnClass}" data-artist="${this.escapeHtml(artist.artist)}" 
                            aria-label="Show country details for ${this.escapeHtml(artist.artist)}">
                        ${expandIcon}
                    </button>
                </td>
            </tr>
        `;

        if (isExpanded) {
            const regions = this.groupCountriesByRegion(artist.countries_charted);
            
            html += `
                <tr class="country-details">
                    <td colspan="5">
                        <div class="countries-header">
                            Global Reach Analysis: ${artist.country_count} BBYO Regions
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
                            ${this.getInsightText(artist, regions)}
                        </div>
                    </td>
                </tr>
            `;
        }

        return html;
    }

    getPopularityData(countryCount) {
        if (countryCount >= 20) {
            return { level: 'mega-global', label: 'Mega Global' };
        } else if (countryCount >= 15) {
            return { level: 'super-global', label: 'Super Global' };
        } else if (countryCount >= 10) {
            return { level: 'very-global', label: 'Very Global' };
        } else if (countryCount >= 5) {
            return { level: 'global', label: 'Global' };
        } else {
            return { level: 'regional', label: 'Regional' };
        }
    }

    getInsightText(artist, regions) {
        const regionCount = Object.keys(regions).length;
        const countryCount = artist.country_count;
        
        let insight = `This artist has strong appeal across ${regionCount} region${regionCount > 1 ? 's' : ''}.`;
        
        if (countryCount >= 20) {
            insight += " Perfect for global BBYO conventions with massive cross-cultural appeal.";
        } else if (countryCount >= 15) {
            insight += " Excellent choice for international BBYO gatherings and IC events.";
        } else if (countryCount >= 10) {
            insight += " Great for multi-regional BBYO events with broad teen appeal.";
        } else if (countryCount >= 5) {
            insight += " Popular across key BBYO markets - good for regional conventions.";
        } else {
            insight += " Strong in specific markets - ideal for targeted local events.";
        }
        
        return insight;
    }

    groupCountriesByRegion(countries) {
        const regions = {
            'Global': [],
            'North America': [],
            'Europe': [],
            'Latin America': [],
            'Asia Pacific': [],
            'Africa & Middle East': [],
            'BBYO US Regions': []
        };

        countries.forEach(country => {
            if (country === 'Global') {
                regions['Global'].push(country);
            } else if (['USA', 'Canada'].includes(country)) {
                regions['North America'].push(country);
            } else if (['UK', 'Germany', 'France', 'Netherlands', 'Spain', 'Italy', 'Sweden', 'Norway', 'Denmark', 'Belgium', 'Switzerland', 'Austria', 'Ireland', 'Poland', 'Czech Republic', 'Portugal', 'Finland', 'Estonia', 'Latvia', 'Lithuania', 'Croatia', 'Romania', 'Bulgaria', 'Hungary', 'Slovakia'].includes(country)) {
                regions['Europe'].push(country);
            } else if (['Mexico', 'Argentina', 'Colombia', 'Chile', 'Brazil', 'Peru', 'Uruguay', 'Venezuela', 'Costa Rica'].includes(country)) {
                regions['Latin America'].push(country);
            } else if (['Australia', 'New Zealand', 'Japan', 'South Korea', 'India', 'Philippines', 'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Taiwan', 'Hong Kong', 'China'].includes(country)) {
                regions['Asia Pacific'].push(country);
            } else if (['South Africa', 'Israel', 'Turkey', 'Morocco', 'Kenya', 'Uganda'].includes(country)) {
                regions['Africa & Middle East'].push(country);
            } else {
                // BBYO US/Canada regional chapters would go here
                regions['BBYO US Regions'].push(country);
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.musicTracker = new BBYOMusicTracker();
    
    // Add some visual polish
    document.body.classList.add('loaded');
    
    // Performance monitoring
    if (window.performance && window.performance.now) {
        const loadTime = window.performance.now();
        console.log(`🚀 BBYO Music Tracker loaded in ${loadTime.toFixed(1)}ms`);
    }
});