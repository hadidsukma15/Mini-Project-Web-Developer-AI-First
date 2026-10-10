export const markets = [
  { code: 'US', country: 'United States', currency: 'USD', symbol: '$', rate: 1 },
  { code: 'GB', country: 'United Kingdom', currency: 'GBP', symbol: '£', rate: 0.79 },
  { code: 'AT', country: 'Austria', currency: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'BE', country: 'Belgium', currency: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'DK', country: 'Denmark', currency: 'DKK', symbol: 'kr', rate: 6.87 },
  { code: 'FI', country: 'Finland', currency: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'FR', country: 'France', currency: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'DE', country: 'Germany', currency: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'IE', country: 'Ireland', currency: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'IT', country: 'Italy', currency: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'NL', country: 'Netherlands', currency: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'NO', country: 'Norway', currency: 'NOK', symbol: 'kr', rate: 10.6 },
  { code: 'PL', country: 'Poland', currency: 'PLN', symbol: 'zł', rate: 3.95 },
  { code: 'ES', country: 'Spain', currency: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'SE', country: 'Sweden', currency: 'SEK', symbol: 'kr', rate: 10.5 },
];

export function getMarket(code) {
  return markets.find((m) => m.code === code) ?? markets[0];
}
