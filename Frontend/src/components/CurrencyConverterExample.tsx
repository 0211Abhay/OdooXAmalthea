// Example usage of the currency conversion utility

import React, { useState, useEffect } from 'react';
import { convertCurrency, formatCurrency, fetchExchangeRates } from '../utils/currency';

export const CurrencyConverterExample = () => {
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!amount || !fromCurrency || !toCurrency) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await convertCurrency(amount, fromCurrency, toCurrency);
      setConvertedAmount(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setConvertedAmount(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Currency Converter Example</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full p-2 border rounded"
            placeholder="Enter amount"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">From Currency</label>
          <input
            type="text"
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value.toUpperCase())}
            className="w-full p-2 border rounded"
            placeholder="USD"
            maxLength={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">To Currency</label>
          <input
            type="text"
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value.toUpperCase())}
            className="w-full p-2 border rounded"
            placeholder="EUR"
            maxLength={3}
          />
        </div>
      </div>

      <button
        onClick={handleConvert}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? 'Converting...' : 'Convert'}
      </button>

      {convertedAmount !== null && (
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">
            <strong>Result:</strong> {formatCurrency(amount, fromCurrency)} = {formatCurrency(convertedAmount, toCurrency)}
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default CurrencyConverterExample;
