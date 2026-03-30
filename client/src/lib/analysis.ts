// Portfolio risk analysis engine
import type { Holding } from "@shared/schema";

// --- STOCK DATA ---
export interface StockData {
  ticker: string;
  name: string;
  sector: string;
  industry?: string; // Optional industry for correlation analysis
  currentPrice: number;
  beta: number;
  annualVolatility: number;
  drawdown1Y: number;
  drawdown3Y: number;
  drawdown5Y: number;
  riskFactors: {
    interestRate: number;
    regulatory: number;
    singleCustomer: number;
  };
  selloffGroup: string;
  // Technical indicators from FMP (raw data)
  marketCap: number;
  yearHigh: number; // 52-week high
  yearLow: number; // 52-week low
  sma50?: number; // 50-day MA (priceAvg50 from FMP)
  sma200?: number; // 200-day MA (priceAvg200 from FMP)
}

// Helper functions to calculate technical indicators on the fly
export function calcPriceToSMA50(sd: StockData): number | null {
  if (!sd.sma50 || sd.sma50 <= 0 || sd.currentPrice <= 0) return null;
  return ((sd.currentPrice - sd.sma50) / sd.sma50) * 100;
}

export function calcPriceToSMA200(sd: StockData): number | null {
  if (!sd.sma200 || sd.sma200 <= 0 || sd.currentPrice <= 0) return null;
  return ((sd.currentPrice - sd.sma200) / sd.sma200) * 100;
}

export function calcPriceToYearHigh(sd: StockData): number {
  if (sd.yearHigh <= 0 || sd.currentPrice <= 0) return 0;
  return ((sd.currentPrice - sd.yearHigh) / sd.yearHigh) * 100;
}

export function calcPriceToYearLow(sd: StockData): number {
  if (sd.yearLow <= 0 || sd.currentPrice <= 0) return 0;
  return ((sd.currentPrice - sd.yearLow) / sd.yearLow) * 100;
}

// Map sector to selloff group
function sectorToGroup(sector: string): string {
  const map: Record<string, string> = {
    "Technology": "Big Tech", "Communication Services": "Big Tech",
    "Consumer Cyclical": "High Beta Growth", "Consumer Discretionary": "High Beta Growth",
    "Financial Services": "Financials", "Financials": "Financials",
    "Healthcare": "Healthcare",
    "Consumer Defensive": "Defensive", "Consumer Staples": "Defensive",
    "Utilities": "Defensive", "Real Estate": "Defensive",
    "Energy": "Energy/Commodities", "Basic Materials": "Energy/Commodities",
    "Industrials": "Other",
  };
  return map[sector] || "Other";
}

// Derive risk factors from sector
function sectorRiskFactors(sector: string) {
  const s = sector.toLowerCase();
  return {
    interestRate: s.includes("financial") ? 9 : s.includes("real estate") ? 9 : s.includes("tech") ? 4 : 5,
    regulatory: s.includes("health") ? 8 : s.includes("communication") ? 7 : s.includes("financial") ? 8 : 5,
    singleCustomer: s.includes("tech") ? 4 : 3,
  };
}

// Build StockData from a Holding (which now contains live data)
export function buildStockData(h: Holding): StockData {
  const sector = h.sector || "Other";
  const beta = h.beta || 1.0;
  const vol = Math.max(0.15, Math.min(0.60, beta * 0.22));
  const currentPrice = h.currentPrice || 0;
  
  return {
    ticker: h.ticker,
    name: h.name || h.ticker,
    sector,
    industry: h.industry,
    currentPrice,
    beta,
    annualVolatility: vol,
    drawdown1Y: -(vol * 40),
    drawdown3Y: -(vol * 80),
    drawdown5Y: -(vol * 100),
    riskFactors: sectorRiskFactors(sector),
    selloffGroup: sectorToGroup(sector),
    marketCap: h.marketCap || 0,
    yearHigh: h.yearHigh || 0,
    yearLow: h.yearLow || 0,
    sma50: h.sma50,
    sma200: h.sma200,
    priceToSMA50: h.priceToSMA50,
    priceToSMA200: h.priceToSMA200,
    priceToYearHigh: h.yearHigh > 0 ? ((currentPrice - h.yearHigh) / h.yearHigh * 100) : 0,
    priceToYearLow: h.yearLow > 0 ? ((currentPrice - h.yearLow) / h.yearLow * 100) : 0,
  };
}

// --- CORRELATION MATRIX ---
const CORRELATION_MAP: Record<string, Record<string, number>> = {
  "Big Tech": { "Big Tech": 0.85, "Semiconductors": 0.78, "Financials": 0.45, "Defensive": 0.15, "Energy/Commodities": 0.20, "High Beta Growth": 0.72, "Healthcare": 0.30, "Other": 0.40 },
  "Semiconductors": { "Big Tech": 0.78, "Semiconductors": 0.90, "Financials": 0.40, "Defensive": 0.10, "Energy/Commodities": 0.15, "High Beta Growth": 0.68, "Healthcare": 0.25, "Other": 0.35 },
  "Financials": { "Big Tech": 0.45, "Semiconductors": 0.40, "Financials": 0.88, "Defensive": 0.35, "Energy/Commodities": 0.40, "High Beta Growth": 0.50, "Healthcare": 0.35, "Other": 0.45 },
  "Defensive": { "Big Tech": 0.15, "Semiconductors": 0.10, "Financials": 0.35, "Defensive": 0.82, "Energy/Commodities": 0.25, "High Beta Growth": 0.08, "Healthcare": 0.55, "Other": 0.30 },
  "Energy/Commodities": { "Big Tech": 0.20, "Semiconductors": 0.15, "Financials": 0.40, "Defensive": 0.25, "Energy/Commodities": 0.92, "High Beta Growth": 0.18, "Healthcare": 0.20, "Other": 0.30 },
  "High Beta Growth": { "Big Tech": 0.72, "Semiconductors": 0.68, "Financials": 0.50, "Defensive": 0.08, "Energy/Commodities": 0.18, "High Beta Growth": 0.88, "Healthcare": 0.22, "Other": 0.40 },
  "Healthcare": { "Big Tech": 0.30, "Semiconductors": 0.25, "Financials": 0.35, "Defensive": 0.55, "Energy/Commodities": 0.20, "High Beta Growth": 0.22, "Healthcare": 0.85, "Other": 0.35 },
  "Other": { "Big Tech": 0.40, "Semiconductors": 0.35, "Financials": 0.45, "Defensive": 0.30, "Energy/Commodities": 0.30, "High Beta Growth": 0.40, "Healthcare": 0.35, "Other": 0.60 },
};

function getCorrelation(sd1: StockData, sd2: StockData): number {
  if (sd1.ticker === sd2.ticker) return 1.0;
  const base = CORRELATION_MAP[sd1.selloffGroup]?.[sd2.selloffGroup] ?? 0.40;
  const hash = (sd1.ticker + sd2.ticker).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const variation = ((hash % 20) - 10) / 100;
  return Math.max(-1, Math.min(1, base + variation));
}

// --- INDUSTRY-BASED CORRELATION ---
// Industry similarity matrix - higher values = more correlated
const INDUSTRY_SIMILARITY: Record<string, Record<string, number>> = {
  // Technology
  "Semiconductors": { "Semiconductors": 1.0, "Software": 0.65, "Consumer Electronics": 0.55, "Internet Content": 0.50 },
  "Software": { "Semiconductors": 0.65, "Software": 1.0, "Internet Content": 0.75, "Cloud Computing": 0.80 },
  "Consumer Electronics": { "Semiconductors": 0.55, "Software": 0.45, "Consumer Electronics": 1.0, "Hardware": 0.70 },
  "Internet Content": { "Semiconductors": 0.50, "Software": 0.75, "Internet Content": 1.0, "E-commerce": 0.60 },
  "Cloud Computing": { "Software": 0.80, "Cloud Computing": 1.0 },
  "Hardware": { "Consumer Electronics": 0.70, "Semiconductors": 0.60, "Hardware": 1.0 },
  // Financials
  "Banks": { "Banks": 1.0, "Capital Markets": 0.85, "Insurance": 0.70, "Financial Services": 0.80 },
  "Capital Markets": { "Banks": 0.85, "Capital Markets": 1.0, "Financial Services": 0.75 },
  "Insurance": { "Banks": 0.70, "Insurance": 1.0, "Financial Services": 0.65 },
  "Financial Services": { "Banks": 0.80, "Capital Markets": 0.75, "Insurance": 0.65, "Financial Services": 1.0 },
  // Healthcare
  "Drug Manufacturers": { "Drug Manufacturers": 1.0, "Biotechnology": 0.75, "Healthcare Plans": 0.40 },
  "Biotechnology": { "Drug Manufacturers": 0.75, "Biotechnology": 1.0, "Medical Devices": 0.50 },
  "Healthcare Plans": { "Drug Manufacturers": 0.40, "Healthcare Plans": 1.0, "Medical Devices": 0.35 },
  "Medical Devices": { "Drug Manufacturers": 0.45, "Biotechnology": 0.50, "Medical Devices": 1.0 },
  // Consumer
  "Retail": { "Retail": 1.0, "Restaurants": 0.55, "Apparel": 0.60, "E-commerce": 0.75 },
  "Restaurants": { "Retail": 0.55, "Restaurants": 1.0, "Food & Beverage": 0.50 },
  "Apparel": { "Retail": 0.60, "Apparel": 1.0 },
  "E-commerce": { "Retail": 0.75, "Internet Content": 0.60, "E-commerce": 1.0 },
  "Food & Beverage": { "Restaurants": 0.50, "Food & Beverage": 1.0 },
  // Energy & Materials
  "Oil & Gas": { "Oil & Gas": 1.0, "Energy": 0.90, "Materials": 0.45 },
  "Energy": { "Oil & Gas": 0.90, "Energy": 1.0, "Materials": 0.50 },
  "Materials": { "Oil & Gas": 0.45, "Energy": 0.50, "Materials": 1.0 },
  // Other
  "Auto Manufacturers": { "Auto Manufacturers": 1.0, "Consumer Electronics": 0.35 },
  "Telecom": { "Telecom": 1.0, "Internet Content": 0.40 },
  "Aerospace": { "Aerospace": 1.0, "Industrials": 0.70 },
  "Industrials": { "Aerospace": 0.70, "Industrials": 1.0 },
};

// Normalize industry name for matching
function normalizeIndustry(industry: string): string {
  const normalized = industry.toLowerCase();
  if (normalized.includes("semiconductor")) return "Semiconductors";
  if (normalized.includes("software")) return "Software";
  if (normalized.includes("electronic") && normalized.includes("consumer")) return "Consumer Electronics";
  if (normalized.includes("internet")) return "Internet Content";
  if (normalized.includes("bank")) return "Banks";
  if (normalized.includes("insurance")) return "Insurance";
  if (normalized.includes("pharm") || normalized.includes("drug")) return "Drug Manufacturers";
  if (normalized.includes("biotech")) return "Biotechnology";
  if (normalized.includes("retail")) return "Retail";
  if (normalized.includes("oil") || normalized.includes("gas")) return "Oil & Gas";
  return industry;
}

// Calculate industry-based correlation (supplements selloff group correlation)
function getIndustryCorrelation(sd1: StockData, sd2: StockData): number {
  if (sd1.ticker === sd2.ticker) return 1.0;
  if (!sd1.industry || !sd2.industry) return 0.0;
  
  const ind1 = normalizeIndustry(sd1.industry);
  const ind2 = normalizeIndustry(sd2.industry);
  
  // Same industry = high correlation
  if (ind1 === ind2) return 0.90;
  
  // Look up similarity matrix
  const similarity = INDUSTRY_SIMILARITY[ind1]?.[ind2] ?? INDUSTRY_SIMILARITY[ind2]?.[ind1] ?? 0.30;
  return similarity;
}

// Combined correlation using both selloff group and industry
function getCombinedCorrelation(sd1: StockData, sd2: StockData): number {
  const selloffCorr = getCorrelation(sd1, sd2);
  const industryCorr = getIndustryCorrelation(sd1, sd2);
  
  // Weight: 60% selloff group (macro), 40% industry (micro)
  // If industry data is available, blend it in
  if (sd1.industry && sd2.industry) {
    return selloffCorr * 0.6 + industryCorr * 0.4;
  }
  return selloffCorr;
}

// --- SECTOR TRANSLATION ---
const SECTOR_CN: Record<string, string> = {
  "Technology": "科技", "Financial Services": "金融服务", "Financials": "金融",
  "Healthcare": "医疗保健", "Consumer Cyclical": "可选消费", "Consumer Discretionary": "可选消费",
  "Consumer Defensive": "必需消费品", "Consumer Staples": "必需消费品",
  "Energy": "能源", "Communication Services": "通信服务",
  "Industrials": "工业", "Utilities": "公用事业", "Real Estate": "房地产",
  "Basic Materials": "基础材料", "Other": "其他",
};

// --- PORTFOLIO ANALYSIS ---
export interface PortfolioAnalysis {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPct: number;
  positions: PositionAnalysis[];
  correlationMatrix: { tickers: string[]; matrix: number[][] };
  industryCorrelationMatrix: { tickers: string[]; matrix: number[][]; industries: string[] };
  highRiskPairs: { ticker1: string; ticker2: string; correlation: number }[];
  industryHighRiskPairs: { ticker1: string; ticker2: string; ticker1Industry: string; ticker2Industry: string; correlation: number }[];
  selloffGroups: { group: string; tickers: string[]; totalValue: number }[];
  industryBreakdown: { industry: string; tickers: string[]; totalValue: number; pct: number }[];
  sectorBreakdown: { sector: string; sectorCN: string; tickers: string[]; value: number; pct: number; warning: boolean }[];
  drawdowns: { ticker: string; d1Y: number; d3Y: number; d5Y: number }[];
  portfolioDrawdown2022: number;
  portfolioDrawdown2020: number;
  riskContributions: { ticker: string; riskContribution: number; pct: number }[];
  topRiskPosition: string;
  factorVulnerabilities: { ticker: string; interestRate: number; regulatory: number; singleCustomer: number }[];
  mostVulnerable: { interestRate: string; regulatory: string; singleCustomer: string };
  betas: { ticker: string; beta: number; weightedBeta: number }[];
  portfolioBeta: number;
  // Technical analysis
  technicalAnalysis: {
    aboveSMA50: string[]; // tickers above 50-day MA
    aboveSMA200: string[]; // tickers above 200-day MA
    nearYearHigh: string[]; // tickers within 5% of 52-week high
    nearYearLow: string[]; // tickers within 20% of 52-week low
    smaAnalysis: { ticker: string; sector: string; industry?: string; sma50: number | null; sma200: number | null; priceToSMA50: number | null; priceToSMA200: number | null }[];
    yearHighLowAnalysis: { ticker: string; priceToYearHigh: number; priceToYearLow: number }[];
  };
  diversificationScore: number;
  trimRecommendations: string[];
  diversificationAdvice: string;
}

export interface PositionAnalysis {
  id: number;
  ticker: string;
  name: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPct: number;
  weight: number;
  sector: string;
}

export function analyzePortfolio(holdings: Holding[]): PortfolioAnalysis | null {
  if (holdings.length === 0) return null;

  // Build stock data from holdings
  const stockDataMap = new Map<string, StockData>();
  holdings.forEach(h => {
    stockDataMap.set(h.ticker, buildStockData(h));
  });

  // Build positions
  const positions: PositionAnalysis[] = holdings.map(h => {
    const sd = stockDataMap.get(h.ticker)!;
    const marketValue = sd.currentPrice * h.shares;
    const costTotal = h.costBasis * h.shares;
    return {
      id: h.id,
      ticker: h.ticker,
      name: sd.name,
      shares: h.shares,
      costBasis: h.costBasis,
      currentPrice: sd.currentPrice,
      marketValue,
      pnl: marketValue - costTotal,
      pnlPct: costTotal > 0 ? ((marketValue - costTotal) / costTotal) * 100 : 0,
      weight: 0,
      sector: sd.sector,
    };
  });

  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalCost = positions.reduce((s, p) => s + p.costBasis * p.shares, 0);
  positions.forEach(p => { p.weight = totalValue > 0 ? p.marketValue / totalValue : 0; });

  // Correlation matrix (selloff group based)
  const tickers = positions.map(p => p.ticker);
  const sdList = tickers.map(t => stockDataMap.get(t)!);
  const matrix = sdList.map(s1 => sdList.map(s2 => getCorrelation(s1, s2)));

  // Industry-based correlation matrix
  const industryMatrix = sdList.map(s1 => sdList.map(s2 => getCombinedCorrelation(s1, s2)));
  const industries = sdList.map(s => s.industry || "Unknown");

  // High risk pairs - selloff group based (corr > 0.7)
  const highRiskPairs: { ticker1: string; ticker2: string; correlation: number }[] = [];
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i + 1; j < tickers.length; j++) {
      const corr = matrix[i][j];
      if (corr > 0.7) highRiskPairs.push({ ticker1: tickers[i], ticker2: tickers[j], correlation: corr });
    }
  }
  highRiskPairs.sort((a, b) => b.correlation - a.correlation);

  // High risk pairs - industry based (corr > 0.75)
  const industryHighRiskPairs: { ticker1: string; ticker2: string; ticker1Industry: string; ticker2Industry: string; correlation: number }[] = [];
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i + 1; j < tickers.length; j++) {
      const corr = industryMatrix[i][j];
      if (corr > 0.75) {
        industryHighRiskPairs.push({ 
          ticker1: tickers[i], 
          ticker2: tickers[j], 
          ticker1Industry: industries[i],
          ticker2Industry: industries[j],
          correlation: corr 
        });
      }
    }
  }
  industryHighRiskPairs.sort((a, b) => b.correlation - a.correlation);

  // Selloff groups
  const groupMap = new Map<string, { tickers: string[]; totalValue: number }>();
  positions.forEach(p => {
    const sd = stockDataMap.get(p.ticker)!;
    const existing = groupMap.get(sd.selloffGroup);
    if (existing) { existing.tickers.push(p.ticker); existing.totalValue += p.marketValue; }
    else groupMap.set(sd.selloffGroup, { tickers: [p.ticker], totalValue: p.marketValue });
  });
  const selloffGroups = Array.from(groupMap.entries())
    .map(([group, data]) => ({ group, ...data }))
    .sort((a, b) => b.totalValue - a.totalValue);

  // Industry breakdown
  const industryMap = new Map<string, { tickers: string[]; totalValue: number }>();
  positions.forEach(p => {
    const sd = stockDataMap.get(p.ticker)!;
    const industry = sd.industry || "Unknown";
    const existing = industryMap.get(industry);
    if (existing) { existing.tickers.push(p.ticker); existing.totalValue += p.marketValue; }
    else industryMap.set(industry, { tickers: [p.ticker], totalValue: p.marketValue });
  });
  const industryBreakdown = Array.from(industryMap.entries())
    .map(([industry, data]) => ({ 
      industry, 
      tickers: data.tickers, 
      totalValue: data.totalValue,
      pct: totalValue > 0 ? (data.totalValue / totalValue) * 100 : 0
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  // Sector breakdown
  const sectorMap = new Map<string, { value: number; tickers: string[] }>();
  positions.forEach(p => {
    const existing = sectorMap.get(p.sector);
    if (existing) {
      existing.value += p.marketValue;
      existing.tickers.push(p.ticker);
    } else {
      sectorMap.set(p.sector, { value: p.marketValue, tickers: [p.ticker] });
    }
  });
  const sectorBreakdown = Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      sectorCN: SECTOR_CN[sector] || sector,
      tickers: data.tickers,
      value: data.value,
      pct: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      warning: totalValue > 0 ? (data.value / totalValue) * 100 > 30 : false,
    }))
    .sort((a, b) => b.pct - a.pct);

  // Drawdowns
  const drawdowns = positions.map(p => {
    const sd = stockDataMap.get(p.ticker)!;
    return { ticker: p.ticker, d1Y: sd.drawdown1Y, d3Y: sd.drawdown3Y, d5Y: sd.drawdown5Y };
  });

  // Portfolio drawdown estimates
  const portfolioDrawdown2022 = positions.reduce((s, p) => {
    const sd = stockDataMap.get(p.ticker)!;
    const mult: Record<string, number> = {
      "Big Tech": -28, "Semiconductors": -38, "High Beta Growth": -45,
      "Defensive": -5, "Energy/Commodities": 25, "Financials": -15, "Healthcare": -8,
    };
    return s + p.weight * (mult[sd.selloffGroup] ?? -15);
  }, 0);

  const portfolioDrawdown2020 = positions.reduce((s, p) => {
    const sd = stockDataMap.get(p.ticker)!;
    const mult: Record<string, number> = {
      "Big Tech": -25, "Semiconductors": -30, "High Beta Growth": -45,
      "Defensive": -15, "Energy/Commodities": -55, "Financials": -38, "Healthcare": -20,
    };
    return s + p.weight * (mult[sd.selloffGroup] ?? -34);
  }, 0);

  // Risk contribution
  const riskContributions = positions.map((p, i) => {
    const sd = stockDataMap.get(p.ticker)!;
    let marginal = 0;
    positions.forEach((q, j) => {
      const sdq = stockDataMap.get(q.ticker)!;
      marginal += q.weight * matrix[i][j] * sdq.annualVolatility;
    });
    return { ticker: p.ticker, riskContribution: p.weight * sd.annualVolatility * marginal, pct: 0 };
  });
  const totalRisk = riskContributions.reduce((s, r) => s + r.riskContribution, 0);
  riskContributions.forEach(r => { r.pct = totalRisk > 0 ? (r.riskContribution / totalRisk) * 100 : 0; });
  riskContributions.sort((a, b) => b.pct - a.pct);

  // Factor vulnerabilities
  const factorVulnerabilities = positions.map(p => {
    const sd = stockDataMap.get(p.ticker)!;
    return { ticker: p.ticker, ...sd.riskFactors };
  });
  let maxIR = { ticker: "", score: 0 }, maxReg = { ticker: "", score: 0 }, maxSC = { ticker: "", score: 0 };
  positions.forEach(p => {
    const sd = stockDataMap.get(p.ticker)!;
    const ir = sd.riskFactors.interestRate * p.weight;
    const reg = sd.riskFactors.regulatory * p.weight;
    const sc = sd.riskFactors.singleCustomer * p.weight;
    if (ir > maxIR.score) maxIR = { ticker: p.ticker, score: ir };
    if (reg > maxReg.score) maxReg = { ticker: p.ticker, score: reg };
    if (sc > maxSC.score) maxSC = { ticker: p.ticker, score: sc };
  });

  // Beta analysis
  const betas = positions.map(p => {
    const sd = stockDataMap.get(p.ticker)!;
    return { ticker: p.ticker, beta: sd.beta, weightedBeta: sd.beta * p.weight };
  });
  const portfolioBeta = betas.reduce((s, b) => s + b.weightedBeta, 0);

  // Technical analysis - calculated on the fly from raw FMP data
  const technicalPositions = positions.map(p => ({ p, sd: stockDataMap.get(p.ticker)! }));
  
  // Moving average analysis (calculated from sma50/sma200 vs current price)
  const aboveSMA50 = technicalPositions
    .filter(({ sd }) => {
      const diff = calcPriceToSMA50(sd);
      return diff !== null && diff > 0;
    })
    .map(({ p }) => p.ticker);
  const aboveSMA200 = technicalPositions
    .filter(({ sd }) => {
      const diff = calcPriceToSMA200(sd);
      return diff !== null && diff > 0;
    })
    .map(({ p }) => p.ticker);
  
  // 52-week high/low analysis (calculated from yearHigh/yearLow vs current price)
  const nearYearHigh = technicalPositions
    .filter(({ sd }) => calcPriceToYearHigh(sd) > -5) // within 5% of 52-week high
    .map(({ p }) => p.ticker);
  const nearYearLow = technicalPositions
    .filter(({ sd }) => calcPriceToYearLow(sd) < 20) // within 20% of 52-week low
    .map(({ p }) => p.ticker);
  
  // Detailed SMA analysis for each position (with calculated percentages)
  const smaAnalysis = technicalPositions.map(({ p, sd }) => ({
    ticker: p.ticker,
    sector: sd.sector,
    industry: sd.industry,
    sma50: sd.sma50,
    sma200: sd.sma200,
    priceToSMA50: calcPriceToSMA50(sd),
    priceToSMA200: calcPriceToSMA200(sd),
  }));
  
  // Year high/low analysis for each position (with calculated percentages)
  const yearHighLowAnalysis = technicalPositions.map(({ p, sd }) => ({
    ticker: p.ticker,
    priceToYearHigh: calcPriceToYearHigh(sd),
    priceToYearLow: calcPriceToYearLow(sd),
  }));
  
  const technicalAnalysis = {
    aboveSMA50,
    aboveSMA200,
    nearYearHigh,
    nearYearLow,
    smaAnalysis,
    yearHighLowAnalysis,
  };

  // Diversification score
  const uniqueSectors = new Set(positions.map(p => p.sector)).size;
  const uniqueGroups = new Set(positions.map(p => stockDataMap.get(p.ticker)!.selloffGroup)).size;
  const maxSectorPct = sectorBreakdown.length > 0 ? Math.max(...sectorBreakdown.map(s => s.pct)) : 0;
  const avgCorrelation = highRiskPairs.length > 0
    ? highRiskPairs.reduce((s, p) => s + p.correlation, 0) / highRiskPairs.length : 0.3;
  const diversificationScore = Math.round(
    Math.min(uniqueSectors / 6, 1) * 25 +
    Math.min(uniqueGroups / 5, 1) * 20 +
    Math.max(0, (100 - maxSectorPct) / 70) * 25 +
    Math.max(0, 1 - avgCorrelation) * 20 +
    Math.min(positions.length / 10, 1) * 10
  );

  // Trim recommendations
  const trimRecommendations: string[] = [];
  let diversificationAdvice = "";
  if (diversificationScore < 70) {
    const sectorCounts = new Map<string, PositionAnalysis[]>();
    positions.forEach(p => {
      const arr = sectorCounts.get(p.sector) || [];
      arr.push(p);
      sectorCounts.set(p.sector, arr);
    });
    const overweight = Array.from(sectorCounts.entries())
      .filter(([, ps]) => ps.length >= 2)
      .sort((a, b) => b[1].length - a[1].length);
    const candidates: PositionAnalysis[] = [];
    for (const [, ps] of overweight) {
      const sorted = [...ps].sort((a, b) => a.marketValue - b.marketValue);
      if (sorted.length > 0 && candidates.length < 2) candidates.push(sorted[0]);
    }
    if (candidates.length < 2 && highRiskPairs.length > 0) {
      const pair = highRiskPairs[0];
      const p1 = positions.find(p => p.ticker === pair.ticker1);
      const p2 = positions.find(p => p.ticker === pair.ticker2);
      if (p1 && !candidates.find(c => c.ticker === p1.ticker)) candidates.push(p1);
      if (p2 && candidates.length < 2 && !candidates.find(c => c.ticker === p2.ticker)) candidates.push(p2);
    }
    trimRecommendations.push(...candidates.slice(0, 2).map(c => c.ticker));
    const missingSectors = ["Healthcare", "Consumer Defensive", "Energy", "Utilities", "Real Estate", "Materials", "Industrials"]
      .filter(s => !sectorMap.has(s));
    const suggestedCN = missingSectors.slice(0, 2).map(s => SECTOR_CN[s] || s);
    diversificationAdvice = trimRecommendations.length > 0
      ? `建议减持 ${trimRecommendations.join(" 和 ")}，改为配置${suggestedCN.length > 0 ? `${suggestedCN.join("、")}等行业的标的` : "不同行业/风格的标的"}，以在保持投资逻辑不变的前提下提升分散化水平。`
      : "";
  }

  return {
    totalValue, totalCost,
    totalPnL: totalValue - totalCost,
    totalPnLPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    positions, 
    correlationMatrix: { tickers, matrix }, 
    industryCorrelationMatrix: { tickers, matrix: industryMatrix, industries },
    highRiskPairs,
    industryHighRiskPairs,
    selloffGroups, 
    industryBreakdown,
    sectorBreakdown, 
    drawdowns,
    portfolioDrawdown2022, portfolioDrawdown2020,
    riskContributions, topRiskPosition: riskContributions[0]?.ticker ?? "",
    factorVulnerabilities,
    mostVulnerable: { interestRate: maxIR.ticker, regulatory: maxReg.ticker, singleCustomer: maxSC.ticker },
    betas, portfolioBeta, technicalAnalysis, diversificationScore, trimRecommendations, diversificationAdvice,
  };
}
