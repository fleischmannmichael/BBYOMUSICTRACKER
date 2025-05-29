#!/usr/bin/env python3
"""
🎵 BBYO Global Music Overlap Tracker - Web Scraping Implementation
Scrapes current chart data from kworb.net which aggregates real-time Spotify data.
This gives us ACTUAL current hits like Taylor Swift, The Weeknd, etc.!
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from collections import defaultdict
import os
import re

# Countries with their kworb.net chart URLs
CHART_URLS = {
    "Global": "https://kworb.net/spotify/country/global_daily.html",
    "USA": "https://kworb.net/spotify/country/us_daily.html", 
    "UK": "https://kworb.net/spotify/country/gb_daily.html",
    "Canada": "https://kworb.net/spotify/country/ca_daily.html",
    "Germany": "https://kworb.net/spotify/country/de_daily.html",
    "France": "https://kworb.net/spotify/country/fr_daily.html",
    "Australia": "https://kworb.net/spotify/country/au_daily.html",
    "Netherlands": "https://kworb.net/spotify/country/nl_daily.html",
    "Spain": "https://kworb.net/spotify/country/es_daily.html",
    "Italy": "https://kworb.net/spotify/country/it_daily.html",
    "Sweden": "https://kworb.net/spotify/country/se_daily.html",
    "Norway": "https://kworb.net/spotify/country/no_daily.html",
    "Denmark": "https://kworb.net/spotify/country/dk_daily.html",
    "Finland": "https://kworb.net/spotify/country/fi_daily.html",
    "Poland": "https://kworb.net/spotify/country/pl_daily.html",
    "Czech Republic": "https://kworb.net/spotify/country/cz_daily.html",
    "Belgium": "https://kworb.net/spotify/country/be_daily.html",
    "Switzerland": "https://kworb.net/spotify/country/ch_daily.html",
    "Austria": "https://kworb.net/spotify/country/at_daily.html",
    "Portugal": "https://kworb.net/spotify/country/pt_daily.html",
    "Ireland": "https://kworb.net/spotify/country/ie_daily.html",
    "Brazil": "https://kworb.net/spotify/country/br_daily.html",
    "Mexico": "https://kworb.net/spotify/country/mx_daily.html",
    "Argentina": "https://kworb.net/spotify/country/ar_daily.html",
    "Chile": "https://kworb.net/spotify/country/cl_daily.html",
    "Colombia": "https://kworb.net/spotify/country/co_daily.html",
    "Israel": "https://kworb.net/spotify/country/il_daily.html",
    "South Africa": "https://kworb.net/spotify/country/za_daily.html",
    "New Zealand": "https://kworb.net/spotify/country/nz_daily.html"
}

def clean_artist_name(raw_artist):
    """
    Clean up artist names from chart data.
    Removes featuring artists, collaborations, etc. to get main artist.
    """
    if not raw_artist:
        return None
    
    # Remove common separators and get main artist
    artist = raw_artist.split(' feat.')[0]
    artist = artist.split(' ft.')[0] 
    artist = artist.split(' featuring')[0]
    artist = artist.split(' x ')[0]
    artist = artist.split(' & ')[0]
    artist = artist.split(' and ')[0]
    
    # Clean up extra whitespace
    artist = artist.strip()
    
    return artist if artist else None

def scrape_country_chart(url, country_name, top_n=50):
    """
    Scrape top artists from a country's Spotify chart on kworb.net.
    
    Args:
        url (str): URL to scrape
        country_name (str): Name of country for logging
        top_n (int): Number of top tracks to get
    
    Returns:
        list: List of artist names
    """
    try:
        print(f"🎵 Fetching current hits for {country_name}...")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find the main chart table
        chart_rows = soup.find_all('tr')
        artists = []
        
        for row in chart_rows[:top_n + 5]:  # Get a few extra in case some are filtered out
            cells = row.find_all('td')
            if len(cells) >= 2:
                # Look for artist and title in the second cell usually
                artist_cell = None
                for cell in cells[1:3]:  # Check cells 2 and 3
                    links = cell.find_all('a')
                    if len(links) >= 2:
                        artist_cell = cell
                        break
                
                if artist_cell:
                    links = artist_cell.find_all('a')
                    if len(links) >= 2:
                        artist_name = links[0].get_text().strip()
                        
                        # Clean the artist name
                        clean_artist = clean_artist_name(artist_name)
                        
                        if clean_artist and clean_artist not in artists:
                            artists.append(clean_artist)
                            
                            if len(artists) >= top_n:
                                break
        
        print(f"✅ Found {len(artists)} artists for {country_name}")
        
        # Show a few examples for verification
        if artists:
            examples = artists[:3]
            print(f"   Top artists: {', '.join(examples)}")
        
        return artists
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error for {country_name}: {e}")
        return []
    except Exception as e:
        print(f"❌ Parse error for {country_name}: {e}")
        return []

def find_global_overlaps(min_countries=3):
    """
    Find artists that appear in multiple countries' current charts.
    
    Args:
        min_countries (int): Minimum number of countries an artist must chart in
    
    Returns:
        list: List of dictionaries with artist and countries data
    """
    print("🌍 Analyzing current Spotify charts across BBYO countries...")
    print("📊 This uses REAL current streaming data, not outdated APIs!\n")
    
    artist_countries = defaultdict(list)
    successful_countries = 0
    
    # Get current chart data for all countries
    for country, url in CHART_URLS.items():
        artists = scrape_country_chart(url, country, top_n=50)
        
        if artists:
            successful_countries += 1
            # Track which countries each artist appears in
            for artist in artists:
                if artist and country not in artist_countries[artist]:
                    artist_countries[artist].append(country)
        
        # Be nice to the server
        time.sleep(1)
    
    print(f"\n📈 Successfully analyzed {successful_countries} countries")
    
    # Filter artists that appear in multiple countries
    global_artists = []
    for artist, countries in artist_countries.items():
        if len(countries) >= min_countries:
            global_artists.append({
                "artist": artist,
                "countries_charted": sorted(countries),
                "country_count": len(countries)
            })
    
    # Sort by popularity (number of countries)
    global_artists.sort(key=lambda x: x['country_count'], reverse=True)
    
    return global_artists

def save_to_json(data, filename="artists.json"):
    """Save the results to a JSON file in the same directory."""
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Data saved to {filename}")
    print(f"📁 File location: {os.path.abspath(filename)}")
    print(f"🌐 Ready for your website!")

def main():
    """Main execution function."""
    print("🎵 BBYO Global Music Overlap Tracker - Real-Time Edition")
    print("=" * 60)
    print("📡 Sources: Current Spotify charts via kworb.net")
    print("🎯 Expect: Taylor Swift, The Weeknd, Bad Bunny, etc.")
    print("⚡ Data: Updated daily with real streaming numbers")
    print("=" * 60)
    
    # Find global artist overlaps
    global_artists = find_global_overlaps(min_countries=3)
    
    # Display results
    print(f"\n🎯 Found {len(global_artists)} artists charting in 3+ countries:")
    print("\n🏆 TOP 15 GLOBAL ARTISTS (Real Current Data):")
    print("-" * 50)
    
    for i, artist_data in enumerate(global_artists[:15], 1):
        countries_str = ", ".join(artist_data['countries_charted'][:6])
        if len(artist_data['countries_charted']) > 6:
            countries_str += f" (+{len(artist_data['countries_charted']) - 6} more)"
        
        print(f"  {i:2d}. {artist_data['artist']}")
        print(f"      📈 {artist_data['country_count']} countries: {countries_str}")
        print()
    
    # Save results
    save_to_json(global_artists)
    
    print("✅ Analysis complete!")
    print("🎵 You should now see CURRENT popular artists!")
    print("🚀 Perfect for BBYO teen audiences - deploy your website!")
    
    # Quick data quality check
    top_5_artists = [artist['artist'] for artist in global_artists[:5]]
    expected_current_artists = ['Taylor Swift', 'The Weeknd', 'Bad Bunny', 'Olivia Rodrigo', 'Dua Lipa']
    
    matches = sum(1 for artist in top_5_artists if any(expected in artist for expected in expected_current_artists))
    
    if matches >= 2:
        print("✅ Data quality check: PASSED - Found current popular artists!")
    else:
        print("⚠️  Data might need verification - check if results match current trends")

if __name__ == "__main__":
    main()