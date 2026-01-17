// server.js (CommonJS)
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const os = require("os");
const { sonarGraphqlRequest } = require("./sonarClient");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// ---- Sonar Query (Customer Equipment Status Totals) ----
const FULL_LIST_QUERY = `
query full_list($companyId: Int64Bit, $accountStatusID: Int64Bit) {
  total: accounts(company_id: $companyId, account_status_id: $accountStatusID) {
    page_info { total_count }
  }
  good: accounts(
    company_id: $companyId
    account_status_id: $accountStatusID
    reverse_relation_filters: [
      { relation: "addresses.inventory_items"
        search: { string_fields: [{ attribute: "icmp_device_status", search_value: "Good", match: true }] }
      }
    ]
  ) { page_info { total_count } }

  down: accounts(
    company_id: $companyId
    account_status_id: $accountStatusID
    reverse_relation_filters: [
      { relation: "addresses.inventory_items"
        search: { string_fields: [{ attribute: "icmp_device_status", search_value: "Down", match: true }] }
      }
    ]
  ) { page_info { total_count } }

  warning: accounts(
    company_id: $companyId
    account_status_id: $accountStatusID
    reverse_relation_filters: [
      { relation: "addresses.inventory_items"
        search: { string_fields: [{ attribute: "icmp_device_status", search_value: "Warning", match: true }] }
      }
    ]
  ) { page_info { total_count } }

  uninventoried_only: accounts(
    company_id: $companyId
    account_status_id: $accountStatusID
    reverse_relation_filters: [
      { relation: "uninventoried_mac_addresses", search: { exists: ["mac_address"] } },
      { relation: "addresses.inventory_items", search: { exists: ["icmp_device_status"] }, is_empty: true }
    ]
  ) { page_info { total_count } }
}
`;

// Small cache to avoid hammering Sonar
const CACHE_MS = 15_000;
let cache = { ts: 0, payload: null };

function getEnvInt(name) {
  const v = process.env[name];
  if (v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickCount(node) {
  return node?.page_info?.total_count ?? 0;
}

async function getCustomerEquipmentSummary() {
  const endpoint = process.env.SONAR_ENDPOINT;
  const token = process.env.SONAR_TOKEN;

  if (!endpoint || !token) {
    throw new Error("Missing SONAR_ENDPOINT or SONAR_TOKEN in .env");
  }

  // Optional filters you can set in .env
  const companyId = getEnvInt("SONAR_COMPANY_ID"); // optional
  const accountStatusID = getEnvInt("SONAR_ACCOUNT_STATUS_ID"); // optional

  const variables = {
    companyId: companyId ?? null,
    accountStatusID: accountStatusID ?? null,
  };

  const data = await sonarGraphqlRequest({
    endpoint,
    token,
    query: FULL_LIST_QUERY,
    variables,
  });

  // Map Sonar response -> dashboard shape
  const total = pickCount(data.total);
  const good = pickCount(data.good);
  const warning = pickCount(data.warning);
  const down = pickCount(data.down);
  const uninventoried = pickCount(data.uninventoried_only);

  return { customerEquipment: { good, warning, uninventoried, down, total } };
}

app.get("/api/status-summary", async (req, res) => {
  try {
    // cache hit
    const now = Date.now();
    if (cache.payload && now - cache.ts < CACHE_MS) {
      return res.json({ ok: true, source: "cache", summary: cache.payload });
    }

    const customer = await getCustomerEquipmentSummary();

    // You can add infra later; for now send zeros so UI is stable
    const payload = {
      infrastructureEquipment: { good: 0, warning: 0, bad: 0, down: 0 },
      customerEquipment: customer.customerEquipment,
    };

    cache = { ts: now, payload };
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

function getLocalIPs() {
  const nets = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-IPv4
      if (net.family === "IPv4" && !net.internal) {
        results.push(net.address);
      }
    }
  }

  return results;
}

app.listen(PORT, HOST, () => {
  const ips = getLocalIPs();

  if (ips.length === 0) {
    console.log("No external IPv4 addresses detected.");
  } else {
    console.log("LAN access:");
    ips.forEach(ip => {
      console.log(`  → http://${ip}:${PORT}`);
    });
  }
});

