import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertHoldingSchema, updateHoldingSchema } from "@shared/schema";
import { fetchFMPQuote, fetchFMPQuoteSmart, checkFMPStatus } from "./fmpData";

export function registerRoutes(server: Server, app: Express) {
  // Get all holdings
  app.get("/api/holdings", (_req, res) => {
    const all = storage.getHoldings();
    res.json(all);
  });

  // Create a holding — fetches live data from FMP
  app.post("/api/holdings", async (req, res) => {
    const parsed = insertHoldingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const quote = await fetchFMPQuote(parsed.data.ticker);
    const holding = storage.createHolding(parsed.data, quote);
    res.status(201).json(holding);
  });

  // Update a holding — updates shares and costBasis, then refreshes quote data
  app.put("/api/holdings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const parsed = updateHoldingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // First update shares/costBasis
    const updated = storage.updateHoldingData(id, parsed.data);
    if (!updated) return res.status(404).json({ error: "Not found" });

    // Then refresh quote data including technical indicators
    const quote = await fetchFMPQuote(updated.ticker);
    if (quote && quote.price > 0) {
      const refreshed = storage.updateQuoteData(id, quote);
      if (refreshed) {
        return res.json(refreshed);
      }
    }

    res.json(updated);
  });

  // Delete a holding
  app.delete("/api/holdings/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const deleted = storage.deleteHolding(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  });

  // Refresh all holdings — re-fetches live data from FMP for every ticker
  app.post("/api/refresh", async (_req, res) => {
    const holdings = storage.getHoldings();
    const results: { ticker: string; success: boolean; price?: number; pe?: number }[] = [];

    for (const h of holdings) {
      const quote = await fetchFMPQuote(h.ticker);
      if (quote && quote.price > 0) {
        storage.updateQuoteData(h.id, quote);
        results.push({ ticker: h.ticker, success: true, price: quote.price, pe: quote.pe });
      } else {
        results.push({ ticker: h.ticker, success: false });
      }
      // Small delay to avoid rate limiting (FMP free tier: 5 calls/minute)
      if (holdings.indexOf(h) < holdings.length - 1) {
        await new Promise(r => setTimeout(r, 15000)); // 15 seconds between calls
      }
    }

    // Return updated holdings
    const updated = storage.getHoldings();
    res.json({ holdings: updated, results });
  });

  // Refresh single holding — smart profile refresh based on 3-day rule
  app.post("/api/holdings/:id/refresh", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const holding = storage.getHolding(id);
    if (!holding) return res.status(404).json({ error: "Not found" });

    // Smart fetch: will refresh profile only if lastUpdatedProfile is empty or > 3 days
    const quote = await fetchFMPQuoteSmart(holding.ticker, holding.lastUpdatedProfile);
    if (!quote || quote.price <= 0) {
      return res.status(502).json({ error: "Failed to fetch quote from FMP" });
    }

    const updated = storage.updateQuoteData(id, quote);
    if (!updated) return res.status(500).json({ error: "Failed to update holding" });

    res.json({ ...updated, profileUpdated: quote.profileUpdated });
  });

  // Check FMP API status
  app.get("/api/status", async (_req, res) => {
    const status = await checkFMPStatus();
    res.json({
      fmp: status,
      timestamp: new Date().toISOString(),
    });
  });
}
