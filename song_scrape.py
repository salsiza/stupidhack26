#!/usr/bin/env python3
"""
Sitsi Song Scraper - for Niksula/HUT song database
Extracts song lyrics and saves them as formatted text files for RAG
"""

import re
import time
import requests
from pathlib import Path
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from typing import Dict, List, Tuple, Optional

# Configuration
BASE_URL = "https://www.niksula.hut.fi/~sivaron1/l/Kaikki.html"
INDEX_URL = BASE_URL  # The index page you shared
OUTPUT_DIR = Path("./sitsi_songs")
REQUEST_DELAY = 0.5  # Be respectful to the server

# Create output directory
OUTPUT_DIR.mkdir(exist_ok=True)

def get_song_urls_from_index(index_content: str = None, index_url: str = INDEX_URL) -> List[Tuple[str, str]]:
    """
    Extract song URLs and titles from the index page.
    Returns list of (title, url) tuples.
    """
    if index_content is None:
        response = requests.get(index_url)
        response.raise_for_status()
        index_content = response.text
    
    soup = BeautifulSoup(index_content, 'html.parser')
    songs = []
    
    # Find all links that point to .html files (song pages)
    for link in soup.find_all('a', href=True):
        href = link['href']
        title = link.get_text(strip=True)
        
        # Skip if it's just an anchor or empty
        if not href or href.startswith('#') or not title:
            continue
        
        # Build full URL
        full_url = urljoin(BASE_URL, href)
        
        # Only take .html files that aren't the index itself
        if full_url.endswith('.html') and 'index' not in full_url.lower():
            # Clean up title (remove slashes and extra spaces)
            title = re.sub(r'[/<>]', '', title).strip()
            if title:
                songs.append((title, full_url))
    
    # Remove duplicates (some songs appear twice in the index)
    seen = set()
    unique_songs = []
    for title, url in songs:
        if url not in seen:
            seen.add(url)
            unique_songs.append((title, url))
    
    print(f"Found {len(unique_songs)} unique songs")
    return unique_songs

def extract_lyrics_from_page(url: str, html_content: str = None) -> Optional[str]:
    """
    Extract the lyrics/main content from a song page.
    Returns plain text lyrics.
    """
    if html_content is None:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            html_content = response.text
        except Exception as e:
            print(f"  Failed to fetch {url}: {e}")
            return None
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remove script and style elements
    for script in soup(["script", "style", "nav", "header", "footer"]):
        script.decompose()
    
    # Try to find the main content
    # On Niksula pages, lyrics are often in <pre> tags or body text
    lyrics = None
    
    # Method 1: Look for <pre> tags (common for lyrics)
    pre_tags = soup.find_all('pre')
    if pre_tags:
        lyrics = "\n\n".join(tag.get_text() for tag in pre_tags)
    
    # Method 2: Look for <div> with class containing 'lyrics' or 'content'
    if not lyrics:
        for div_class in ['lyrics', 'content', 'main', 'song']:
            divs = soup.find_all('div', class_=re.compile(div_class, re.I))
            if divs:
                lyrics = "\n\n".join(div.get_text() for div in divs)
                break
    
    # Method 3: Just take the body text, but filter out navigation
    if not lyrics:
        body = soup.find('body')
        if body:
            # Remove common navigation elements
            for nav in body.find_all(['nav', 'ul', 'table']):
                nav.decompose()
            lyrics = body.get_text()
    
    # Clean up the lyrics
    if lyrics:
        # Remove excessive whitespace
        lyrics = re.sub(r'\n\s*\n', '\n\n', lyrics)
        lyrics = re.sub(r' +', ' ', lyrics)
        lyrics = lyrics.strip()
        
        # Remove common footer text
        footer_patterns = [
            r'Last modified:.*$',
            r'This page has been processed by.*$',
            r'Back to index.*$',
            r'\[.*\]$',
        ]
        for pattern in footer_patterns:
            lyrics = re.sub(pattern, '', lyrics, flags=re.MULTILINE | re.IGNORECASE)
        lyrics = lyrics.strip()
    
    return lyrics if lyrics else None

def extract_metadata_from_page(html_content: str, url: str) -> Dict[str, str]:
    """
    Extract metadata like possible melody/original song, category, etc.
    """
    metadata = {
        'source_url': url,
        'category': None,
        'melody': None,
        'notes': None,
    }
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Look for melody information (common in sitsi songs)
    # Often appears as "Melodia: ..." or "Sävel: ..."
    text = soup.get_text()
    
    melody_patterns = [
        r'(?:Melodia|Sävel|Melody|To the tune of)[:\s]+([^\n]+)',
        r'\(([^)]+melody[^)]+)\)',
        r'\[([^\]]+sävel[^\]]+)\]',
    ]
    
    for pattern in melody_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            metadata['melody'] = match.group(1).strip()
            break
    
    # Look for category/type (juomalaulu, snapsilaulu, etc.)
    category_patterns = [
        r'(?:Tyyppi|Type|Category)[:\s]+([^\n]+)',
        r'\b(snapsi|juoma|ryyppy|sitsi)\w*laulu\b',
    ]
    
    for pattern in category_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            metadata['category'] = match.group(0).strip()
            break
    
    return metadata

def save_song(title: str, lyrics: str, url: str, metadata: Dict[str, str] = None):
    """
    Save a song as a formatted .txt file with metadata header.
    """
    # Create a safe filename
    safe_title = re.sub(r'[\\/*?:"<>|]', '', title)
    safe_title = safe_title.replace(' ', '_')
    filepath = OUTPUT_DIR / f"{safe_title}.txt"
    
    # Build the file content with metadata
    content_lines = []
    content_lines.append(f"Title: {title}")
    content_lines.append(f"Source: {url}")
    content_lines.append(f"Type: sitsi_song")
    
    if metadata:
        if metadata.get('category'):
            content_lines.append(f"Category: {metadata['category']}")
        if metadata.get('melody'):
            content_lines.append(f"Melody: {metadata['melody']}")
        if metadata.get('notes'):
            content_lines.append(f"Notes: {metadata['notes']}")
    
    content_lines.append("---LYRICS---")
    content_lines.append("")
    content_lines.append(lyrics)
    content_lines.append("")
    content_lines.append("---END---")
    
    # Write to file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("\n".join(content_lines))
    
    return filepath

def scrape_all_songs(limit: int = None, start_from: int = 0):
    """
    Main scraping function.
    
    Args:
        limit: Maximum number of songs to scrape (None for all)
        start_from: Skip first N songs (useful for resuming)
    """
    print("Fetching index page...")
    songs = get_song_urls_from_index()
    
    if start_from > 0:
        songs = songs[start_from:]
        print(f"Starting from song {start_from}")
    
    if limit:
        songs = songs[:limit]
    
    successful = 0
    failed = []
    
    for i, (title, url) in enumerate(songs):
        print(f"[{i+1}/{len(songs)}] Scraping: {title}")
        
        try:
            # Fetch the song page
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            
            # Extract lyrics and metadata
            lyrics = extract_lyrics_from_page(url, response.text)
            metadata = extract_metadata_from_page(response.text, url)
            
            if lyrics and len(lyrics) > 50:  # Ensure we got meaningful content
                filepath = save_song(title, lyrics, url, metadata)
                print(f"  ✓ Saved to {filepath}")
                successful += 1
            else:
                print(f"  ✗ No lyrics found (got {len(lyrics) if lyrics else 0} chars)")
                failed.append((title, url, "No lyrics"))
        
        except Exception as e:
            print(f"  ✗ Error: {e}")
            failed.append((title, url, str(e)))
        
        # Be nice to the server
        time.sleep(REQUEST_DELAY)
    
    # Summary
    print("\n" + "="*50)
    print(f"Scraping complete!")
    print(f"Successful: {successful}")
    print(f"Failed: {len(failed)}")
    
    if failed:
        print("\nFailed songs:")
        for title, url, error in failed[:10]:  # Show first 10
            print(f"  - {title}: {error}")
    
    return successful, failed

def scrape_single_song(url: str, title: str = None):
    """Scrape a single song by URL (for testing or one-off scraping)"""
    if not title:
        # Try to guess title from URL
        title = url.split('/')[-1].replace('.html', '').replace('_', ' ')
    
    print(f"Scraping: {title}")
    response = requests.get(url)
    response.raise_for_status()
    
    lyrics = extract_lyrics_from_page(url, response.text)
    metadata = extract_metadata_from_page(response.text, url)
    
    if lyrics:
        filepath = save_song(title, lyrics, url, metadata)
        print(f"Saved to {filepath}")
        return filepath
    else:
        print("No lyrics found")
        return None

# ============================================
# Main execution
# ============================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Scrape sitsi songs from Niksula archive')
    parser.add_argument('--limit', type=int, default=None, 
                       help='Maximum number of songs to scrape')
    parser.add_argument('--start', type=int, default=0,
                       help='Start from this index (for resuming)')
    parser.add_argument('--single', type=str, default=None,
                       help='Scrape a single song URL instead of all')
    parser.add_argument('--delay', type=float, default=0.5,
                       help='Delay between requests (seconds)')
    
    args = parser.parse_args()
    
    REQUEST_DELAY = args.delay
    
    if args.single:
        scrape_single_song(args.single)
    else:
        scrape_all_songs(limit=args.limit, start_from=args.start)