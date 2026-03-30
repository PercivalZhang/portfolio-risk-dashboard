// Built-in metadata for popular US stocks (sector, industry, beta)
// Used as fallback when API doesn't provide sector/beta data

interface StockMeta {
  sector: string;
  industry: string;
  beta: number;
}

const META: Record<string, StockMeta> = {
  // Big Tech
  AAPL: { sector: "Technology", industry: "Consumer Electronics", beta: 1.12 },
  MSFT: { sector: "Technology", industry: "Software - Infrastructure", beta: 1.05 },
  GOOGL: { sector: "Communication Services", industry: "Internet Content & Information", beta: 1.11 },
  GOOG: { sector: "Communication Services", industry: "Internet Content & Information", beta: 1.11 },
  AMZN: { sector: "Consumer Cyclical", industry: "Specialty Retail", beta: 1.18 },
  META: { sector: "Communication Services", industry: "Internet Content & Information", beta: 1.32 },
  NVDA: { sector: "Technology", industry: "Semiconductors", beta: 1.72 },
  TSLA: { sector: "Consumer Cyclical", industry: "Auto - Manufacturers", beta: 1.95 },
  // Financials
  JPM: { sector: "Financial Services", industry: "Banks - Diversified", beta: 1.08 },
  BAC: { sector: "Financial Services", industry: "Banks - Diversified", beta: 1.35 },
  GS: { sector: "Financial Services", industry: "Financial - Capital Markets", beta: 1.38 },
  V: { sector: "Financial Services", industry: "Financial - Credit Services", beta: 0.95 },
  MA: { sector: "Financial Services", industry: "Financial - Credit Services", beta: 1.02 },
  "BRK-B": { sector: "Financial Services", industry: "Insurance - Diversified", beta: 0.55 },
  BRK: { sector: "Financial Services", industry: "Insurance - Diversified", beta: 0.55 },
  SOFI: { sector: "Financial Services", industry: "Credit Services", beta: 2.26 },
  PYPL: { sector: "Financial Services", industry: "Credit Services", beta: 1.45 },
  C: { sector: "Financial Services", industry: "Banks - Diversified", beta: 1.30 },
  WFC: { sector: "Financial Services", industry: "Banks - Diversified", beta: 1.15 },
  // Healthcare
  JNJ: { sector: "Healthcare", industry: "Drug Manufacturers - General", beta: 0.55 },
  UNH: { sector: "Healthcare", industry: "Medical - Healthcare Plans", beta: 0.72 },
  PFE: { sector: "Healthcare", industry: "Drug Manufacturers - General", beta: 0.65 },
  LLY: { sector: "Healthcare", industry: "Drug Manufacturers - General", beta: 0.45 },
  ABBV: { sector: "Healthcare", industry: "Drug Manufacturers - General", beta: 0.58 },
  MRK: { sector: "Healthcare", industry: "Drug Manufacturers - General", beta: 0.40 },
  // Energy
  XOM: { sector: "Energy", industry: "Oil & Gas Integrated", beta: 0.85 },
  CVX: { sector: "Energy", industry: "Oil & Gas Integrated", beta: 0.90 },
  // Consumer Defensive
  WMT: { sector: "Consumer Defensive", industry: "Discount Stores", beta: 0.52 },
  PG: { sector: "Consumer Defensive", industry: "Household & Personal Products", beta: 0.45 },
  KO: { sector: "Consumer Defensive", industry: "Beverages - Non-Alcoholic", beta: 0.58 },
  COST: { sector: "Consumer Defensive", industry: "Discount Stores", beta: 0.72 },
  PEP: { sector: "Consumer Defensive", industry: "Beverages - Non-Alcoholic", beta: 0.55 },
  // Communication / Entertainment
  DIS: { sector: "Communication Services", industry: "Entertainment", beta: 1.15 },
  NFLX: { sector: "Communication Services", industry: "Entertainment", beta: 1.28 },
  // Tech — Software / SaaS
  CRM: { sector: "Technology", industry: "Software - Application", beta: 1.18 },
  ORCL: { sector: "Technology", industry: "Software - Infrastructure", beta: 0.95 },
  ADBE: { sector: "Technology", industry: "Software - Infrastructure", beta: 1.25 },
  // Semiconductors
  AMD: { sector: "Technology", industry: "Semiconductors", beta: 1.65 },
  INTC: { sector: "Technology", industry: "Semiconductors", beta: 1.02 },
  AVGO: { sector: "Technology", industry: "Semiconductors", beta: 1.22 },
  QCOM: { sector: "Technology", industry: "Semiconductors", beta: 1.30 },
  TSM: { sector: "Technology", industry: "Semiconductors", beta: 1.15 },
  MU: { sector: "Technology", industry: "Semiconductors", beta: 1.40 },
  // Others
  UBER: { sector: "Technology", industry: "Software - Application", beta: 1.45 },
  ABNB: { sector: "Consumer Cyclical", industry: "Travel Services", beta: 1.50 },
  SQ: { sector: "Technology", industry: "Software - Infrastructure", beta: 2.10 },
  SHOP: { sector: "Technology", industry: "Software - Application", beta: 2.00 },
  COIN: { sector: "Financial Services", industry: "Financial Data & Stock Exchanges", beta: 3.20 },
  PLTR: { sector: "Technology", industry: "Software - Infrastructure", beta: 2.10 },
  NIO: { sector: "Consumer Cyclical", industry: "Auto - Manufacturers", beta: 1.80 },
  BABA: { sector: "Consumer Cyclical", industry: "Internet Retail", beta: 0.75 },
  PDD: { sector: "Consumer Cyclical", industry: "Internet Retail", beta: 1.10 },
  JD: { sector: "Consumer Cyclical", industry: "Internet Retail", beta: 0.80 },
  BIDU: { sector: "Communication Services", industry: "Internet Content & Information", beta: 0.85 },
  T: { sector: "Communication Services", industry: "Telecom Services", beta: 0.70 },
  VZ: { sector: "Communication Services", industry: "Telecom Services", beta: 0.40 },
  BA: { sector: "Industrials", industry: "Aerospace & Defense", beta: 1.50 },
  CAT: { sector: "Industrials", industry: "Farm & Heavy Construction Machinery", beta: 1.00 },
  HD: { sector: "Consumer Cyclical", industry: "Home Improvement Retail", beta: 1.05 },
  NKE: { sector: "Consumer Cyclical", industry: "Footwear & Accessories", beta: 1.10 },
  SBUX: { sector: "Consumer Cyclical", industry: "Restaurants", beta: 0.90 },
  MCD: { sector: "Consumer Cyclical", industry: "Restaurants", beta: 0.65 },
};

export function getStockMeta(ticker: string): StockMeta | null {
  return META[ticker.toUpperCase()] || null;
}
