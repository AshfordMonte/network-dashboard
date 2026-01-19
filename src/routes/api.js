// src/routes/api.js (CommonJS)
const express = require("express");
const {
  getCustomerEquipmentSummary,
  getDownCustomers,
  getWarningCustomers,
} = require("../services/sonarService");

const router = express.Router();

// Simple helper cache factory
function makeCache(ttlMs) {
  return { ttlMs, ts: 0, value: null };
}
function cacheFresh(cache) {
  return cache.value && Date.now() - cache.ts < cache.ttlMs;
}

// ---- /api/status-summary ----
const summaryCache = makeCache(60_000);

router.get("/status-summary", async (req, res) => {
  try {
    if (cacheFresh(summaryCache)) {
      return res.json({ ok: true, source: "cache", summary: summaryCache.value });
    }

    const customer = await getCustomerEquipmentSummary();

    const payload = {
      infrastructureEquipment: { good: 0, warning: 0, bad: 0, down: 0 },
      customerEquipment: customer.customerEquipment,
    };

    summaryCache.ts = Date.now();
    summaryCache.value = payload;

    res.json({ ok: true, source: "sonar", summary: payload });
  } catch (err) {
    console.error("Status summary error:", err);
    res.status(200).json({
      ok: false,
      source: "error",
      error: err.message,
      summary: {
        infrastructureEquipment: { good: 0, warning: 0, bad: 0, down: 0 },
        customerEquipment: { good: 0, warning: 0, bad: 0, down: 0, total: 0 },
      },
    });
  }
});

// ---- /api/down-customers ----
const downCache = makeCache(60_000);

router.get("/down-customers", async (req, res) => {
  try {
    if (cacheFresh(downCache)) {
      return res.json({ ok: true, source: "cache", customers: downCache.value });
    }

    const customers = await getDownCustomers();

    downCache.ts = Date.now();
    downCache.value = customers;

    res.json({ ok: true, source: "sonar", customers });
  } catch (err) {
    console.error("Down customers error:", err);
    res.status(200).json({ ok: false, source: "error", error: err.message, customers: [] });
  }
});

// ---- /api/warning-customers ----
const warningCache = makeCache(60_000);

router.get("/warning-customers", async (req, res) => {
  try {
    if (cacheFresh(warningCache)) {
      return res.json({ ok: true, source: "cache", customers: warningCache.value });
    }

    const customers = await getWarningCustomers();

    warningCache.ts = Date.now();
    warningCache.value = customers;

    res.json({ ok: true, source: "sonar", customers });
  } catch (err) {
    console.error("Warning customers error:", err);
    res.status(200).json({ ok: false, source: "error", error: err.message, customers: [] });
  }
});

module.exports = router;
