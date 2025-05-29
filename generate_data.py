#!/usr/bin/env python3
"""
🎵 BBYO Global Music Overlap Tracker - FINAL VERSION
Scrapes current chart data from kworb.net to find artists popular across BBYO countries.
This is the production-ready, complete implementation.
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from collections import defaultdict
import os
import re

# BBYO Countries and Regions with their kworb.net chart URLs
CHART_URLS = {
    # Global Charts
    "Global": "https://kworb.net/spotify/country/global_daily.html",
    
    # Major Countries
    "USA": "https://kworb.net/spotify/country/us_daily.html", 
    "Canada": "https://kworb.net/spotify/country/ca_daily.html",
    "UK": "https://kworb.net/spotify/country/gb_daily.html",
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
    "New Zealand": "https://kworb.net/spotify/country/nz_daily.html",
    "Japan": "https://kworb.net/spotify/country/jp_daily.html",
    "South Korea": "https://kworb.net/spotify/country/kr_daily.html",
    "India": "https://kworb.net/spotify/country/in_daily.html",
    "Singapore": "https://kworb.net/spotify/country/sg_daily.html",
    "Thailand": "https://kworb.net/spotify/country/th_daily.html",
    "Philippines": "https://kworb.net/spotify/country/ph_daily.html",
    "Malaysia": "https://kworb.net/spotify/country/my_daily.html",
    "Indonesia": "https://kworb.net/spotify/country/id_daily.html",
    "Taiwan": "https://kworb.net/spotify/country/tw_daily.html",
    "Hong Kong": "https://kworb.net/spotify/country/hk_daily.html",
    "Turkey": "https://kworb.net/spotify/country/tr_daily.html",
    "Romania": "https://kworb.net/spotify/country/ro_daily.html",
    "Bulgaria": "https://kworb.net/spotify/country/bg_daily.html",
    "Hungary": "https://kworb.net/spotify/country/hu_daily.html",
    "Slovakia": "https://kworb.net/spotify/country/sk_daily.html",
    "Estonia": "https://kworb.net/spotify/country/ee_daily.html",
    "Latvia": "https://kworb.net/spotify/country/lv_daily.html",
    "Lithuania": "https://kworb.net/spotify/country/lt_daily.html",
    "Croatia": "https://kworb.net/spotify/country/hr_daily.html",
    "Peru": "https://kworb.net/spotify/country/pe_daily.html",
    "Uruguay": "https://kworb.net/spotify/country/uy_daily.html",
    "Venezuela": "https://kworb.net/spotify/country/ve_daily.html",
    "Costa Rica": "https://kworb.net/spotify/country/cr_daily.html"
}

def clean_artist_name(raw_artist):
    """Clean up artist names from chart data."""
    if not raw_artist:
        return None
    
    # Remove common separators and get main artist
    artist = raw_artist.split(' feat.')[0]
    artist = artist.split(' ft.')[0] 
    artist = artist.split(' featuring')[0]
    artist = artist.split(' x ')[0]
    artist = artist.split(' & ')[0]
    artist = artist.split(' and ')[0]
    
    # Clean up extra whitespace and special characters
    artist = re.sub(r'\s+', ' ', artist.strip())
    
    return artist if artist else None

def scrape_country_chart(url, country_name, top_n=50):
    """Scrape top artists from a country's Spotify chart."""
    try:
        print(f"🎵 Fetching current hits for {country_name}...")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find the main chart table rows
        chart_rows = soup.find_all('tr')
        artists = []
        
        for row in chart_rows[:top_n + 10]:  # Get extra in case some are filtered
            cells = row.find_all('td')
            if len(cells) >= 2:
                # Look for artist name in table cells
                artist_cell = None
                for cell in cells[1:4]:  # Check relevant cells
                    links = cell.find_all('a')
                    if len(links) >= 1:
                        artist_cell = cell
                        break
                
                if artist_cell:
                    links = artist_cell.find_all('a')
                    if len(links) >= 1:
                        # First link is usually the artist
                        artist_name = links[0].get_text().strip()
                        
                        # Clean the artist name
                        clean_artist = clean_artist_name(artist_name)
                        
                        if clean_artist and clean_artist not in artists:
                            artists.append(clean_artist)
                            
                            if len(artists) >= top_n:
                                break
        
        print(f"✅ Found {len(artists)} artists for {country_name}")
        
        # Show top 3 for verification
        if artists:
            examples = artists[:3]
            print(f"   Top artists: {', '.join(examples)}")
        
        return artists[:top_n]  # Ensure we don't exceed limit
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error for {country_name}: {e}")
        return []
    except Exception as e:
        print(f"❌ Parse error for {country_name}: {e}")
        return []

def find_global_overlaps(min_countries=2):
    """Find artists that appear in multiple countries' current charts."""
    print("🌍 BBYO Global Music Overlap Analysis")
    print("=" * 60)
    print("📊 Analyzing current Spotify charts across 50 BBYO regions")
    print("⚡ Using real-time streaming data from kworb.net")
    print("🎯 Supporting BBYO communities worldwide")
    print("=" * 60)
    
    artist_countries = defaultdict(set)  # Use set to avoid duplicates
    successful_countries = 0
    failed_countries = []
    
    # Get current chart data for all countries
    for country, url in CHART_URLS.items():
        artists = scrape_country_chart(url, country, top_n=50)
        
        if artists:
            successful_countries += 1
            # Track which countries each artist appears in
            for artist in artists:
                if artist:
                    artist_countries[artist].add(country)
        else:
            failed_countries.append(country)
        
        # Be respectful to the server
        time.sleep(1.2)
    
    print(f"\n📈 Analysis Results:")
    print(f"✅ Successfully analyzed: {successful_countries} countries")
    if failed_countries:
        print(f"⚠️  Failed to get data: {', '.join(failed_countries[:5])}")
    
    # Convert sets back to sorted lists and filter by minimum countries
    global_artists = []
    for artist, countries_set in artist_countries.items():
        countries_list = sorted(list(countries_set))
        if len(countries_list) >= min_countries:
            global_artists.append({
                "artist": artist,
                "countries_charted": countries_list,
                "country_count": len(countries_list)
            })
    
    # Sort by popularity (number of countries)
    global_artists.sort(key=lambda x: x['country_count'], reverse=True)
    
    return global_artists

def save_to_json(data, filename="artists.json"):
    """Save the results to a JSON file."""
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Data saved to: {filename}")
    print(f"📁 Full path: {os.path.abspath(filename)}")
    print(f"📊 File size: {os.path.getsize(filename)} bytes")

def display_results(global_artists, top_n=20):
    """Display the top results in a formatted way."""
    print(f"\n🎯 Found {len(global_artists)} artists charting in 2+ countries")
    print(f"\n🏆 TOP {min(top_n, len(global_artists))} GLOBAL ARTISTS:")
    print("-" * 70)
    
    for i, artist_data in enumerate(global_artists[:top_n], 1):
        countries_str = ", ".join(artist_data['countries_charted'][:6])
        if len(artist_data['countries_charted']) > 6:
            countries_str += f" (+{len(artist_data['countries_charted']) - 6} more)"
        
        print(f"{i:2d}. {artist_data['artist']}")
        print(f"    📈 {artist_data['country_count']} countries: {countries_str}")
        print()

def validate_data_quality(global_artists):
    """Check if the data looks realistic."""
    if not global_artists:
        return False
    
    # Check for current popular artists
    top_artists = [artist['artist'].lower() for artist in global_artists[:10]]
    expected_artists = ['taylor swift', 'the weeknd', 'bad bunny', 'olivia rodrigo', 'dua lipa']
    
    matches = sum(1 for expected in expected_artists 
                  if any(expected in top_artist for top_artist in top_artists))
    
    quality_score = matches / len(expected_artists)
    
    print(f"\n🔍 Data Quality Check:")
    print(f"   Found {matches}/{len(expected_artists)} expected current artists")
    print(f"   Quality score: {quality_score:.1%}")
    
    if quality_score >= 0.4:
        print("   ✅ Data quality: GOOD - Contains current popular artists")
        return True
    else:
        print("   ⚠️  Data quality: QUESTIONABLE - May need verification")
        return False

def main():
    """Main execution function."""
    print("🎵 BBYO Global Music Overlap Tracker")
    print("🏢 Production Version - Final Release")
    print("📅 " + time.strftime("%Y-%m-%d %H:%M:%S"))
    print()
    
    start_time = time.time()
    
    try:
        # Find global artist overlaps
        global_artists = find_global_overlaps(min_countries=2)
        
        if not global_artists:
            print("❌ No data collected. Check your internet connection and try again.")
            return
        
        # Display results
        display_results(global_artists, top_n=20)
        
        # Validate data quality
        validate_data_quality(global_artists)
        
        # Save results
        save_to_json(global_artists)
        
        # Final summary
        execution_time = time.time() - start_time
        print("=" * 50)
        print("✅ ANALYSIS COMPLETE!")
        print(f"⏱️  Execution time: {execution_time:.1f} seconds")
        print(f"📊 Total artists found: {len(global_artists)}")
        print(f"🌍 Global reach artists (5+ countries): {len([a for a in global_artists if a['country_count'] >= 5])}")
        print(f"🎯 Perfect for BBYO event planning!")
        print("🚀 Your artists.json file is ready for the website!")
        
    except KeyboardInterrupt:
        print("\n⏹️  Analysis interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("Please check your internet connection and try again.")

if __name__ == "__main__":
    main()