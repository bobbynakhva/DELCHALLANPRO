/** Amount in words — Indian grouping (crore / lakh), for GST invoice grand total. */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function chunk99(n: number): string {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  const o = ONES[n % 10];
  return o ? `${t} ${o}` : t;
}

export function indianWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (crore) parts.push(`${chunk99(crore)} Crore`);
  if (lakh) parts.push(`${chunk99(lakh)} Lakh`);
  if (thousand) parts.push(`${chunk99(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(chunk99(rest));
  return parts.join(" ");
}

export function amountInWordsINR(paise: number): string {
  const sign = paise < 0 ? "Minus " : "";
  const abs = Math.abs(Math.round(paise));
  const rupees = Math.floor(abs / 100);
  const p = abs % 100;
  const head = `${sign}Rupees ${indianWords(rupees)}`;
  if (p === 0) return `${head} Only`;
  return `${head} and Paise ${indianWords(p)} Only`;
}

/** Indian grouping 12,34,567.89 for rupees (paise integer in). */
export function formatInrGrouped(paise: unknown): string {
  const v = typeof paise === "number" ? paise : Number(paise);
  const n = Number.isFinite(v) ? v : 0;
  const rupees = n / 100;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
  return `₹${formatted}`;
}
