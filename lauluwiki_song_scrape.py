#!/usr/bin/env python3
"""
Sitsi Song Scraper for Lauluwiki.fi
Uses Selenium to handle JavaScript-rendered content.
"""

import re
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

# Configuration
URL = "https://lauluwiki.fi/"
OUTPUT_DIR = Path("./sitsi_songs_lauluwiki")
SCROLL_PAUSE_TIME = 2  # Seconds to wait between scrolls
REQUEST_DELAY = 0.5    # Delay between saving songs

OUTPUT_DIR.mkdir(exist_ok=True)

def setup_driver():
    """Set up Chrome driver with appropriate options."""
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in background (remove to see browser)
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def scroll_to_load_all_songs(driver, max_scrolls=50):
    """
    Scroll the page to trigger loading of all songs.
    The page loads songs as you scroll.
    """
    last_height = driver.execute_script("return document.body.scrollHeight")
    
    for scroll_count in range(max_scrolls):
        # Scroll down
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        
        # Wait for new content to load
        time.sleep(SCROLL_PAUSE_TIME)
        
        # Calculate new scroll height
        new_height = driver.execute_script("return document.body.scrollHeight")
        
        # Check if we've reached the bottom
        if new_height == last_height:
            print(f"  Reached bottom after {scroll_count + 1} scrolls")
            break
        
        last_height = new_height
        print(f"  Scrolled {scroll_count + 1}, new height: {new_height}")
    
    return True

def extract_songs_from_page(driver):
    """
    Extract all songs from the loaded page.
    Each song is in <section class="song">
    """
    songs = []
    
    # Wait for at least one song to load
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "song"))
        )
    except:
        print("Warning: No songs found on page")
        return songs
    
    # Find all song sections
    song_sections = driver.find_elements(By.CLASS_NAME, "song")
    print(f"Found {len(song_sections)} song sections")
    
    for i, section in enumerate(song_sections):
        try:
            song_data = {}
            
            # Extract title (h1)
            title_elem = section.find_element(By.TAG_NAME, "h1")
            song_data['title'] = title_elem.text.strip()
            
            # Extract all paragraphs with class "bold" (categories and melody)
            bold_paragraphs = section.find_elements(By.CSS_SELECTOR, "p.bold")
            
            for p in bold_paragraphs:
                text = p.text.strip()
                if text.startswith("Kategoriat:"):
                    song_data['categories'] = text.replace("Kategoriat:", "").strip()
                elif text.startswith("Melodia:"):
                    song_data['melody'] = text.replace("Melodia:", "").strip()
            
            # Extract lyrics from <pre> tag
            pre_elem = section.find_element(By.TAG_NAME, "pre")
            song_data['lyrics'] = pre_elem.text.strip()
            
            songs.append(song_data)
            
        except Exception as e:
            print(f"  Error extracting song {i}: {e}")
            continue
    
    return songs

def save_song(song_data: dict):
    """Save a single song as a formatted .txt file."""
    title = song_data['title']
    
    # Determine category folder (first letter or special category)
    first_char = title[0].upper() if title else 'Z'
    if not first_char.isalpha():
        first_char = '#'
    
    category_folder = OUTPUT_DIR / first_char
    category_folder.mkdir(exist_ok=True)
    
    # Create safe filename
    safe_title = re.sub(r'[\\/*?:"<>|]', '', title)
    safe_title = safe_title.replace(' ', '_')[:100]
    filepath = category_folder / f"{safe_title}.txt"
    
    # Build content
    content_lines = []
    content_lines.append(f"Title: {title}")
    content_lines.append(f"Category: {first_char}")
    content_lines.append(f"Source: https://lauluwiki.fi/")
    content_lines.append(f"Source_Type: Lauluwiki")
    content_lines.append(f"Type: sitsi_song")
    
    if song_data.get('melody'):
        content_lines.append(f"Melody: {song_data['melody']}")
    if song_data.get('categories'):
        content_lines.append(f"Tags: {song_data['categories']}")
    
    content_lines.append("")
    content_lines.append("---LYRICS---")
    content_lines.append("")
    content_lines.append(song_data['lyrics'])
    content_lines.append("")
    content_lines.append("---END---")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("\n".join(content_lines))
    
    return filepath

def scrape_all_songs():
    """Main scraping function."""
    print("🚀 Starting Lauluwiki scraper...")
    print(f"URL: {URL}")
    
    driver = setup_driver()
    
    try:
        print("Loading page...")
        driver.get(URL)
        
        # Wait for initial page load
        time.sleep(3)
        
        print("Scrolling to load all songs...")
        scroll_to_load_all_songs(driver)
        
        print("Extracting songs...")
        songs = extract_songs_from_page(driver)
        
        if not songs:
            print("No songs found! The page structure might have changed.")
            print("Dumping page source for debugging...")
            with open("debug_page_source.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            print("Saved page source to debug_page_source.html")
            return 0, []
        
        print(f"\n📝 Saving {len(songs)} songs...")
        
        successful = 0
        failed = []
        
        for i, song in enumerate(songs):
            try:
                print(f"  [{i+1}/{len(songs)}] {song['title']}")
                filepath = save_song(song)
                print(f"    ✓ Saved to {filepath}")
                successful += 1
                time.sleep(REQUEST_DELAY)
            except Exception as e:
                print(f"    ✗ Error: {e}")
                failed.append((song.get('title', 'Unknown'), str(e)))
        
        # Summary
        print("\n" + "="*60)
        print("🎵 SCRAPING COMPLETE!")
        print("="*60)
        print(f"Total songs saved: {successful}")
        print(f"Failed: {len(failed)}")
        
        if failed:
            print("\n❌ Failed songs:")
            for title, error in failed[:10]:
                print(f"  - {title}: {error}")
        
        return successful, failed
    
    finally:
        driver.quit()

def scrape_single_song_for_testing():
    """
    Test function to see what the page looks like.
    Useful for debugging.
    """
    driver = setup_driver()
    
    try:
        driver.get(URL)
        time.sleep(5)
        
        # Wait for songs
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "song"))
        )
        
        # Get first song
        first_song = driver.find_element(By.CLASS_NAME, "song")
        
        print("\n=== FIRST SONG STRUCTURE ===")
        print(f"HTML:\n{first_song.get_attribute('innerHTML')[:2000]}")
        
        # Save screenshot
        driver.save_screenshot("lauluwiki_screenshot.png")
        print("\nScreenshot saved to lauluwiki_screenshot.png")
        
    finally:
        driver.quit()

# ============================================
# Main execution
# ============================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Scrape sitsi songs from Lauluwiki.fi',
        epilog='Example: python scrape_lauluwiki.py --test'
    )
    
    parser.add_argument('--test', action='store_true',
                       help='Test mode: show first song structure without saving all')
    parser.add_argument('--limit', type=int, default=None,
                       help='Maximum number of songs to scrape (not fully supported due to dynamic loading)')
    
    args = parser.parse_args()
    
    if args.test:
        scrape_single_song_for_testing()
    else:
        scrape_all_songs()