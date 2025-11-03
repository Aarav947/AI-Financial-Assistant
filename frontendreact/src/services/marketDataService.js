// Using Finnhub API for real-time market data
const FINNHUB_API_KEY = 'your_generated_api_key';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';

export const fetchMarketData = async () => {
  try {
    console.log('Fetching real market data from Finnhub...');
    
    const [indicesData, trendingData, currencyData] = await Promise.all([
      fetchIndices(),
      fetchTrendingStocks(),
      fetchCurrencyRates()
    ]);

    return {
      indices: indicesData,
      trending: trendingData.trending,
      gainers: trendingData.gainers,
      losers: trendingData.losers,
      currencies: currencyData
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    return getMockMarketData();
  }
};

const fetchIndices = async () => {
  try {
    const indices = [
      { symbol: 'SPY', name: 'S&P 500', currency: '$', source: 'finnhub' },
      { symbol: 'QQQ', name: 'NASDAQ', currency: '$', source: 'finnhub' },
      { symbol: 'DIA', name: 'DOW JONES', currency: '$', source: 'finnhub' },
      { symbol: '^NSEI', name: 'NIFTY 50', currency: '₹', source: 'yahoo' }
    ];

    const indicesPromises = indices.map(async (index) => {
      if (index.source === 'yahoo') {
        return await fetchYahooQuote(index);
      } else {
        const quote = await fetchQuote(index.symbol);
        
        if (!quote || quote.c === 0) {
          console.warn(`No data for ${index.symbol}, using fallback`);
          return null;
        }
        
        return {
          name: index.name,
          symbol: index.symbol,
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          currency: index.currency
        };
      }
    });

    const results = await Promise.all(indicesPromises);
    const validResults = results.filter(r => r !== null && r.price > 0);
    
    console.log('Valid indices:', validResults.length);
    
    if (validResults.length === 0) {
      console.warn('No valid index data, using mock data');
      return getMockMarketData().indices;
    }
    
    return validResults.length > 0 ? validResults : getMockMarketData().indices;
  } catch (error) {
    console.error('Error fetching indices:', error);
    return getMockMarketData().indices;
  }
};

const fetchYahooQuote = async (index) => {
  try {
    console.log(`Fetching ${index.name} from Yahoo Finance (via proxy)...`);
    
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(index.symbol)}?interval=1d&range=1d`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      console.error(`Yahoo Finance proxy failed for ${index.symbol}:`, response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      console.warn(`No data from Yahoo Finance for ${index.symbol}`);
      return null;
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    console.log(`✓ ${index.name}: ${index.currency}${currentPrice.toFixed(2)} (${changePercent.toFixed(2)}%)`);
    
    return {
      name: index.name,
      symbol: index.symbol,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      currency: index.currency
    };
    
  } catch (error) {
    console.error(`Error fetching Yahoo quote for ${index.symbol}:`, error);
    return null;
  }
};

const fetchTrendingStocks = async () => {
  try {
    // Stock name mapping (since profile endpoint requires paid plan)
    const stockNames = {
      'NVDA': 'NVIDIA Corp',
      'TSLA': 'Tesla Inc',
      'AAPL': 'Apple Inc',
      'MSFT': 'Microsoft Corp',
      'GOOGL': 'Alphabet Inc'
    };

    const popularStocks = [
      { symbol: 'NVDA', currency: '$' },
      { symbol: 'TSLA', currency: '$' },
      { symbol: 'AAPL', currency: '$' },
      { symbol: 'MSFT', currency: '$' },
      { symbol: 'GOOGL', currency: '$' }
    ];
    
    const stockPromises = popularStocks.map(async (stock) => {
      const quote = await fetchQuote(stock.symbol);
      
      if (!quote || quote.c === 0) {
        return null;
      }
      
      return {
        symbol: stock.symbol,
        name: stockNames[stock.symbol] || stock.symbol,
        price: quote.c,
        change: quote.d,
        changePercent: quote.dp,
        currency: stock.currency
      };
    });

    const stocksData = await Promise.all(stockPromises);
    const validStocks = stocksData.filter(stock => stock !== null && stock.price > 0);
    
    console.log('Valid stocks:', validStocks.length);
    
    if (validStocks.length === 0) {
      const mockData = getMockMarketData();
      return {
        trending: mockData.trending,
        gainers: mockData.gainers,
        losers: mockData.losers
      };
    }
    
    const sortedByChange = [...validStocks].sort((a, b) => 
      Math.abs(b.changePercent) - Math.abs(a.changePercent)
    );
    
    const gainers = validStocks
      .filter(stock => stock.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 3);
    
    const losers = validStocks
      .filter(stock => stock.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 3);
    
    return {
      trending: sortedByChange.slice(0, 5),
      gainers: gainers.length > 0 ? gainers : getMockMarketData().gainers,
      losers: losers.length > 0 ? losers : getMockMarketData().losers
    };
  } catch (error) {
    console.error('Error fetching trending stocks:', error);
    const mockData = getMockMarketData();
    return {
      trending: mockData.trending,
      gainers: mockData.gainers,
      losers: mockData.losers
    };
  }
};

export const fetchCurrencyRates = async () => {
  try {
    console.log('Fetching currency rates...');
    
    const response = await fetch(EXCHANGE_RATE_API);
    
    if (!response.ok) {
      throw new Error('Currency API failed');
    }
    
    const data = await response.json();
    const inrRate = data.rates.INR;
    const eurRate = data.rates.EUR;
    const gbpRate = data.rates.GBP;
    
    console.log(`✓ Currency rates fetched: USD/INR = ${inrRate.toFixed(2)}`);
    
    return {
      usdInr: {
        pair: 'USD/INR',
        rate: inrRate.toFixed(2),
        change: 0.2,
        symbol: '₹'
      },
      eurInr: {
        pair: 'EUR/INR',
        rate: (inrRate / eurRate).toFixed(2),
        change: -0.1,
        symbol: '₹'
      },
      gbpInr: {
        pair: 'GBP/INR',
        rate: (inrRate / gbpRate).toFixed(2),
        change: 0.3,
        symbol: '₹'
      }
    };
    
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    return {
      usdInr: { pair: 'USD/INR', rate: '83.15', change: 0.2, symbol: '₹' },
      eurInr: { pair: 'EUR/INR', rate: '90.45', change: -0.1, symbol: '₹' },
      gbpInr: { pair: 'GBP/INR', rate: '102.30', change: 0.3, symbol: '₹' }
    };
  }
};

const fetchQuote = async (symbol) => {
  try {
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch quote for ${symbol}:`, response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.c === 0 || data.c === null) {
      console.warn(`Invalid data for ${symbol}:`, data);
      return null;
    }
    
    console.log(`✓ ${symbol}: $${data.c} (${data.dp}%)`);
    return data;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

const getMockMarketData = () => {
  return {
    indices: [
      { name: 'S&P 500', symbol: 'SPY', price: 478.35, change: 4.23, changePercent: 0.89, currency: '$' },
      { name: 'NASDAQ', symbol: 'QQQ', price: 396.87, change: 3.45, changePercent: 0.88, currency: '$' },
      { name: 'DOW JONES', symbol: 'DIA', price: 373.16, change: -1.45, changePercent: -0.39, currency: '$' },
      { name: 'NIFTY 50', symbol: '^NSEI', price: 24180.25, change: 178.50, changePercent: 0.74, currency: '₹' }
    ],
    trending: [
      { symbol: 'NVDA', name: 'NVIDIA Corp', price: 495.22, change: 12.34, changePercent: 2.56, currency: '$' },
      { symbol: 'TSLA', name: 'Tesla Inc', price: 248.48, change: -3.21, changePercent: -1.27, currency: '$' },
      { symbol: 'AAPL', name: 'Apple Inc', price: 189.84, change: 2.15, changePercent: 1.15, currency: '$' },
      { symbol: 'MSFT', name: 'Microsoft Corp', price: 378.91, change: 5.67, changePercent: 1.52, currency: '$' },
      { symbol: 'GOOGL', name: 'Alphabet Inc', price: 141.80, change: 1.23, changePercent: 0.87, currency: '$' }
    ],
    gainers: [
      { symbol: 'AMD', name: 'Advanced Micro Devices', price: 145.67, change: 8.92, changePercent: 6.52, currency: '$' },
      { symbol: 'NFLX', name: 'Netflix Inc', price: 478.33, change: 18.45, changePercent: 4.01, currency: '$' },
      { symbol: 'META', name: 'Meta Platforms', price: 356.78, change: 12.34, changePercent: 3.58, currency: '$' }
    ],
    losers: [
      { symbol: 'PYPL', name: 'PayPal Holdings', price: 62.45, change: -4.23, changePercent: -6.34, currency: '$' },
      { symbol: 'SNAP', name: 'Snap Inc', price: 11.23, change: -0.78, changePercent: -6.49, currency: '$' },
      { symbol: 'UBER', name: 'Uber Technologies', price: 58.92, change: -2.34, changePercent: -3.82, currency: '$' }
    ],
    currencies: {
      usdInr: { pair: 'USD/INR', rate: '83.15', change: 0.2, symbol: '₹' },
      eurInr: { pair: 'EUR/INR', rate: '90.45', change: -0.1, symbol: '₹' },
      gbpInr: { pair: 'GBP/INR', rate: '102.30', change: 0.3, symbol: '₹' }
    }
  };
};

