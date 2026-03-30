// Financial Modeling Prep (FMP) API integration
// https://financialmodelingprep.com
// Free tier: 250 calls/day
// Note: FMP may block requests from certain regions (e.g., mainland China)
// Falls back to simplified data if FMP returns 403

import { getStockMeta } from "./stockMeta";

export interface FMPQuoteData {
  price: number;
  change?: number; // Price change
  changePercentage?: number; // Price change percentage
  name: string;
  sector: string;
  industry: string;
  beta: number;
  yearHigh: number; // 52-week high
  yearLow: number; // 52-week low
  dayLow?: number; // Day's low
  dayHigh?: number; // Day's high
  marketCap: number;
  logo?: string; // Company logo URL
  // Technical indicators (from quote endpoint)
  sma50?: number; // 50-day Simple Moving Average (priceAvg50)
  sma200?: number; // 200-day Simple Moving Average (priceAvg200)
  // Profile update tracking
  profileUpdated?: boolean; // Whether profile was refreshed
  // Analyst grades
  grades?: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
    consensus: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' | 'N/A';
    gradesUpdated?: boolean; // Whether grades were refreshed
  };
}

// FMP has different endpoints: /api/v3 (older) and /stable (newer)
// Using /stable as it appears to have better regional availability
const BASE_URL = "https://financialmodelingprep.com/stable";

// Profile refresh interval: 3 days in milliseconds
const PROFILE_REFRESH_INTERVAL = 3 * 24 * 60 * 60 * 1000;

function getApiKey(): string {
  return process.env.FMP_API_KEY || "";
}

// Check if profile needs refresh based on lastUpdatedProfile timestamp
export function needsProfileRefresh(lastUpdatedProfile?: string): boolean {
  if (!lastUpdatedProfile) return true;
  
  const lastUpdate = new Date(lastUpdatedProfile).getTime();
  const now = Date.now();
  return (now - lastUpdate) > PROFILE_REFRESH_INTERVAL;
}

// FMP Company Profile - provides industry, sector, beta, image, etc.
// https://financialmodelingprep.com/stable/profile?symbol=AAPL&apikey=xxx
interface FMPProfileData {
  symbol: string;
  companyName: string;
  industry: string;
  sector: string;
  beta: number;
  image?: string; // Logo URL
  description?: string;
  website?: string;
  country?: string;
}

async function fetchFMPProfile(ticker: string, apiKey: string): Promise<FMPProfileData | null> {
  try {
    const url = `${BASE_URL}/profile?symbol=${ticker.toUpperCase()}&apikey=${apiKey}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    
    if (!resp.ok) return null;
    
    const data = await resp.json() as FMPProfileData[];
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return null;
  } catch {
    return null;
  }
}

// FMP Analyst Grades - provides analyst consensus ratings
// https://financialmodelingprep.com/stable/grades-consensus?symbol=AAPL&apikey=xxx
interface FMPGradesData {
  symbol: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' | 'N/A';
}

// Grades refresh interval: 3 days in milliseconds
const GRADES_REFRESH_INTERVAL = 3 * 24 * 60 * 60 * 1000;

// Check if grades needs refresh based on lastUpdated timestamp
export function needsGradesRefresh(lastUpdatedGrades?: string): boolean {
  if (!lastUpdatedGrades) return true;
  
  const lastUpdate = new Date(lastUpdatedGrades).getTime();
  const now = Date.now();
  return (now - lastUpdate) > GRADES_REFRESH_INTERVAL;
}

export async function fetchFMPGrades(ticker: string, apiKey: string): Promise<FMPGradesData | null> {
  try {
    const url = `${BASE_URL}/grades-consensus?symbol=${ticker.toUpperCase()}&apikey=${apiKey}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    
    if (!resp.ok) return null;
    
    const data = await resp.json() as FMPGradesData[];
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch quote with smart profile refresh logic
export async function fetchFMPQuoteSmart(
  ticker: string, 
  lastUpdatedProfile?: string
): Promise<FMPQuoteData | null> {
  const apiKey = getApiKey();
  const meta = getStockMeta(ticker);
  
  // Determine if we need to refresh profile data
  const shouldRefreshProfile = needsProfileRefresh(lastUpdatedProfile);
  
  // Try FMP first if API key is available
  if (apiKey && apiKey !== 'your_fmp_api_key_here') {
    try {
      console.log(`[FMP] Fetching ${ticker}${shouldRefreshProfile ? ' (with profile)' : ' (quote only)'}...`);
      
      // Fetch quote
      const quoteUrl = `${BASE_URL}/quote?symbol=${ticker.toUpperCase()}&apikey=${apiKey}`;
      const quoteResp = await fetch(quoteUrl, { signal: AbortSignal.timeout(15000) });
      
      if (quoteResp.ok) {
        const quoteData = await quoteResp.json();
        if (Array.isArray(quoteData) && quoteData.length > 0) {
          const q = quoteData[0];
          
          // Fetch profile only if needed
          let profile: FMPProfileData | null = null;
          if (shouldRefreshProfile) {
            profile = await fetchFMPProfile(ticker, apiKey);
            console.log(`[FMP] Profile refreshed for ${ticker}`);
          }
          
          // Use profile data if available (fresh or cached logic), otherwise fall back to built-in metadata
          const sector = profile?.sector || meta?.sector || "";
          const industry = profile?.industry || meta?.industry || "";
          const beta = profile?.beta || meta?.beta || 1.0;
          const logo = profile?.image || "";
          
          const result: FMPQuoteData = {
            price: q.price,
            change: q.change,
            changePercentage: q.changePercentage,
            name: q.name || profile?.companyName || ticker,
            sector,
            industry,
            beta,
            yearHigh: q.yearHigh || 0,
            yearLow: q.yearLow || 0,
            dayLow: q.dayLow,
            dayHigh: q.dayHigh,
            marketCap: q.marketCap || 0,
            sma50: q.priceAvg50,
            sma200: q.priceAvg200,
            logo,
            profileUpdated: shouldRefreshProfile,
          };
          
          const changeStr = result.changePercentage !== undefined 
            ? `${result.changePercentage >= 0 ? '+' : ''}${result.changePercentage.toFixed(2)}%`
            : 'N/A';
          console.log(`[FMP] OK: ${ticker} = $${result.price} (${changeStr})${shouldRefreshProfile ? ' [profile updated]' : ''}`);
          return result;
        }
      } else if (quoteResp.status === 403) {
        console.log(`[FMP] HTTP 403 for ${ticker} - region blocked or invalid API key`);
      } else {
        console.log(`[FMP] HTTP ${quoteResp.status} for ${ticker}`);
      }
    } catch (err: any) {
      console.log(`[FMP] Error for ${ticker}: ${err.message}`);
    }
  }
  
  // Fallback
  return null;
}

// Legacy: Fetch quote with option to skip profile (for backward compatibility)
export async function fetchFMPQuoteLight(ticker: string, skipProfile: boolean = false): Promise<FMPQuoteData | null> {
  if (skipProfile) {
    // Use smart fetch with a recent timestamp to skip profile
    return fetchFMPQuoteSmart(ticker, new Date().toISOString());
  }
  return fetchFMPQuoteSmart(ticker, undefined);
}

// Simple price fetcher for fallback (using a public API that works in China)
async function fetchFallbackPrice(ticker: string): Promise<{ price: number; name: string } | null> {
  try {
    // Try using a simple quote API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    
    if (!resp.ok) return null;
    
    const data = await resp.json() as any;
    const result = data.chart?.result?.[0];
    
    if (!result) return null;
    
    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.previousClose;
    const name = meta.shortName || meta.longName || meta.symbol || ticker;
    
    if (!price) return null;
    
    return { price, name };
  } catch {
    return null;
  }
}

// Fetch real-time quote with technical data from FMP
// Falls back to basic data if FMP returns 403 (region blocked) or other errors
export async function fetchFMPQuote(ticker: string): Promise<FMPQuoteData | null> {
  // Full fetch with profile
  return fetchFMPQuoteSmart(ticker, undefined);
}

// Batch fetch multiple quotes
export async function fetchFMPQuotes(tickers: string[]): Promise<Map<string, FMPQuoteData>> {
  const results = new Map<string, FMPQuoteData>();
  
  for (const ticker of tickers) {
    const data = await fetchFMPQuote(ticker);
    if (data && data.price > 0) {
      results.set(ticker, data);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  return results;
}

// Check if FMP is available and working
export async function checkFMPStatus(): Promise<{ available: boolean; reason?: string }> {
  const apiKey = getApiKey();
  
  if (!apiKey || apiKey === 'your_fmp_api_key_here') {
    return { available: false, reason: 'No API key configured' };
  }
  
  try {
    const url = `${BASE_URL}/quote?symbol=AAPL&apikey=${apiKey}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    
    if (resp.ok) {
      return { available: true };
    } else if (resp.status === 403) {
      return { available: false, reason: 'Region blocked (403)' };
    } else {
      return { available: false, reason: `HTTP ${resp.status}` };
    }
  } catch (err: any) {
    return { available: false, reason: err.message };
  }
}
