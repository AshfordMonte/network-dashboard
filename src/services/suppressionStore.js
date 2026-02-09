const fs = require("fs");
const path = require("path");

// Where we store the suppression list on disk.
const DATA_PATH = path.resolve(__dirname, "../../data/suppressions.json");

let suppressedAccounts = new Set();

// Load suppression data from disk into memory.
function load() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify({ accounts: [] }, null, 2));
  }

  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  suppressedAccounts = new Set((raw.accounts || []).map(String));
}

// Persist the in-memory set back to disk.
function save() {
  fs.writeFileSync(
    DATA_PATH,
    JSON.stringify({ accounts: [...suppressedAccounts] }, null, 2)
  );
}

// Return the live suppression set.
function getSuppressedAccounts() {
  return suppressedAccounts;
}

// Add an account ID to suppressions.
function suppressAccount(id) {
  suppressedAccounts.add(String(id));
  save();
}

// Remove an account ID from suppressions.
function unsuppressAccount(id) {
  suppressedAccounts.delete(String(id));
  save();
}

// Load once at startup.
load();

module.exports = {
  getSuppressedAccounts,
  suppressAccount,
  unsuppressAccount
};
