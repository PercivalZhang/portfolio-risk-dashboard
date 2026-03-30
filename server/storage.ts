import { type Holding, type InsertHolding, type UpdateHolding } from "@shared/schema";
import type { FMPQuoteData } from "./fmpData";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const HOLDINGS_FILE = path.join(DATA_DIR, "holdings.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readHoldings(): Holding[] {
  ensureDataDir();
  if (!fs.existsSync(HOLDINGS_FILE)) {
    fs.writeFileSync(HOLDINGS_FILE, "[]", "utf-8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(HOLDINGS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeHoldings(holdings: Holding[]) {
  ensureDataDir();
  fs.writeFileSync(HOLDINGS_FILE, JSON.stringify(holdings, null, 2), "utf-8");
}

function getNextId(holdings: Holding[]): number {
  if (holdings.length === 0) return 1;
  return Math.max(...holdings.map(h => h.id)) + 1;
}

export interface IStorage {
  getHoldings(): Holding[];
  getHolding(id: number): Holding | undefined;
  createHolding(data: InsertHolding, quote: FMPQuoteData | null): Holding;
  updateHolding(id: number, data: InsertHolding, quote: FMPQuoteData | null): Holding | undefined;
  updateHoldingData(id: number, data: UpdateHolding): Holding | undefined;
  updateQuoteData(id: number, quote: FMPQuoteData): Holding | undefined;
  deleteHolding(id: number): boolean;
}

export class JsonFileStorage implements IStorage {
  getHoldings(): Holding[] {
    return readHoldings();
  }

  getHolding(id: number): Holding | undefined {
    return readHoldings().find(h => h.id === id);
  }

  createHolding(data: InsertHolding, quote: FMPQuoteData | null): Holding {
    const holdings = readHoldings();
    const newHolding: Holding = {
      id: getNextId(holdings),
      ticker: data.ticker,
      shares: data.shares,
      costBasis: data.costBasis,
      currentPrice: quote?.price ?? 0,
      change: quote?.change,
      changePercentage: quote?.changePercentage,
      name: quote?.name ?? data.ticker,
      sector: quote?.sector ?? "",
      industry: quote?.industry ?? "",
      beta: quote?.beta ?? 1.0,
      yearHigh: quote?.yearHigh ?? 0,
      yearLow: quote?.yearLow ?? 0,
      dayLow: quote?.dayLow,
      dayHigh: quote?.dayHigh,
      sma50: quote?.sma50,
      sma200: quote?.sma200,
      marketCap: quote?.marketCap,
      logo: quote?.logo,
      grades: quote?.grades ? {
        strongBuy: quote.grades.strongBuy,
        buy: quote.grades.buy,
        hold: quote.grades.hold,
        sell: quote.grades.sell,
        strongSell: quote.grades.strongSell,
        consensus: quote.grades.consensus,
        lastUpdated: new Date().toISOString(),
      } : undefined,
      lastUpdated: new Date().toISOString(),
      lastUpdatedProfile: quote?.profileUpdated ? new Date().toISOString() : undefined,
    };
    holdings.push(newHolding);
    writeHoldings(holdings);
    return newHolding;
  }

  updateHolding(id: number, data: InsertHolding, quote: FMPQuoteData | null): Holding | undefined {
    const holdings = readHoldings();
    const index = holdings.findIndex(h => h.id === id);
    if (index === -1) return undefined;
    const existing = holdings[index];
    holdings[index] = {
      id,
      ticker: data.ticker,
      shares: data.shares,
      costBasis: data.costBasis,
      currentPrice: quote?.price ?? existing.currentPrice,
      change: quote?.change ?? existing.change,
      changePercentage: quote?.changePercentage ?? existing.changePercentage,
      name: quote?.name ?? existing.name,
      sector: quote?.sector ?? existing.sector,
      industry: quote?.industry ?? existing.industry,
      beta: quote?.beta ?? existing.beta,
      yearHigh: quote?.yearHigh ?? existing.yearHigh,
      yearLow: quote?.yearLow ?? existing.yearLow,
      dayLow: quote?.dayLow ?? existing.dayLow,
      dayHigh: quote?.dayHigh ?? existing.dayHigh,
      sma50: quote?.sma50 ?? existing.sma50,
      sma200: quote?.sma200 ?? existing.sma200,
      marketCap: quote?.marketCap ?? existing.marketCap,
      logo: quote?.logo ?? existing.logo,
      grades: quote?.grades ? {
        strongBuy: quote.grades.strongBuy,
        buy: quote.grades.buy,
        hold: quote.grades.hold,
        sell: quote.grades.sell,
        strongSell: quote.grades.strongSell,
        consensus: quote.grades.consensus,
        lastUpdated: new Date().toISOString(),
      } : existing.grades,
      lastUpdated: new Date().toISOString(),
      lastUpdatedProfile: quote?.profileUpdated ? new Date().toISOString() : existing.lastUpdatedProfile,
    };
    writeHoldings(holdings);
    return holdings[index];
  }

  updateHoldingData(id: number, data: UpdateHolding): Holding | undefined {
    const holdings = readHoldings();
    const index = holdings.findIndex(h => h.id === id);
    if (index === -1) return undefined;
    holdings[index].shares = data.shares;
    holdings[index].costBasis = data.costBasis;
    holdings[index].lastUpdated = new Date().toISOString();
    writeHoldings(holdings);
    return holdings[index];
  }

  updateQuoteData(id: number, quote: FMPQuoteData): Holding | undefined {
    const holdings = readHoldings();
    const index = holdings.findIndex(h => h.id === id);
    if (index === -1) return undefined;
    holdings[index].currentPrice = quote.price;
    holdings[index].change = quote.change ?? holdings[index].change;
    holdings[index].changePercentage = quote.changePercentage ?? holdings[index].changePercentage;
    holdings[index].name = quote.name || holdings[index].name;
    holdings[index].sector = quote.sector || holdings[index].sector;
    holdings[index].industry = quote.industry || holdings[index].industry;
    holdings[index].beta = quote.beta || holdings[index].beta;
    holdings[index].yearHigh = quote.yearHigh || holdings[index].yearHigh;
    holdings[index].yearLow = quote.yearLow || holdings[index].yearLow;
    holdings[index].dayLow = quote.dayLow ?? holdings[index].dayLow;
    holdings[index].dayHigh = quote.dayHigh ?? holdings[index].dayHigh;
    holdings[index].sma50 = quote.sma50 ?? holdings[index].sma50;
    holdings[index].sma200 = quote.sma200 ?? holdings[index].sma200;
    holdings[index].marketCap = quote.marketCap ?? holdings[index].marketCap;
    holdings[index].logo = quote.logo ?? holdings[index].logo;
    if (quote.grades) {
      holdings[index].grades = {
        strongBuy: quote.grades.strongBuy,
        buy: quote.grades.buy,
        hold: quote.grades.hold,
        sell: quote.grades.sell,
        strongSell: quote.grades.strongSell,
        consensus: quote.grades.consensus,
        lastUpdated: new Date().toISOString(),
      };
    }
    holdings[index].lastUpdated = new Date().toISOString();
    if (quote.profileUpdated) {
      holdings[index].lastUpdatedProfile = new Date().toISOString();
    }
    writeHoldings(holdings);
    return holdings[index];
  }

  deleteHolding(id: number): boolean {
    const holdings = readHoldings();
    const index = holdings.findIndex(h => h.id === id);
    if (index === -1) return false;
    holdings.splice(index, 1);
    writeHoldings(holdings);
    return true;
  }
}

export const storage = new JsonFileStorage();
