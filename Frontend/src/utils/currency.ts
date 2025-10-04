// Currency conversion utilities using the provided APIs

export interface CurrencyRate {
  [currency: string]: number;
}

export interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: CurrencyRate;
}

/**
 * Fetch the latest exchange rates for a base currency
 * @param baseCurrency - The base currency code (e.g., 'USD', 'EUR')
 * @returns Promise with exchange rates
 */
export const fetchExchangeRates = async (baseCurrency: string): Promise<ExchangeRateResponse> => {
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency.toUpperCase()}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
};

/**
 * Convert amount from one currency to another
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Promise with converted amount
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  try {
    const rates = await fetchExchangeRates(fromCurrency);
    const rate = rates.conversion_rates[toCurrency.toUpperCase()];
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }
    
    return amount * rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error;
  }
};

/**
 * Format currency amount with proper symbol and locale
 * @param amount - Amount to format
 * @param currencyCode - Currency code
 * @param locale - Locale for formatting (defaults to 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string,
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount);
  } catch (error) {
    // Fallback formatting if currency is not supported
    return `${currencyCode.toUpperCase()} ${amount.toFixed(2)}`;
  }
};

/**
 * Get popular currency codes for quick selection
 */
export const getPopularCurrencies = () => [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW'
];

/**
 * Validate currency code format
 * @param currencyCode - Currency code to validate
 * @returns boolean indicating if code is valid format
 */
export const isValidCurrencyCode = (currencyCode: string): boolean => {
  return /^[A-Z]{3}$/.test(currencyCode);
};
