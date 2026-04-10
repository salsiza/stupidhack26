#!/usr/bin/env python3
"""
Sitsi Song Scraper for TKOaly/laulum.me GitHub repository
Fetches .md files from GitHub and saves them in the same format as the Niksula scraper
"""

import re
import time
import yaml
import requests
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from urllib.parse import urljoin

# Configuration
GITHUB_API_BASE = "https://api.github.com/repos/TKOaly/laulum.me/contents/songs"
RAW_BASE = "https://raw.githubusercontent.com/TKOaly/laulum.me/main/songs"
OUTPUT_DIR = Path("./sitsi_songs")
REQUEST_DELAY = 0.3  # Be respectful to GitHub API

# Create output directory
OUTPUT_DIR.mkdir(exist_ok=True)

def get_github_contents(path: str = "") -> List[Dict[str, Any]]:
    """
    Fetch directory contents from GitHub API.
    Returns list of file/directory metadata.
    """
    url = f"{GITHUB_API_BASE}/{path}" if path else GITHUB_API_BASE
    print(f"  Fetching: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"    Error fetching {url}: {e}")
        return []

def find_all_md_files(relative_path: str = "") -> List[Tuple[str, str]]:
    """
    Recursively find all .md files in the songs directory.
    Returns list of (relative_path_without_ext, raw_url) tuples.
    """
    md_files = []
    contents = get_github_contents(relative_path)
    
    for item in contents:
        if item['type'] == 'file' and item['name'].endswith('.md'):
            # Extract name without .md
            name = item['name'][:-3]
            # Build raw URL
            raw_url = f"{RAW_BASE}/{relative_path}/{item['name']}" if relative_path else f"{RAW_BASE}/{item['name']}"
            # Store with relative path for folder structure
            folder = relative_path.replace('/', '_') if relative_path else ""
            md_files.append((name, raw_url, folder))
        
        elif item['type'] == 'dir':
            # Recursively process subdirectories
            sub_path = f"{relative_path}/{item['name']}" if relative_path else item['name']
            sub_files = find_all_md_files(sub_path)
            md_files.extend(sub_files)
    
    return md_files

def parse_frontmatter(content: str) -> Tuple[Dict[str, str], str]:
    """
    Parse YAML frontmatter from markdown content.
    Frontmatter is between --- markers at the top of the file.
    Returns (metadata_dict, lyrics_body).
    """
    metadata = {}
    lyrics = content
    
    # Pattern for YAML frontmatter
    # Matches --- at start, then content, then ---
    frontmatter_pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.search(frontmatter_pattern, content, re.DOTALL)
    
    if match:
        frontmatter_text = match.group(1)
        lyrics = match.group(2).strip()
        
        # Parse YAML
        try:
            parsed = yaml.safe_load(frontmatter_text)
            if parsed and isinstance(parsed, dict):
                # Convert all values to strings
                for key, value in parsed.items():
                    if value is not None:
                        if isinstance(value, list):
                            metadata[key] = ', '.join(str(v) for v in value)
                        else:
                            metadata[key] = str(value)
        except yaml.YAMLError as e:
            print(f"    Warning: Could not parse YAML frontmatter: {e}")
            # Fallback: manual parsing
            for line in frontmatter_text.split('\n'):
                if ':' in line:
                    key, val = line.split(':', 1)
                    metadata[key.strip()] = val.strip()
    
    return metadata, lyrics

def extract_drinking_cue_from_lyrics(lyrics: str) -> Optional[str]:
    """
    Try to infer drinking cues from lyrics content.
    Sitsi songs often have embedded cues.
    """
    lyrics_lower = lyrics.lower()
    
    cues = []
    if 'tyhjennetään' in lyrics_lower or 'empty' in lyrics_lower:
        cues.append('tyhjennetään')
    if 'siemaillaan' in lyrics_lower or 'sip' in lyrics_lower:
        cues.append('siemaillaan')
    if 'kolmessa huikassa' in lyrics_lower:
        cues.append('kolmessa huikassa')
    if 'huikka' in lyrics_lower:
        cues.append('huikka')
    if 'skool' in lyrics_lower or 'skål' in lyrics_lower:
        cues.append('skool')
    
    return ', '.join(cues) if cues else None

def determine_category(title: str, metadata: Dict[str, str]) -> str:
    """
    Determine which category folder to put the song in.
    Uses first letter of title, or a special category for certain types.
    """
    # Check for special categories in metadata
    if metadata.get('category'):
        cat = metadata['category'].strip().upper()
        if len(cat) > 3:
            cat = cat[:3]  # Shorten long category names
        return cat
    
    # Check for special prefixes
    title_upper = title.upper()
    if title_upper.startswith('SNAPSI') or 'SNAPSI' in title_upper:
        return 'SNAPSI'
    if 'JUOMALAULU' in title_upper:
        return 'JUOMALAULU'
    
    # Default: first letter (A, B, C...)
    first_char = title[0].upper() if title else 'Z'
    # Handle Finnish letters
    if first_char in ['Å', 'Ä', 'Ö']:
        return first_char
    # Non-letters go to '#'
    if not first_char.isalpha():
        return 'NUMBERS'
    return first_char

def save_song_from_md(title: str, lyrics: str, raw_url: str, metadata: Dict[str, str], category: str = None):
    """
    Save a song in the same format as the Niksula scraper.
    """
    if not category:
        category = determine_category(title, metadata)
    
    # Create category folder
    category_folder = OUTPUT_DIR / category
    category_folder.mkdir(exist_ok=True)
    
    # Create safe filename
    safe_title = re.sub(r'[\\/*?:"<>|]', '', title)
    safe_title = safe_title.replace(' ', '_')
    safe_title = safe_title[:100]  # Limit length
    filepath = category_folder / f"{safe_title}.txt"
    
    # Build content with metadata (same format as Niksula scraper)
    content_lines = []
    content_lines.append(f"Title: {title}")
    content_lines.append(f"Category: {category}")
    content_lines.append(f"Source: {raw_url}")
    content_lines.append(f"Source_Type: GitHub/laulum.me")
    content_lines.append(f"Type: sitsi_song")
    
    # Add metadata from frontmatter
    if metadata.get('melody'):
        content_lines.append(f"Melody: {metadata['melody']}")
    if metadata.get('writers') or metadata.get('author'):
        writers = metadata.get('writers') or metadata.get('author')
        content_lines.append(f"Writers: {writers}")
    if metadata.get('thanks'):
        content_lines.append(f"Thanks: {metadata['thanks']}")
    if metadata.get('year'):
        content_lines.append(f"Year: {metadata['year']}")
    
    # Add drinking cue if found
    drinking_cue = extract_drinking_cue_from_lyrics(lyrics)
    if drinking_cue:
        content_lines.append(f"Drinking_Cue: {drinking_cue}")
    
    content_lines.append("")
    content_lines.append("---LYRICS---")
    content_lines.append("")
    content_lines.append(lyrics)
    content_lines.append("")
    content_lines.append("---END---")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("\n".join(content_lines))
    
    return filepath

def scrape_all_github_songs(limit: int = None, resume_from: str = None):
    """
    Main function to scrape all .md files from the GitHub repository.
    
    Args:
        limit: Maximum number of songs to scrape
        resume_from: Song title to resume from (approximate)
    """
    print("🔍 Finding all .md files in the repository...")
    md_files = find_all_md_files()
    
    print(f"Found {len(md_files)} markdown files")
    
    if resume_from:
        # Find starting index
        start_idx = 0
        for i, (name, _, _) in enumerate(md_files):
            if name >= resume_from:
                start_idx = i
                break
        md_files = md_files[start_idx:]
        print(f"Resuming from song: {resume_from}")
    
    if limit:
        md_files = md_files[:limit]
        print(f"Limited to first {limit} songs")
    
    successful = 0
    failed = []
    
    for i, (name, raw_url, folder) in enumerate(md_files):
        print(f"\n[{i+1}/{len(md_files)}] Processing: {name}")
        
        try:
            # Fetch the raw markdown content
            response = requests.get(raw_url, timeout=15)
            response.raise_for_status()
            content = response.text
            
            # Parse frontmatter and lyrics
            metadata, lyrics = parse_frontmatter(content)
            
            if lyrics:
                # Use folder from GitHub as category hint, or determine from title
                category = folder if folder else determine_category(name, metadata)
                filepath = save_song_from_md(name, lyrics, raw_url, metadata, category)
                print(f"  ✓ Saved to {filepath} (melody: {metadata.get('melody', 'unknown')})")
                successful += 1
            else:
                print(f"  ✗ No lyrics found (got {len(lyrics) if lyrics else 0} chars)")
                failed.append((name, raw_url, "No lyrics"))
        
        except Exception as e:
            print(f"  ✗ Error: {e}")
            failed.append((name, raw_url, str(e)))
        
        # Be respectful to GitHub
        time.sleep(REQUEST_DELAY)
    
    # Summary
    print("\n" + "="*60)
    print("🎵 SCRAPING COMPLETE!")
    print("="*60)
    print(f"Total songs saved: {successful}")
    print(f"Failed: {len(failed)}")
    
    if failed:
        print("\n❌ Failed songs:")
        for name, url, error in failed[:10]:
            print(f"  - {name}: {error}")
    
    return successful, failed

def scrape_single_github_song(url: str, title: str = None):
    """
    Scrape a single song from a raw GitHub URL for testing.
    Example: https://raw.githubusercontent.com/TKOaly/laulum.me/main/songs/Halkoon.md
    """
    if not title:
        # Extract title from URL
        title = url.split('/')[-1].replace('.md', '').replace('_', ' ')
    
    print(f"Scraping: {title}")
    
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        content = response.text
        
        metadata, lyrics = parse_frontmatter(content)
        
        if lyrics:
            category = determine_category(title, metadata)
            filepath = save_song_from_md(title, lyrics, url, metadata, category)
            print(f"✓ Saved to {filepath}")
            return filepath
        else:
            print("✗ No lyrics found")
            return None
    
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def preview_github_structure():
    """
    Preview the structure of the GitHub repository without downloading all songs.
    """
    print("📂 Fetching repository structure...")
    
    def print_tree(path: str = "", indent: str = ""):
        contents = get_github_contents(path)
        for item in contents:
            if item['type'] == 'dir':
                print(f"{indent}📁 {item['name']}/")
                print_tree(f"{path}/{item['name']}" if path else item['name'], indent + "  ")
            elif item['name'].endswith('.md'):
                print(f"{indent}📄 {item['name']}")
    
    print_tree()
    
    # Count files
    md_files = find_all_md_files()
    print(f"\nTotal .md files found: {len(md_files)}")

# ============================================
# Main execution
# ============================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Scrape sitsi songs from TKOaly/laulum.me GitHub repository',
        epilog='Example: python scrape_github_songs.py --preview'
    )
    
    parser.add_argument('--limit', type=int, default=None,
                       help='Maximum number of songs to scrape')
    parser.add_argument('--resume', type=str, default=None,
                       help='Resume from a specific song title')
    parser.add_argument('--single', type=str, default=None,
                       help='Scrape a single raw GitHub URL (e.g., https://raw.githubusercontent.com/.../song.md)')
    parser.add_argument('--delay', type=float, default=0.3,
                       help='Delay between requests (seconds)')
    parser.add_argument('--preview', action='store_true',
                       help='Preview repository structure without scraping')
    
    args = parser.parse_args()
    
    REQUEST_DELAY = args.delay
    
    if args.preview:
        preview_github_structure()
    elif args.single:
        scrape_single_github_song(args.single)
    else:
        scrape_all_github_songs(limit=args.limit, resume_from=args.resume)