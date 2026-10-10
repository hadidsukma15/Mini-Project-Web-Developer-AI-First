export function formatPrice(amount, market) {
  const value = amount * market.rate;
  const number = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  if (market.currency === 'USD') return `US$${number}`;

  const prefixes = {
    EUR: '€',
    GBP: '£',
    PLN: 'zł ',
    DKK: 'kr ',
    NOK: 'kr ',
    SEK: 'kr ',
  };
  return `${prefixes[market.currency] ?? `${market.currency} `}${number}`;
}
