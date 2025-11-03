const FINNHUB_API_KEY = 'd43kj19r01qvk0jcbpjgd43kj19r01qvk0jcbpk0';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const ALPHA_VANTAGE_KEY = 'SF8ZXC6RYYK39NZA';

const TIME_PERIODS = {
  '1D': { resolution: '5', days: 1 },
  '1W': { resolution: '30', days: 7 },
  '1M': { resolution: 'D', days: 30 },
  '3M': { resolution: 'D', days: 90 },
  '1Y': { resolution: 'W', days: 365 }
};

// Utility function to format timestamps based on period
export const formatChartLabel = (timestamp, period) => {
  const date = new Date(timestamp * 1000);
  
  switch(period) {
    case '1D':
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }); // "2:30 PM"
    
    case '1W':
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: 'numeric'
      }); // "Mon 2PM"
    
    case '1M':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }); // "Jan 15"
    
    case '3M':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }); // "Jan 15"
    
    case '1Y':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      }); // "Jan '24"
    
    default:
      return date.toLocaleDateString();
  }
};

export const fetchChartData = async (symbol, period = '1M') => {
  try {
    const config = TIME_PERIODS[period];
    const now = Math.floor(Date.now() / 1000);
    const from = now - (config.days * 24 * 60 * 60);

    const response = await fetch(
      `${FINNHUB_BASE_URL}/stock/candle?symbol=${symbol}&resolution=${config.resolution}&from=${from}&to=${now}&token=${FINNHUB_API_KEY}`
    );

    const data = await response.json();
    console.log('API Response for', symbol, period, ':', data);

    if (data.s !== 'ok' || !data.c || data.c.length === 0) {
      console.error('No chart data for', symbol, '- using fallback');
      return generateFallbackData(symbol, period);
    }

    const closePrices = data.c;
    const timestamps = data.t; // Finnhub returns UNIX timestamps
    
    const step = Math.ceil(closePrices.length / 25);
    const rawPrices = [];
    const rawTimestamps = [];
    
    for (let i = 0; i < closePrices.length; i += step) {
      rawPrices.push(closePrices[i]);
      rawTimestamps.push(timestamps[i]);
    }

    const slicedRaw = rawPrices.slice(0, 25);
    const slicedTimestamps = rawTimestamps.slice(0, 25);
    
    const min = Math.min(...slicedRaw);
    const max = Math.max(...slicedRaw);
    const range = max - min || 1;

    const normalized = slicedRaw.map(price => {
      return ((price - min) / range) * 60 + 40;
    });

    return { 
      data: normalized, 
      rawPrices: slicedRaw, 
      timestamps: slicedTimestamps,
      min, 
      max 
    };

  } catch (error) {
    console.error('Chart data fetch error for', symbol, ':', error);
    return generateFallbackData(symbol, period);
  }
};

const generateFallbackData = (symbol, period = '1M') => {
  const priceRanges = {
    'TSLA': { base: 450, variance: 50 },
    'MSFT': { base: 380, variance: 40 },
    'AAPL': { base: 175, variance: 20 },
    'NVDA': { base: 500, variance: 60 },
    'GOLD': { base: 2000, variance: 100 },
    'SILVER': { base: 24, variance: 3 },
    'OIL': { base: 85, variance: 10 }
  };

  const range = priceRanges[symbol] || { base: 100, variance: 20 };
  const mockData = Array.from({ length: 25 }, () => Math.random() * 60 + 40);
  const rawPrices = Array.from({ length: 25 }, () => 
    range.base + (Math.random() - 0.5) * range.variance * 2
  );

  // Generate mock timestamps
  const now = Math.floor(Date.now() / 1000);
  const config = TIME_PERIODS[period];
  const secondsPerBar = (config.days * 24 * 60 * 60) / 25;
  const timestamps = Array.from({ length: 25 }, (_, i) => 
    now - (24 - i) * secondsPerBar
  );

  return { 
    data: mockData, 
    rawPrices: rawPrices,
    timestamps: timestamps,
    min: Math.min(...rawPrices),
    max: Math.max(...rawPrices)
  };
};

export const fetchCommodityData = async (symbol, period = '1M') => {
  try {
    console.log('Fetching LIVE commodity data for:', symbol);

    const commodityMap = {
      'GOLD': { type: 'fx', from: 'XAU', to: 'USD' },
      'SILVER': { type: 'fx', from: 'XAG', to: 'USD' },
      'OIL': { type: 'wti' }
    };

    const config = commodityMap[symbol];
    if (!config) {
      console.log('Unknown commodity:', symbol);
      return generateFallbackData(symbol, period);
    }

    // Handle Gold and Silver (FX data)
    if (config.type === 'fx') {
      const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${config.from}&to_symbol=${config.to}&apikey=${ALPHA_VANTAGE_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      const timeSeries = data['Time Series FX (Daily)'];
      if (!timeSeries) {
        console.error('No FX data received for', symbol);
        return generateFallbackData(symbol, period);
      }

      // Extract prices and dates
      const entries = Object.entries(timeSeries).slice(0, 30).reverse();
      const prices = entries.map(([, values]) => parseFloat(values['4. close']));
      const dates = entries.map(([date]) => new Date(date).getTime() / 1000);

      const slicedPrices = prices.slice(0, 25);
      const slicedTimestamps = dates.slice(0, 25);
      
      const min = Math.min(...slicedPrices);
      const max = Math.max(...slicedPrices);
      const range = max - min || 1;

      const normalized = slicedPrices.map(price => ((price - min) / range) * 60 + 40);

      console.log(`✅ Live ${symbol} data fetched:`, slicedPrices[slicedPrices.length - 1]);
      return { 
        data: normalized, 
        rawPrices: slicedPrices, 
        timestamps: slicedTimestamps,
        min, 
        max 
      };
    }

    // Handle Oil (WTI data)
    if (config.type === 'wti') {
      const url = `https://www.alphavantage.co/query?function=WTI&interval=daily&apikey=${ALPHA_VANTAGE_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        console.error('No WTI data received');
        return generateFallbackData(symbol, period);
      }

      const entries = data.data.slice(-30).reverse();
      const prices = entries.map(entry => parseFloat(entry.value));
      const dates = entries.map(entry => new Date(entry.date).getTime() / 1000);

      const slicedPrices = prices.slice(0, 25);
      const slicedTimestamps = dates.slice(0, 25);
      
      const min = Math.min(...slicedPrices);
      const max = Math.max(...slicedPrices);
      const range = max - min || 1;

      const normalized = slicedPrices.map(price => ((price - min) / range) * 60 + 40);

      console.log(`✅ Live OIL data fetched:`, slicedPrices[slicedPrices.length - 1]);
      return { 
        data: normalized, 
        rawPrices: slicedPrices, 
        timestamps: slicedTimestamps,
        min, 
        max 
      };
    }

    return generateFallbackData(symbol, period);

  } catch (error) {
    console.error('Alpha Vantage commodity fetch error:', error);
    return generateFallbackData(symbol, period);
  }
};
