"""
Content Extractor Utility
Extracts and organizes content from HTML and JavaScript files
Keep Her Light Alive Foundation - Content Analysis System
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Tuple
from bs4 import BeautifulSoup


class ContentExtractor:
    """Extracts content from website files for analysis"""
    
    def __init__(self, html_path: str, translations_path: str):
        self.html_path = Path(html_path)
        self.translations_path = Path(translations_path)
        self.content = {
            'en': {},
            'es': {}
        }
    
    def extract_all(self) -> Dict[str, Dict[str, List[str]]]:
        """Extract all content from HTML and translations"""
        print("🔍 Extracting content from website files...")
        
        # Extract from translations.js (primary source)
        self._extract_translations()
        
        # Extract from HTML (for content not in translations)
        self._extract_html_content()
        
        print(f"✅ Extracted content from {len(self.content['en'])} sections")
        return self.content
    
    def _extract_translations(self):
        """Extract content from translations.js file"""
        with open(self.translations_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse the JS object structure more robustly
        # First, find the 'en' and 'es' blocks
        en_block_match = re.search(r'en\s*:\s*\{', content)
        es_block_match = re.search(r'es\s*:\s*\{', content)
        
        if not (en_block_match and es_block_match):
            print("⚠️ Could not locate language blocks in translations.js")
            return

        en_start = en_block_match.end()
        es_start = es_block_match.end()
        
        # Simple brace counting parser to extract the full block content
        def extract_block_content(start_index, text):
            count = 1
            for i, char in enumerate(text[start_index:], start=start_index):
                if char == '{':
                    count += 1
                elif char == '}':
                    count -= 1
                    if count == 0:
                        return text[start_index:i]
            return ""

        en_content = extract_block_content(en_start, content)
        es_content = extract_block_content(es_start, content)
        
        self._parse_language_block(en_content, 'en')
        self._parse_language_block(es_content, 'es')
            
    def _parse_language_block(self, block_content: str, lang: str):
        """Parse key-values from a language block"""
        # Regex to match 'key': 'value' patterns
        # Handles escaped quotes in values
        pattern = r"['\"]([\w\.]+)['\"]\s*:\s*['\"]((?:[^'\"]|\\['\"])*)['\"]"
        matches = re.findall(pattern, block_content)
        
        for key, value in matches:
            # Unescape quotes
            clean_value = value.replace("\\'", "'").replace('\\"', '"')
            
            # Determine section
            section = key.split('.')[0] if '.' in key else 'general'
            
            if section not in self.content[lang]:
                self.content[lang][section] = []
            
            self.content[lang][section].append(clean_value)

    def _extract_html_content(self):
        """Extract content directly from HTML for non-translated content"""
        with open(self.html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
        
        # Extract meta descriptions
        meta_desc = soup.find('meta', {'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            if 'meta' not in self.content['en']:
                self.content['en']['meta'] = []
            self.content['en']['meta'].append(meta_desc['content'])
        
        # Extract any text content not covered by translations
        sections = soup.find_all(['section', 'header', 'footer'])
        for section in sections:
            section_id = section.get('id', 'unknown')
            # Only extract if NOT likely covered by translation keys (heuristic)
            # Just getting text can be duplicate if the text is populated by JS
            # But the static HTML often contains the text too.
            
            if section_id not in self.content['en']:
                text_content = section.get_text(strip=True, separator=' ')
                if text_content and len(text_content) > 20:
                    if section_id not in self.content['en']:
                        self.content['en'][section_id] = []
                    
                    # Better sentence splitting that PRESERVES punctuation
                    # Split by .!? but keep the delimiter
                    parts = re.split(r'([.!?]+)', text_content)
                    # Re-assemble
                    sentences = []
                    current = ""
                    for part in parts:
                        if re.match(r'[.!?]+', part):
                            current += part
                            sentences.append(current.strip())
                            current = ""
                        else:
                            current += part
                    if current.strip():
                        sentences.append(current.strip())
                        
                    self.content['en'][section_id].extend([s for s in sentences if s])
    
    def get_section_content(self, section: str, language: str = 'en') -> List[str]:
        """Get content for a specific section and language"""
        return self.content.get(language, {}).get(section, [])
    
    def get_all_text(self, language: str = 'en') -> str:
        """Get all content as a single text block"""
        all_text = []
        for section, texts in self.content.get(language, {}).items():
            all_text.extend(texts)
        return ' '.join(all_text)
    
    def get_statistics(self) -> Dict:
        """Get content statistics"""
        stats = {}
        for lang in ['en', 'es']:
            total_sections = len(self.content[lang])
            total_items = sum(len(items) for items in self.content[lang].values())
            total_words = sum(len(text.split()) for items in self.content[lang].values() for text in items)
            
            stats[lang] = {
                'sections': total_sections,
                'items': total_items,
                'words': total_words
            }
        
        return stats


if __name__ == "__main__":
    # Test the extractor
    extractor = ContentExtractor(
        html_path="website/index.html",
        translations_path="website/translations.js"
    )
    
    content = extractor.extract_all()
    stats = extractor.get_statistics()
    
    print("\n📊 Content Statistics:")
    for lang, data in stats.items():
        print(f"\n{lang.upper()}:")
        print(f"  Sections: {data['sections']}")
        print(f"  Items: {data['items']}")
        print(f"  Words: {data['words']}")
    
    print("\n✅ Content extraction test complete!")
