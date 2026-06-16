import re
import html
import time
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

def fetch_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    ns = {'ns': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    for entry_elem in root.findall('ns:entry', ns):
        # Extract title (usually the date, e.g., "June 15, 2026")
        title_elem = entry_elem.find('ns:title', ns)
        date_str = title_elem.text.strip() if title_elem is not None and title_elem.text else "Unknown Date"
        
        # Extract updated timestamp
        updated_elem = entry_elem.find('ns:updated', ns)
        updated_str = updated_elem.text.strip() if updated_elem is not None and updated_elem.text else ""
        
        # Extract link to release note anchor
        link_elem = entry_elem.find('ns:link', ns)
        link_url = ""
        if link_elem is not None:
            link_url = link_elem.attrib.get('href', '').strip()
        
        if not link_url:
            # Fallback to general release notes URL if specific link is missing
            link_url = "https://cloud.google.com/bigquery/docs/release-notes"
            
        # Extract HTML content
        content_elem = entry_elem.find('ns:content', ns)
        content_html = content_elem.text if content_elem is not None and content_elem.text else ""
        
        individual_updates = []
        if content_html:
            # Split the content by <h3>Tags</h3>.
            # Parts array will alternate: [non-h3-prefix, h3-tag-content, following-content, ...]
            parts = re.split(r'<h3>(.*?)</h3>', content_html)
            
            # If there's text before the first <h3> (rare, but possible)
            prefix = parts[0].strip()
            if prefix:
                plain_text = re.sub(r'<[^>]+>', '', prefix)
                plain_text = re.sub(r'\s+', ' ', plain_text)
                plain_text = html.unescape(plain_text).strip()
                if plain_text:
                    individual_updates.append({
                        "type": "General",
                        "html": prefix,
                        "text": plain_text
                    })
            
            # Process pairs of (h3-tag, content)
            for i in range(1, len(parts), 2):
                update_type = parts[i].strip()
                update_content = parts[i+1] if i+1 < len(parts) else ""
                
                # Extract clean plain text for Tweeting
                plain_text = re.sub(r'<[^>]+>', '', update_content)
                plain_text = re.sub(r'\s+', ' ', plain_text)
                plain_text = html.unescape(plain_text).strip()
                
                if plain_text:
                    individual_updates.append({
                        "type": update_type,
                        "html": update_content.strip(),
                        "text": plain_text
                    })
        
        if not individual_updates:
            individual_updates.append({
                "type": "General",
                "html": "<p>No release details provided for this date.</p>",
                "text": "No release details provided for this date."
            })
            
        entries.append({
            "date": date_str,
            "updated": updated_str,
            "link": link_url,
            "updates": individual_updates
        })
        
    return entries

@app.route('/')
def home():
    return render_template('index.html')

cached_data = None
cache_last_updated = 0
CACHE_TIMEOUT = 900  # 15 minutes (in seconds)

@app.route('/api/updates')
def get_updates():
    global cached_data, cache_last_updated
    bypass_cache = request.args.get('refresh', 'false').lower() == 'true'
    now = time.time()
    
    if not bypass_cache and cached_data is not None and (now - cache_last_updated) < CACHE_TIMEOUT:
        return jsonify({
            "status": "success",
            "count": len(cached_data),
            "data": cached_data,
            "cached": True,
            "cache_age_seconds": int(now - cache_last_updated)
        })
        
    try:
        data = fetch_release_notes()
        cached_data = data
        cache_last_updated = now
        return jsonify({
            "status": "success",
            "count": len(data),
            "data": data,
            "cached": False
        })
    except Exception as e:
        # Fallback to cache if network fails but cache exists
        if cached_data is not None:
            return jsonify({
                "status": "success",
                "count": len(cached_data),
                "data": cached_data,
                "cached": True,
                "fallback": True,
                "message": f"Failed to refresh feed, showing cached data. Error: {str(e)}"
            })
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
