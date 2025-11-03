import React, { useState, useEffect } from 'react';
import { fetchMarketNews } from '../services/newsService';

const NewsPanel = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('global');

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 300000);
    return () => clearInterval(interval);
  }, [selectedCategory]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const newsData = await fetchMarketNews(selectedCategory);
      setNews(newsData);
      setError(null);
    } catch (err) {
      setError('Failed to load news');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'global', label: '🌐 Global' },
    { id: 'india', label: '🇮🇳 India' },
    { id: 'forex', label: '💱 Forex' },
    { id: 'crypto', label: '₿ Crypto' },
    { id: 'merger', label: '🤝 M&A' }
  ];

  const getTimeAgo = (datetime) => {
    const now = new Date();
    const newsDate = new Date(datetime * 1000);
    const diffMs = now - newsDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="news-panel">
      <div className="news-header">
        <h3>📈 Live Market News</h3>
        <button className="refresh-btn" onClick={loadNews} disabled={loading}>
          🔄 {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="news-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="news-feed">
        {loading && news.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading market news...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button onClick={loadNews}>Retry</button>
          </div>
        ) : (
          <div className="news-list">
            {news.map((item, index) => (
              <div key={index} className="news-item">
                <div className="news-item-header">
                  <span className="news-source">{item.source}</span>
                  <span className="news-time">{getTimeAgo(item.datetime)}</span>
                </div>
                <h4 className="news-headline">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.headline}
                  </a>
                </h4>
                <p className="news-summary">{item.summary}</p>
                {item.related && (
                  <div className="news-tickers">
                    {item.related.split(',').slice(0, 3).map((ticker, i) => (
                      <span key={i} className="ticker-tag">{ticker}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPanel;
