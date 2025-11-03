import React, { useState, useEffect } from 'react';
import { fetchMarketData } from '../services/marketDataService';

const AnalyticsDashboard = () => {
  const [marketData, setMarketData] = useState({
    indices: [],
    trending: [],
    gainers: [],
    losers: [],
    currencies: {}
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadMarketData = async () => {
    try {
      const data = await fetchMarketData();
      setMarketData(data);
    } catch (err) {
      console.error('Failed to load market data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatChange = (change, changePercent) => {
    const isPositive = change >= 0;
    return (
      <span className={`change ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
      </span>
    );
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'trending', label: '🔥 Trending' },
    { id: 'movers', label: '📈 Top Movers' }
  ];

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h3>📊 Market Analytics</h3>
        <div className="live-indicator">
          <span className="pulse-dot"></span> Live
        </div>
      </div>

      <div className="dashboard-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading analytics...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="overview-grid">
                <div className="metric-card">
                  <div className="metric-label">Market Cap (Total)</div>
                  <div className="metric-value">$45.2T</div>
                  <div className="metric-change positive">▲ 2.3%</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">24h Volume</div>
                  <div className="metric-value">$234B</div>
                  <div className="metric-change negative">▼ 1.2%</div>
                </div>

                <div className="indices-section">
                  <h4>Major Indices</h4>
                  <div className="indices-list">
                    {marketData.indices.map((index, i) => (
                      <div key={i} className="index-item">
                        <div className="index-info">
                          <span className="index-name">{index.name}</span>
                          <span className="index-price">
                            {index.currency}{index.price.toLocaleString()}
                          </span>
                        </div>
                        {formatChange(index.change, index.changePercent)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="currency-section">
                  <h4>💱 Currency Rates</h4>
                  <div className="currency-list">
                    {marketData.currencies && Object.values(marketData.currencies).map((curr, i) => (
                      <div key={i} className="currency-item">
                        <span className="currency-pair">{curr.pair}</span>
                        <div className="currency-info">
                          <span className="currency-rate">{curr.symbol}{curr.rate}</span>
                          <span className={`currency-change ${curr.change >= 0 ? 'positive' : 'negative'}`}>
                            {curr.change >= 0 ? '▲' : '▼'} {Math.abs(curr.change)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trending' && (
              <div className="trending-stocks">
                <h4>🔥 Trending Now</h4>
                <div className="stock-list">
                  {marketData.trending.map((stock, i) => (
                    <div key={i} className="stock-item">
                      <div className="stock-rank">#{i + 1}</div>
                      <div className="stock-info">
                        <div className="stock-symbol">{stock.symbol}</div>
                        <div className="stock-name">{stock.name}</div>
                      </div>
                      <div className="stock-price">
                        <div className="price">{stock.currency}{stock.price}</div>
                        {formatChange(stock.change, stock.changePercent)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'movers' && (
              <div className="movers-section">
                <div className="movers-column">
                  <h4 className="gainers-title">📈 Top Gainers</h4>
                  <div className="stock-list">
                    {marketData.gainers.map((stock, i) => (
                      <div key={i} className="stock-item">
                        <div className="stock-info">
                          <div className="stock-symbol">{stock.symbol}</div>
                          <div className="stock-name">{stock.name}</div>
                        </div>
                        <div className="stock-price">
                          <div className="price">{stock.currency}{stock.price}</div>
                          {formatChange(stock.change, stock.changePercent)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="movers-column">
                  <h4 className="losers-title">📉 Top Losers</h4>
                  <div className="stock-list">
                    {marketData.losers.map((stock, i) => (
                      <div key={i} className="stock-item">
                        <div className="stock-info">
                          <div className="stock-symbol">{stock.symbol}</div>
                          <div className="stock-name">{stock.name}</div>
                        </div>
                        <div className="stock-price">
                          <div className="price">{stock.currency}{stock.price}</div>
                          {formatChange(stock.change, stock.changePercent)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
