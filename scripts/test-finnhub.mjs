import fs from "node:fs";
import { Agent } from "undici";

const path = ".env.local";
if (!fs.existsSync(path)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const text = fs.readFileSync(path, "utf8").replaceAll("\r\n", "\n");

/** @param {string} name */
const get = (name) => {
  const line = text.split("\n").find((l) => new RegExp(`^\\s*${name}\\s*=`).test(l));
  if (!line) return undefined;
  return line.replace(new RegExp(`^\\s*${name}\\s*=\\s*`), "").trim().replace(/^["']|["']$/g, "");
};

const key = get("FINNHUB_API_KEY");
if (!key) {
  console.error("FINNHUB_API_KEY missing");
  process.exit(1);
}

const tlsRaw = get("FINNHUB_TLS_INSECURE");
const tlsInsecure = tlsRaw === "1" || tlsRaw === "true";
const dispatcher = tlsInsecure ? new Agent({ connect: { rejectUnauthorized: false } }) : undefined;
if (dispatcher) console.warn("Using FINNHUB_TLS_INSECURE (TLS verify off) for this test");

const url = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${encodeURIComponent(key)}`;
/** @type {import('undici').RequestInit} */
const init = { headers: { accept: "application/json" } };
if (dispatcher) Object.assign(init, { dispatcher });

const res = await fetch(url, init);
const body = await res.text();
console.log("HTTP", res.status, res.statusText);
console.log(body.slice(0, 400));
