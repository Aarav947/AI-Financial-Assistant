const FINNHUB_API_KEY = 'your_generated_api_key';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Marketaux for Indian AND Forex financial news
const MARKETAUX_API_KEY = 'Xv6BgpQuQI2jve0B815CaU4ecUF1rP2U6IjCsuxC';
const MARKETAUX_BASE_URL = 'https://api.marketaux.com/v1';

export const fetchMarketNews = async (category = 'global') => {
  try {
    console.log(`📰 Fetching news for category: ${category}`);
    
    // INDIA: Use Marketaux for real Indian business news
    if (category === 'india') {
      return await fetchIndianNews();
    }
    
    // FOREX: Use Marketaux for real forex news
    if (category === 'forex') {
      return await fetchForexNews();
    }
    
    // OTHER CATEGORIES: Use Finnhub
    let finnhubCategory = category === 'global' ? 'general' : category;
    if (category === 'merger') finnhubCategory = 'merger';
    
    const url = `${FINNHUB_BASE_URL}/news?category=${finnhubCategory}&token=${FINNHUB_API_KEY}`;
    console.log('Calling Finnhub:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Finnhub failed:', response.status);
      throw new Error(`Finnhub API failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✓ Received ${data.length} news items from Finnhub`);
    
    // Clean HTML from all Finnhub news
    const cleanedData = data.map(item => ({
      ...item,
      summary: cleanText(item.summary || ''),
      headline: cleanText(item.headline || '')
    }));
    
    if (cleanedData.length === 0) {
      return [{
        category: category,
        datetime: Math.floor(Date.now() / 1000),
        headline: `No ${category} news available`,
        source: 'System',
        summary: 'No news items found for this category.',
        url: '#',
        related: '',
        id: 0
      }];
    }
    
    return cleanedData.slice(0, 15);
    
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    return [{
      category: category,
      datetime: Math.floor(Date.now() / 1000),
      headline: 'Error loading news',
      source: 'System',
      summary: `Unable to fetch ${category} news. ${error.message}`,
      url: '#',
      related: '',
      id: 0
    }];
  }
};

// Fetch REAL Indian business news from Marketaux
const fetchIndianNews = async () => {
  try {
    console.log('🇮🇳 Fetching real Indian business news from Marketaux...');
    
    const url = `${MARKETAUX_BASE_URL}/news/all?countries=in&filter_entities=true&language=en&api_token=${MARKETAUX_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Marketaux error response:', errorText);
      throw new Error(`Marketaux API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.warn('No Indian news from Marketaux');
      throw new Error('No Indian business news available');
    }
    
    console.log(`✓ Got ${data.data.length} real Indian business news items`);
    
    const formattedNews = data.data
      .filter(article => article.title && article.description)
      .map((article, index) => ({
        category: 'india',
        datetime: Math.floor(new Date(article.published_at).getTime() / 1000),
        headline: cleanText(article.title),
        id: index,
        image: article.image_url || '',
        related: extractSymbols(article),
        source: article.source || 'Marketaux',
        summary: cleanText(article.description || 'No summary available'),
        url: article.url
      }));
    
    console.log(`✓ Formatted ${formattedNews.length} Indian news items`);
    
    return formattedNews.slice(0, 15);
    
  } catch (error) {
    console.error('❌ Error fetching Indian news:', error);
    
    return [{
      category: 'india',
      datetime: Math.floor(Date.now() / 1000),
      headline: 'Unable to load Indian financial news',
      source: 'System',
      summary: `Error: ${error.message}. Check browser console (F12) for details.`,
      url: 'https://marketaux.com',
      related: '',
      id: 0
    }];
  }
};

// NEW: Fetch REAL Forex news from Marketaux
const fetchForexNews = async () => {
  try {
    console.log('💱 Fetching real forex news from Marketaux...');
    
    // Marketaux supports searching with keywords
    const url = `${MARKETAUX_BASE_URL}/news/all?search=forex OR currency OR dollar OR euro OR pound OR yen OR "exchange rate" OR "central bank" OR fed OR ecb&filter_entities=true&language=en&api_token=${MARKETAUX_API_KEY}`;
    
    console.log('API URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Marketaux error response:', errorText);
      throw new Error(`Marketaux API failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Marketaux forex response:', data);
    
    if (!data.data || data.data.length === 0) {
      console.warn('No forex news from Marketaux');
      throw new Error('No forex news available');
    }
    
    console.log(`✓ Got ${data.data.length} real forex news items`);
    
    const formattedNews = data.data
      .filter(article => article.title && article.description)
      .map((article, index) => ({
        category: 'forex',
        datetime: Math.floor(new Date(article.published_at).getTime() / 1000),
        headline: cleanText(article.title),
        id: index,
        image: article.image_url || '',
        related: extractSymbols(article),
        source: article.source || 'Marketaux',
        summary: cleanText(article.description || 'No summary available'),
        url: article.url
      }));
    
    console.log(`✓ Formatted ${formattedNews.length} forex news items`);
    
    return formattedNews.slice(0, 15);
    
  } catch (error) {
    console.error('❌ Error fetching forex news:', error);
    
    return [{
      category: 'forex',
      datetime: Math.floor(Date.now() / 1000),
      headline: 'Unable to load forex news',
      source: 'System',
      summary: `Error: ${error.message}. Check browser console (F12) for details.`,
      url: 'https://marketaux.com',
      related: '',
      id: 0
    }];
  }
};

// Helper function to clean HTML and truncate text
const cleanText = (text) => {
  if (!text) return '';
  
  try {
    let cleaned = text.replace(/<[^>]*>/g, '');
    
    cleaned = cleaned
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 197) + '...';
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error cleaning text:', error);
    return text.substring(0, 200);
  }
};

// Helper to extract stock symbols from Marketaux entities
const extractSymbols = (article) => {
  if (!article.entities || article.entities.length === 0) {
    return '';
  }
  
  const symbols = article.entities
    .filter(entity => entity.symbol)
    .slice(0, 3)
    .map(entity => entity.symbol)
    .join(',');
  
  return symbols;
};

