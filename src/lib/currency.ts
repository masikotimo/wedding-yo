export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'UGX', symbol: 'UGX', name: 'Ugandan Shilling' },
  { code: 'KES', symbol: 'KES', name: 'Kenyan Shilling' },
  { code: 'TZS', symbol: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export function formatCurrency(amount: number | null | undefined, currencyCode: string = 'USD'): string {
  // Handle null or undefined values
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  const currency = CURRENCIES.find(c => c.code === currencyCode);

  if (!currency) {
    return `${amount.toFixed(2)}`;
  }

  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${currency.symbol}${formattedAmount}`;
}

export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || '$';
}
