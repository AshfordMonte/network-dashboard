/**
 * Frontend logic:
 * - Calls GET /api/status-summary (once your server exists)
 * - Falls back to mock data if the endpoint isn't available yet
 * - Updates tile numbers
 * - Refreshes on an interval
 */

const REFRESH_MS = 60_000;

const el = (id) => document.getElementById(id);

const ui = {
  infra: {
    good: el("infra-good"),
    warning: el("infra-warning"),
    bad: el("infra-bad"),
    down: el("infra-down"),
  },
  cust: {
    good: el("cust-good"),
    warning: el("cust-warning"),
    uninventoried: el("cust-uninventoried"),
    down: el("cust-down"),
  },

  apiDot: el("api-dot"),
  apiStatus: el("api-status"),
  lastUpdated: el("last-updated"),
};

function fmt(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US");
}

function setApiState(state, message) {
  ui.apiDot.classList.remove("status__dot--ok", "status__dot--bad");

  if (state === "ok") ui.apiDot.classList.add("status__dot--ok");
  if (state === "bad") ui.apiDot.classList.add("status__dot--bad");

  ui.apiStatus.textContent = message;
}

function setLastUpdated(date = new Date()) {
  ui.lastUpdated.textContent = `Last updated: ${date.toLocaleString()}`;
}

function render(summary) {
  ui.infra.good.textContent = fmt(summary?.infrastructureEquipment?.good);
  ui.infra.warning.textContent = fmt(summary?.infrastructureEquipment?.warning);
  ui.infra.bad.textContent = fmt(summary?.infrastructureEquipment?.bad);
  ui.infra.down.textContent = fmt(summary?.infrastructureEquipment?.down);

  ui.cust.good.textContent = fmt(summary?.customerEquipment?.good);
  ui.cust.warning.textContent = fmt(summary?.customerEquipment?.warning);
  ui.cust.uninventoried.textContent = fmt(summary?.customerEquipment?.uninventoried);
  ui.cust.down.textContent = fmt(summary?.customerEquipment?.down);
}

/**
 * Mock data shaped like the backend will eventually return.
 * This matches your screenshot closely.
 */
function getMockSummary() {
  return {
    infrastructureEquipment: { good: 71, warning: 0, bad: 0, down: 58 },
    customerEquipment: { good: 1489, warning: 9, bad: 1, down: 71 },
  };
}

async function fetchSummary() {
  const res = await fetch("/api/status-summary", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json(); // { ok, source, summary, ... }
}

async function refresh() {
  try {
    const payload = await fetchSummary();
    render(payload.summary);

    if (payload.ok) {
      const label =
        payload.source === "cache"
          ? "API: Connected (cached)"
          : "API: Connected";
      setApiState("ok", label);
    } else {
      setApiState("bad", `API: Error (${payload.error || "unknown"})`);
    }

    setLastUpdated(new Date());
  } catch (err) {
    setApiState("bad", "API: Request failed");
    setLastUpdated(new Date());
  }
}

// Initial load + refresh loop
refresh();
setInterval(refresh, REFRESH_MS);
