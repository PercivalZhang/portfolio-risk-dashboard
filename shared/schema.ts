import { z } from "zod";

// Analyst grades data
export interface Grades {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' | 'N/A';
  lastUpdated: string;
}

// Holding with live market data stored locally
export interface Holding {
  id: number;
  ticker: string;
  shares: number;
  costBasis: number;
  // Live data from FMP (populated on add/refresh)
  currentPrice: number;
  change?: number; // Price change
  changePercentage?: number; // Price change percentage
  name: string;
  sector: string;
  industry?: string; // Optional, may be populated from FMP
  beta: number;
  yearHigh: number; // 52-week high
  yearLow: number; // 52-week low
  dayLow?: number; // Day's low
  dayHigh?: number; // Day's high
  sma50?: number; // 50-day Simple Moving Average (priceAvg50 from FMP)
  sma200?: number; // 200-day Simple Moving Average (priceAvg200 from FMP)
  marketCap?: number; // Optional, may not be available in all data sources
  logo?: string; // Company logo URL from FMP profile
  grades?: Grades; // Analyst consensus grades
  lastUpdated: string; // ISO timestamp for price data
  lastUpdatedProfile?: string; // ISO timestamp for profile data (industry/sector/beta/logo)
}

export const insertHoldingSchema = z.object({
  ticker: z.string().min(1).max(10).transform(v => v.toUpperCase().trim()),
  shares: z.number().positive(),
  costBasis: z.number().positive(),
});

export type InsertHolding = z.infer<typeof insertHoldingSchema>;

// Schema for updating holding - only shares and costBasis can be modified
export const updateHoldingSchema = z.object({
  shares: z.number().positive(),
  costBasis: z.number().positive(),
});

export type UpdateHolding = z.infer<typeof updateHoldingSchema>;
