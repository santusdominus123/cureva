"""
🔍 VLM WITH REFERENCES - PERPLEXITY-STYLE
==========================================
Vision-Language Model dengan kemampuan mencari referensi,
artikel, dan gambar serupa seperti Perplexity AI.

Author: CureVa Team
Version: 3.0
Features:
- Google Search integration untuk artikel
- Reverse image search untuk gambar serupa
- Web scraping untuk konten artikel
- Citations dan references
- Validasi sumber
"""

# Suppress warnings
import os
import warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['GRPC_VERBOSITY'] = 'ERROR'
os.environ['GLOG_minloglevel'] = '2'
warnings.filterwarnings('ignore')

import google.generativeai as genai
from PIL import Image
import json
import time
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Tuple
from datetime import datetime
from pathlib import Path
import re
from urllib.parse import quote_plus, urlparse

# ============================================================================
# 🔧 KONFIGURASI
# ============================================================================

GEMINI_API_KEY = "AIzaSyBO8v7wSaDK7kGq70uzRunqq7ZhtlDyAWk"
GOOGLE_SEARCH_API_KEY = "AIzaSyBO8v7wSaDK7kGq70uzRunqq7ZhtlDyAWk"  # Bisa pakai yang sama atau beda
GOOGLE_CSE_ID = "YOUR_CUSTOM_SEARCH_ENGINE_ID"  # Perlu dibuat di Google Custom Search

MODEL_NAME = "gemini-2.0-flash-exp"
OUTPUT_FOLDER = "./vlm_with_refs_results"

EMOJI = {
    'search': '🔍',
    'link': '🔗',
    'image': '🖼️',
    'news': '📰',
    'check': '✅',
    'cross': '❌',
    'info': 'ℹ️',
    'warning': '⚠️',
    'rocket': '🚀',
    'brain': '🧠',
    'doc': '📄',
    'star': '⭐'
}

# ============================================================================
# 🔍 SEARCH & REFERENCE ENGINE
# ============================================================================

class ReferenceSearchEngine:
    """Engine untuk mencari referensi seperti Perplexity"""

    def __init__(self, api_key: str = None, cse_id: str = None):
        self.api_key = api_key or GOOGLE_SEARCH_API_KEY
        self.cse_id = cse_id or GOOGLE_CSE_ID
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def search_articles(self, query: str, num_results: int = 5) -> List[Dict]:
        """
        Mencari artikel relevan menggunakan Google Custom Search API
        """
        print(f"\n{EMOJI['search']} Mencari artikel tentang: {query}")

        try:
            # Google Custom Search API endpoint
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                'key': self.api_key,
                'cx': self.cse_id,
                'q': query,
                'num': num_results,
                'dateRestrict': 'y1',  # Articles from last year
                'sort': 'date'  # Sort by date
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            articles = []

            if 'items' in data:
                for item in data['items']:
                    article = {
                        'title': item.get('title', ''),
                        'url': item.get('link', ''),
                        'snippet': item.get('snippet', ''),
                        'source': urlparse(item.get('link', '')).netloc,
                        'date': item.get('pagemap', {}).get('metatags', [{}])[0].get('article:published_time', 'N/A')
                    }

                    # Try to extract article content
                    article['content'] = self._extract_article_content(article['url'])

                    articles.append(article)
                    print(f"  {EMOJI['check']} {article['title'][:60]}... - {article['source']}")

            return articles

        except Exception as e:
            print(f"  {EMOJI['warning']} Error searching articles: {str(e)}")
            # Fallback: DuckDuckGo search (no API key needed)
            return self._fallback_search(query, num_results)

    def _fallback_search(self, query: str, num_results: int = 5) -> List[Dict]:
        """
        Fallback search menggunakan DuckDuckGo (tidak perlu API key)
        """
        print(f"  {EMOJI['info']} Using fallback search (DuckDuckGo)...")

        try:
            # DuckDuckGo HTML search
            url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
            response = self.session.get(url, timeout=10)

            soup = BeautifulSoup(response.text, 'html.parser')
            results = soup.find_all('div', class_='result', limit=num_results)

            articles = []
            for result in results:
                link = result.find('a', class_='result__a')
                snippet = result.find('a', class_='result__snippet')

                if link:
                    article = {
                        'title': link.get_text(strip=True),
                        'url': link.get('href', ''),
                        'snippet': snippet.get_text(strip=True) if snippet else '',
                        'source': urlparse(link.get('href', '')).netloc,
                        'date': 'N/A'
                    }
                    articles.append(article)
                    print(f"  {EMOJI['check']} {article['title'][:60]}...")

            return articles

        except Exception as e:
            print(f"  {EMOJI['cross']} Fallback search failed: {str(e)}")
            return []

    def _extract_article_content(self, url: str, max_length: int = 1000) -> str:
        """
        Extract konten dari artikel menggunakan web scraping
        """
        try:
            response = self.session.get(url, timeout=5)
            soup = BeautifulSoup(response.text, 'html.parser')

            # Remove script and style elements
            for script in soup(['script', 'style', 'nav', 'footer', 'header']):
                script.decompose()

            # Try common article selectors
            article_selectors = [
                'article',
                'div[class*="content"]',
                'div[class*="article"]',
                'div[class*="post"]',
                'main'
            ]

            content = ""
            for selector in article_selectors:
                elements = soup.select(selector)
                if elements:
                    content = ' '.join([elem.get_text(strip=True) for elem in elements])
                    break

            if not content:
                # Fallback: get all paragraphs
                paragraphs = soup.find_all('p')
                content = ' '.join([p.get_text(strip=True) for p in paragraphs])

            # Clean and truncate
            content = re.sub(r'\s+', ' ', content).strip()
            return content[:max_length] + '...' if len(content) > max_length else content

        except Exception as e:
            return f"[Could not extract content: {str(e)}]"

    def search_similar_images(self, query: str, num_results: int = 3) -> List[Dict]:
        """
        Mencari gambar serupa menggunakan Google Custom Search Image API
        """
        print(f"\n{EMOJI['image']} Mencari gambar serupa: {query}")

        try:
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                'key': self.api_key,
                'cx': self.cse_id,
                'q': query,
                'searchType': 'image',
                'num': num_results,
                'imgSize': 'large',
                'safe': 'active'
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            images = []

            if 'items' in data:
                for item in data['items']:
                    image = {
                        'title': item.get('title', ''),
                        'url': item.get('link', ''),
                        'thumbnail': item.get('image', {}).get('thumbnailLink', ''),
                        'source': item.get('displayLink', ''),
                        'context': item.get('snippet', '')
                    }
                    images.append(image)
                    print(f"  {EMOJI['check']} {image['title'][:50]}... - {image['source']}")

            return images

        except Exception as e:
            print(f"  {EMOJI['warning']} Error searching images: {str(e)}")
            return []

    def validate_sources(self, articles: List[Dict]) -> List[Dict]:
        """
        Validasi kredibilitas sumber
        """
        print(f"\n{EMOJI['info']} Memvalidasi kredibilitas sumber...")

        trusted_domains = [
            'wikipedia.org', 'gov', 'edu', 'bbc.com', 'reuters.com',
            'kompas.com', 'detik.com', 'tempo.co', 'antaranews.com',
            'nature.com', 'sciencedirect.com', 'scholar.google.com'
        ]

        for article in articles:
            source_domain = article['source'].lower()
            article['trusted'] = any(domain in source_domain for domain in trusted_domains)
            article['credibility'] = 'HIGH' if article['trusted'] else 'MEDIUM'

        return articles

# ============================================================================
# 🧠 VLM WITH REFERENCES
# ============================================================================

class VLMWithReferences:
    """VLM dengan kemampuan mencari referensi dan citations"""

    def __init__(self, api_key: str, search_engine: ReferenceSearchEngine):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(MODEL_NAME)
        self.search_engine = search_engine
        self.output_folder = Path(OUTPUT_FOLDER)
        self.output_folder.mkdir(exist_ok=True, parents=True)

    def analyze_with_references(self, image_path: str, analysis_type: str = "comprehensive") -> Dict:
        """
        Analisis gambar dengan mencari referensi dan citations
        """
        print(f"\n{'='*80}")
        print(f"{EMOJI['rocket']} VLM ANALYSIS WITH REFERENCES")
        print(f"{'='*80}\n")

        result = {
            'image_path': image_path,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'analysis_type': analysis_type,
            'vlm_response': None,
            'search_queries': [],
            'articles': [],
            'similar_images': [],
            'final_answer': None,
            'citations': []
        }

        try:
            # Step 1: Initial VLM Analysis
            print(f"{EMOJI['brain']} Step 1: Analyzing image with VLM...")
            image = Image.open(image_path)

            initial_prompt = """Analisis gambar ini secara detail dan identifikasi:
1. Objek utama dalam gambar
2. Karakteristik dan fitur penting
3. Konteks historis atau budaya (jika ada)
4. Keywords untuk searching informasi lebih lanjut

Berikan dalam format:
OBJECT: [nama objek]
CHARACTERISTICS: [karakteristik]
CONTEXT: [konteks]
SEARCH_KEYWORDS: [keyword1, keyword2, keyword3]
"""

            response = self.model.generate_content([initial_prompt, image])
            vlm_initial = response.text
            result['vlm_response'] = vlm_initial

            print(f"{EMOJI['check']} VLM analysis complete!")
            print(f"\nVLM Response:\n{vlm_initial[:300]}...\n")

            # Step 2: Extract search keywords
            search_keywords = self._extract_keywords(vlm_initial)
            result['search_queries'] = search_keywords

            print(f"{EMOJI['search']} Step 2: Extracted search keywords: {', '.join(search_keywords)}")

            # Step 3: Search for articles and references
            all_articles = []
            for keyword in search_keywords[:2]:  # Limit to 2 main keywords
                articles = self.search_engine.search_articles(keyword, num_results=3)
                all_articles.extend(articles)

            # Validate sources
            all_articles = self.search_engine.validate_sources(all_articles)
            result['articles'] = all_articles

            # Step 4: Search for similar images
            if search_keywords:
                similar_images = self.search_engine.search_similar_images(
                    search_keywords[0], num_results=3
                )
                result['similar_images'] = similar_images

            # Step 5: Generate final answer with citations
            print(f"\n{EMOJI['brain']} Step 3: Generating final answer with citations...")
            final_answer = self._generate_answer_with_citations(
                vlm_initial, all_articles, similar_images
            )
            result['final_answer'] = final_answer
            result['citations'] = self._format_citations(all_articles)

            # Save results
            self._save_results(result)

            print(f"\n{EMOJI['check']} Analysis complete with references!")

            return result

        except Exception as e:
            print(f"\n{EMOJI['cross']} Error: {str(e)}")
            result['error'] = str(e)
            return result

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract search keywords from VLM response"""
        keywords = []

        # Look for SEARCH_KEYWORDS section
        match = re.search(r'SEARCH_KEYWORDS:\s*(.+)', text, re.IGNORECASE)
        if match:
            keyword_text = match.group(1)
            keywords = [k.strip() for k in re.split(r'[,;]', keyword_text) if k.strip()]

        # If not found, extract from OBJECT
        if not keywords:
            match = re.search(r'OBJECT:\s*(.+)', text, re.IGNORECASE)
            if match:
                keywords = [match.group(1).strip()]

        return keywords[:3]  # Limit to 3 keywords

    def _generate_answer_with_citations(self, vlm_response: str,
                                        articles: List[Dict],
                                        images: List[Dict]) -> str:
        """Generate final answer dengan citations"""

        # Prepare context from articles
        context = "\n\n".join([
            f"[{i+1}] {art['title']}\nSource: {art['source']}\nContent: {art['snippet']}"
            for i, art in enumerate(articles[:5])
        ])

        prompt = f"""Berdasarkan analisis visual dan referensi yang ditemukan, berikan jawaban komprehensif:

ANALISIS VISUAL:
{vlm_response}

REFERENSI YANG DITEMUKAN:
{context}

INSTRUKSI:
1. Gabungkan informasi dari analisis visual dengan referensi
2. Gunakan citations [1], [2], dst untuk merujuk referensi
3. Berikan informasi yang akurat dan terverifikasi
4. Jelaskan dengan bahasa yang mudah dipahami
5. Sertakan konteks historis/budaya jika relevan

FORMAT JAWABAN:
## Analisis Komprehensif
[Jawaban detail dengan citations]

## Informasi Tambahan
[Fakta menarik dari referensi]

## Tingkat Kepercayaan
[Evaluasi kredibilitas informasi]
"""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating final answer: {str(e)}"

    def _format_citations(self, articles: List[Dict]) -> List[Dict]:
        """Format citations dalam style akademik"""
        citations = []

        for i, article in enumerate(articles[:10], 1):
            citation = {
                'number': i,
                'title': article['title'],
                'url': article['url'],
                'source': article['source'],
                'date': article.get('date', 'N/A'),
                'credibility': article.get('credibility', 'MEDIUM'),
                'format': f"[{i}] {article['title']} - {article['source']} ({article.get('date', 'N/A')}) - {article['url']}"
            }
            citations.append(citation)

        return citations

    def _save_results(self, result: Dict):
        """Save results to JSON file"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = self.output_folder / f"vlm_with_refs_{timestamp}.json"

        # Remove PIL image object for JSON serialization
        result_copy = result.copy()

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(result_copy, f, indent=2, ensure_ascii=False)

        print(f"\n{EMOJI['doc']} Results saved: {filename}")

    def display_results(self, result: Dict):
        """Display results in readable format"""
        print(f"\n{'='*80}")
        print(f"📊 HASIL ANALISIS DENGAN REFERENSI")
        print(f"{'='*80}\n")

        # Final Answer
        if result.get('final_answer'):
            print(f"{EMOJI['star']} JAWABAN FINAL:\n")
            print(result['final_answer'])

        # Citations
        if result.get('citations'):
            print(f"\n\n{EMOJI['link']} REFERENSI:\n")
            for citation in result['citations']:
                credibility_icon = "🟢" if citation['credibility'] == 'HIGH' else "🟡"
                print(f"{credibility_icon} {citation['format']}")

        # Similar Images
        if result.get('similar_images'):
            print(f"\n\n{EMOJI['image']} GAMBAR SERUPA:\n")
            for i, img in enumerate(result['similar_images'], 1):
                print(f"{i}. {img['title']}")
                print(f"   URL: {img['url']}")
                print(f"   Source: {img['source']}\n")

        print(f"\n{'='*80}\n")

# ============================================================================
# 🚀 MAIN EXECUTION
# ============================================================================

def main():
    print(f"\n{EMOJI['rocket']} VLM WITH REFERENCES - PERPLEXITY STYLE")
    print(f"{'='*80}\n")

    # Initialize
    print(f"{EMOJI['info']} Initializing search engine...")
    search_engine = ReferenceSearchEngine(
        api_key=GOOGLE_SEARCH_API_KEY,
        cse_id=GOOGLE_CSE_ID
    )

    print(f"{EMOJI['info']} Initializing VLM...")
    vlm = VLMWithReferences(
        api_key=GEMINI_API_KEY,
        search_engine=search_engine
    )

    # Get image path from user
    print(f"\n{EMOJI['search']} Masukkan path gambar untuk dianalisis:")
    image_path = input("Path: ").strip().strip('"')

    if not Path(image_path).exists():
        print(f"{EMOJI['cross']} File tidak ditemukan: {image_path}")
        return

    # Analyze with references
    result = vlm.analyze_with_references(image_path)

    # Display results
    vlm.display_results(result)

    print(f"\n{EMOJI['check']} Selesai! Hasil tersimpan di folder: {OUTPUT_FOLDER}")

if __name__ == "__main__":
    main()
