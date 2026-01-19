// src/utils/normalize.js

//Cleans up messy api results from Sonar
function pickCount(node) {
  return node?.page_info?.total_count ?? 0;
}

function uniqStrings(list) {
  const out = [];
  const seen = new Set();
  for (const v of list || []) {
    const s = String(v || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function firstNonEmpty(list) {
  for (const v of list || []) {
    const s = String(v || "").trim();
    if (s) return s;
  }
  return "";
}

module.exports = { pickCount, uniqStrings, firstNonEmpty };
