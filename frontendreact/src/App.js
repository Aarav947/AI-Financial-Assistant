import React, { useState, useEffect } from 'react';
import './App.css';
import { fetchMarketData } from './services/marketDataService';
import { fetchMarketNews } from './services/newsService';
import { fetchChartData, fetchCommodityData, formatChartLabel } from './services/chartDataService'; // ← Added formatChartLabel

function App() {
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: "Hello! 👋 I'm your Banking & Payments Assistant. I can help you with password resets, account statements, card blocking, and UPI issues. What do you need help with today?" 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [marketData, setMarketData] = useState({
    indices: [],
    trending: [],
    gainers: [],
    losers: [],
    currencies: {}
  });
  const [news, setNews] = useState([]);
  const [activeNewsTab, setActiveNewsTab] = useState('global');
  const [hoveredBar, setHoveredBar] = useState(null);
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  const [chartCategory, setChartCategory] = useState('stocks');
  const [chartPeriod, setChartPeriod] = useState('1M');
  const [chartLoading, setChartLoading] = useState(false);
  const [chartDataCache, setChartDataCache] = useState({});
  const [stockAssets, setStockAssets] = useState([]);
  const [commodityAssets, setCommodityAssets] = useState([
    { 
      symbol: 'GOLD', 
      name: 'Gold', 
      price: 2045.30, 
      change: 0.5, 
      data: [80, 82, 85, 88, 90, 92, 95, 93, 90, 88, 85, 82, 80, 78, 75, 78, 82, 85, 88, 92, 95, 98, 100, 98, 95],
      rawPrices: [2000, 2010, 2020, 2030, 2040, 2045, 2050, 2048, 2042, 2038, 2032, 2025, 2020, 2015, 2010, 2015, 2025, 2032, 2038, 2042, 2045, 2048, 2050, 2048, 2045],
      timestamps: [] // Will be populated
    },
    { 
      symbol: 'SILVER', 
      name: 'Silver', 
      price: 24.15, 
      change: -0.3, 
      data: [60, 62, 65, 68, 70, 68, 65, 62, 58, 55, 52, 50, 48, 45, 48, 52, 55, 58, 62, 65, 68, 70, 72, 75, 73],
      rawPrices: [22, 22.5, 23, 23.5, 24, 23.8, 23.5, 23, 22.5, 22, 21.5, 21, 20.5, 20, 20.5, 21.5, 22, 22.5, 23, 23.5, 24, 24.2, 24.3, 24.4, 24.15],
      timestamps: []
    },
    { 
      symbol: 'OIL', 
      name: 'Crude Oil', 
      price: 85.40, 
      change: 1.8, 
      data: [70, 72, 75, 78, 80, 82, 85, 88, 90, 88, 85, 82, 78, 75, 72, 70, 68, 70, 75, 78, 82, 85, 88, 90, 92],
      rawPrices: [80, 81, 82, 83, 84, 85, 86, 87, 88, 87, 86, 85, 84, 83, 82, 81, 80, 81, 83, 84, 85, 86, 87, 88, 85.4],
      timestamps: []
    }
  ]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadNews(activeNewsTab);
  }, [activeNewsTab]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Save dark mode preference when it changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    const currentCategory = chartCategory === 'stocks' ? stockAssets : commodityAssets;
    const currentAsset = currentCategory[currentChartIndex];
    
    if (currentAsset && currentAsset.symbol) {
      loadChartData(currentAsset.symbol, chartCategory, chartPeriod).then(result => {
        if (chartCategory === 'stocks') {
          setStockAssets(prev => {
            const updated = [...prev];
            if (updated[currentChartIndex]) {
              updated[currentChartIndex] = { 
                ...updated[currentChartIndex], 
                data: result.data,
                rawPrices: result.rawPrices,
                timestamps: result.timestamps || [] // ← Added timestamps
              };
            }
            return updated;
          });
        } else {
          setCommodityAssets(prev => {
            const updated = [...prev];
            if (updated[currentChartIndex]) {
              updated[currentChartIndex] = { 
                ...updated[currentChartIndex], 
                data: result.data,
                rawPrices: result.rawPrices,
                timestamps: result.timestamps || [] // ← Added timestamps
              };
            }
            return updated;
          });
        }
      });
    }
  }, [currentChartIndex, chartCategory, chartPeriod, stockAssets.length]);

  const loadData = async () => {
    try {
      const data = await fetchMarketData();
      setMarketData(data);
      
      if (data.trending.length > 0) {
        const stocks = data.trending.slice(0, 4).map(stock => ({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          price: stock.price,
          change: stock.changePercent,
          data: Array.from({ length: 25 }, () => Math.random() * 60 + 40),
          rawPrices: Array.from({ length: 25 }, (_, i) => stock.price * (0.95 + Math.random() * 0.1)),
          timestamps: [] // Will be populated when chart loads
        }));
        setStockAssets(stocks);
      }
    } catch (error) {
      console.error('Error loading market data:', error);
    }
  };

  const loadNews = async (category) => {
    try {
      const newsData = await fetchMarketNews(category);
      setNews(newsData);
    } catch (error) {
      console.error('Error loading news:', error);
    }
  };
  
  const loadChartData = async (symbol, category, period) => {
    const cacheKey = `${symbol}-${period}`;
    
    if (chartDataCache[cacheKey]) {
      return chartDataCache[cacheKey];
    }

    setChartLoading(true);
    try {
      let result;
      if (category === 'stocks') {
        result = await fetchChartData(symbol, period);
      } else {
        result = await fetchCommodityData(symbol, period);
      }
      
      setChartDataCache(prev => ({ ...prev, [cacheKey]: result }));
      setChartLoading(false);
      return result;
    } catch (error) {
      console.error('Error loading chart:', error);
      setChartLoading(false);
      const fallback = Array.from({ length: 25 }, () => Math.random() * 60 + 40);
      return { 
        data: fallback, 
        rawPrices: fallback.map((v, i) => 100 + i * 2),
        timestamps: Array.from({ length: 25 }, (_, i) => Math.floor(Date.now() / 1000) - (24 - i) * 3600)
      };
    }
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval}${unit[0]} ago`;
      }
    }
    return 'Just now';
  };

  // Rich message renderer for bot responses
  const renderBotMessage = (message) => {
    if (message.text) {
      return <div>{message.text}</div>;
    }

    if (message.data && message.data.response) {
      const response = message.data.response;
      
      return (
        <div>
          {response.message && (
            <div style={{ marginBottom: '12px', whiteSpace: 'pre-line' }}>
              {response.message}
            </div>
          )}
          
          {response.workflows && response.workflows.map((workflow, idx) => (
            <div key={idx} style={{ 
              marginTop: '12px', 
              padding: '12px', 
              background: 'rgba(0,0,0,0.04)', 
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.08)'
            }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>
                {workflow.name}
              </strong>
              {workflow.steps && (
                <ol style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '20px' }}>
                  {workflow.steps.map((step, stepIdx) => (
                    <li key={stepIdx} style={{ marginBottom: '6px', fontSize: '0.95em' }}>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
              {workflow.link && (
                <a 
                  href={workflow.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    color: '#21808D', 
                    marginTop: '8px', 
                    display: 'inline-block',
                    textDecoration: 'underline',
                    fontSize: '0.9em'
                  }}
                >
                  Visit Website →
                </a>
              )}
            </div>
          ))}
          
          {response.options && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {response.options.map((option, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setInputMessage(option.value)}
                  style={{
                    padding: '8px 16px',
                    background: '#F5A962',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: '500'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {response.available_banks && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {response.available_banks.map((bank, idx) => (
                <button 
                  key={idx} 
                  onClick={() => {
                    setInputMessage(bank);
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#F5A962',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: '500'
                  }}
                >
                  {bank}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <div>No response data</div>;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setMessages([...messages, { type: 'user', text: userMessage }]);
    setInputMessage('');

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          session_id: 'user123',
          user_input: userMessage 
        })
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        data: data
      }]);
    } catch (error) {
      console.error('Backend connection error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: "Sorry, I'm having trouble connecting to the backend."
      }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const nextChart = () => {
    const maxIndex = chartCategory === 'stocks' ? stockAssets.length : commodityAssets.length;
    setCurrentChartIndex((prev) => (prev + 1) % maxIndex);
  };

  const prevChart = () => {
    const maxIndex = chartCategory === 'stocks' ? stockAssets.length : commodityAssets.length;
    setCurrentChartIndex((prev) => (prev - 1 + maxIndex) % maxIndex);
  };

  const currentCategory = chartCategory === 'stocks' ? stockAssets : commodityAssets;
  const currentAsset = currentCategory[currentChartIndex] || currentCategory[0];

  const chartHigh = currentAsset?.rawPrices ? Math.max(...currentAsset.rawPrices) : (currentAsset?.price ? currentAsset.price * 1.05 : 0);
  const chartLow = currentAsset?.rawPrices ? Math.min(...currentAsset.rawPrices) : (currentAsset?.price ? currentAsset.price * 0.95 : 0);
  const chartAvg = currentAsset?.rawPrices 
    ? (currentAsset.rawPrices.reduce((a, b) => a + b, 0) / currentAsset.rawPrices.length)
    : (currentAsset?.price || 0);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <span className="app-logo">🏦</span>
          AI Financial Advisor
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="dark-mode-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <div className="user-profile">U</div>
        </div>
      </header>

      <div className="main-content">
        <div className="left-column">
          <div className="card advisor-card">
            <div className="card-header">
              <h2 className="card-title">💬 AI Banking Assistant</h2>
            </div>
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.type}`}>
                  {msg.type === 'bot' ? renderBotMessage(msg) : msg.text}
                </div>
              ))}
            </div>
            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                placeholder="Type your question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="send-button" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📊 Quick Stats</h3>
            </div>
            <div className="quick-stats">
              <div className="stat-item">
                <div className="stat-label">S&P 500</div>
                <div className="stat-value">
                  {marketData.indices[0]?.price.toFixed(0) || '682'}
                </div>
                <div className={`stat-change ${marketData.indices[0]?.changePercent >= 0 ? 'positive' : 'negative'}`}>
                  {marketData.indices[0]?.changePercent >= 0 ? '▲' : '▼'} {Math.abs(marketData.indices[0]?.changePercent || 0.33).toFixed(2)}%
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">NIFTY 50</div>
                <div className="stat-value">
                  {marketData.indices[3]?.price ? (marketData.indices[3].price / 1000).toFixed(1) + 'k' : '25.7k'}
                </div>
                <div className={`stat-change ${marketData.indices[3]?.changePercent >= 0 ? 'positive' : 'negative'}`}>
                  {marketData.indices[3]?.changePercent >= 0 ? '▲' : '▼'} {Math.abs(marketData.indices[3]?.changePercent || 0.6).toFixed(2)}%
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">USD/INR</div>
                <div className="stat-value">
                  ₹{marketData.currencies?.usdInr?.rate || '83.15'}
                </div>
                <div className={`stat-change ${marketData.currencies?.usdInr?.change >= 0 ? 'positive' : 'negative'}`}>
                  {marketData.currencies?.usdInr?.change >= 0 ? '▲' : '▼'} {Math.abs(marketData.currencies?.usdInr?.change || 0.2).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="middle-column">
          <div className="card news-section">
            <div className="card-header">
              <h2 className="card-title">📰 Live Market News</h2>
            </div>
            <div className="news-tabs">
              {['global', 'india', 'forex', 'crypto', 'merger'].map(tab => (
                <button
                  key={tab}
                  className={`news-tab ${activeNewsTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveNewsTab(tab)}
                >
                  {tab === 'global' && '🌐 Global'}
                  {tab === 'india' && '🇮🇳 India'}
                  {tab === 'forex' && '💱 Forex'}
                  {tab === 'crypto' && '₿ Crypto'}
                  {tab === 'merger' && '🤝 M&A'}
                </button>
              ))}
            </div>
            <div className="news-list">
              {news.map((item, index) => (
                <div key={index} className="news-item" onClick={() => window.open(item.url, '_blank')}>
                  <div className="news-source">{item.source} • {getTimeAgo(item.datetime)}</div>
                  <div className="news-headline">{item.headline}</div>
                  <div className="news-summary">{item.summary}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card portfolio-section">
            <div className="card-header">
              <h3 className="card-title">💼 My Portfolio</h3>
            </div>
            <div className="portfolio-empty">
              <div className="empty-icon">📊</div>
              <p className="empty-text">No holdings yet</p>
              <button className="add-portfolio-btn">
                <span className="plus-icon">+</span> Add Stock
              </button>
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="market-header">
            <h2 className="section-title">📈 Market</h2>
          </div>

          <div className="market-top-row">
            <div className="card trending-section">
              <div className="card-header">
                <h3 className="card-title">🔥 Trending</h3>
              </div>
              <div className="stock-list scrollable">
                {marketData.trending.slice(0, 5).map((stock, index) => (
                  <div key={index} className="stock-item">
                    <div className="stock-info">
                      <span className="stock-rank">#{index + 1}</span>
                      <span className="stock-symbol">{stock.symbol}</span>
                    </div>
                    <div className="stock-price">
                      <span className="stock-value">${stock.price.toFixed(2)}</span>
                      <span className={`stock-change ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                        {stock.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card decliners-section">
              <div className="card-header">
                <h3 className="card-title">📉 Decliners</h3>
              </div>
              <div className="stock-list scrollable">
                {marketData.losers.slice(0, 5).map((stock, index) => (
                  <div key={index} className="stock-item">
                    <div className="stock-info">
                      <span className="stock-symbol">{stock.symbol}</span>
                    </div>
                    <div className="stock-price">
                      <span className="stock-value">${stock.price.toFixed(0)}</span>
                      <span className="stock-change negative">
                        ▼ {Math.abs(stock.changePercent).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card chart-carousel">
            <div className="card-header">
              <h3 className="card-title">📊 Price Charts</h3>
            </div>
            <div className="chart-body">
              <div className="chart-info">
                <div>
                  <div className="chart-symbol">{currentAsset?.symbol || ''}</div>
                  <div className="chart-name">{currentAsset?.name || ''}</div>
                </div>
                <div className="chart-price-box">
                  <div className="chart-price">${currentAsset?.price.toFixed(2) || '0.00'}</div>
                  <div className={`chart-change ${currentAsset?.change >= 0 ? 'positive' : 'negative'}`}>
                    {currentAsset?.change >= 0 ? '▲' : '▼'} {Math.abs(currentAsset?.change || 0).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="time-periods">
                {['1D', '1W', '1M', '3M', '1Y'].map(period => (
                  <button
                    key={period}
                    className={`period-btn ${chartPeriod === period ? 'active' : ''}`}
                    onClick={() => setChartPeriod(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
              
<div className="chart-canvas">
  {chartLoading ? (
    <div className="chart-loading">Loading...</div>
  ) : (
    <>
      <div className="chart-reference-line"></div>
{currentAsset?.data?.map((value, i) => {
  const isPositive = currentAsset.change >= 0;
  const price = currentAsset.rawPrices?.[i];
  const timestamp = currentAsset.timestamps?.[i];
  
  return (
    <div
      key={i}
      className={`chart-bar ${isPositive ? 'chart-bar-positive' : 'chart-bar-negative'}`}
      style={{ height: `${value}%` }}
      onMouseEnter={() => setHoveredBar(i)}
      onMouseLeave={() => setHoveredBar(null)}
    >
{hoveredBar === i && price && (
  <div 
    className="chart-tooltip"
    style={{
      bottom: value > 80 ? 'auto' : 'calc(105% + 15px)',
      top: value > 80 ? 'calc(105% + 10px)' : 'auto'
    }}
  >
    <strong>${price.toFixed(2)}</strong>
    {timestamp && <> • {formatChartLabel(timestamp, chartPeriod)}</>}
  </div>
)}
    </div>
  );
})}


    </>
  )}
</div>


              {/* 👇 NEW: Timestamp Labels 👇 */}
{currentAsset?.timestamps && currentAsset.timestamps.length > 0 && (
  <div className="chart-labels">
    {(() => {
      const timestamps = currentAsset.timestamps;
      const totalBars = currentAsset.data.length;
      const labelsToShow = [];
      
      // Calculate indices for 5-6 evenly spaced labels
      const step = Math.floor(totalBars / 5);
      
      for (let i = 0; i < totalBars; i += step) {
        labelsToShow.push(i);
      }
      
      // ALWAYS include the last index (this shows Nov 2!)
      const lastIndex = totalBars - 1;
      if (!labelsToShow.includes(lastIndex)) {
        labelsToShow.push(lastIndex);
      }
      
      return labelsToShow.map(index => (
        <span 
          key={index}
          className="chart-label"
          style={{ left: `${(index / (totalBars - 1)) * 100}%` }}
        >
          {formatChartLabel(timestamps[index], chartPeriod)}
        </span>
      ));
    })()}
  </div>
)}


              {currentAsset?.data && (
                <div className="chart-summary">
                  <div className="chart-summary-item">
                    <span className="chart-summary-label">High</span>
                    <span className="chart-summary-value">
                      ${chartHigh.toFixed(2)}
                    </span>
                  </div>
                  <div className="chart-summary-item">
                    <span className="chart-summary-label">Low</span>
                    <span className="chart-summary-value">
                      ${chartLow.toFixed(2)}
                    </span>
                  </div>
                  <div className="chart-summary-item">
                    <span className="chart-summary-label">Avg</span>
                    <span className="chart-summary-value">
                      ${chartAvg.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="chart-controls">
                <button className="chart-nav" onClick={prevChart}>←</button>
                <div className="chart-indicator">
                  {currentCategory.map((_, index) => (
                    <div
                      key={index}
                      className={`indicator-dot ${index === currentChartIndex ? 'active' : ''}`}
                      onClick={() => setCurrentChartIndex(index)}
                    />
                  ))}
                </div>
                <button className="chart-nav" onClick={nextChart}>→</button>
              </div>

              <div className="chart-categories">
                <button 
                  className={`category-btn ${chartCategory === 'stocks' ? 'active' : ''}`}
                  onClick={() => { setChartCategory('stocks'); setCurrentChartIndex(0); }}
                >
                  📈 Stocks
                </button>
                <button 
                  className={`category-btn ${chartCategory === 'commodities' ? 'active' : ''}`}
                  onClick={() => { setChartCategory('commodities'); setCurrentChartIndex(0); }}
                >
                  🪙 Commodities
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
