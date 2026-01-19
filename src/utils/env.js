// src/utils/env.js

//Validation for env variables
function getEnvInt(name) {
  const v = process.env[name];
  if (v === undefined || v === "") return null;

  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env`);
  return v;
}

module.exports = { getEnvInt, requireEnv };
