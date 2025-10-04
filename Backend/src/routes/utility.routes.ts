import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// Get all countries with currencies
router.get('/countries', async (req: Request, res: Response) => {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
    const countries = await response.json();
    
    const formattedCountries = countries.map((country: any) => {
      const currencies = country.currencies ? Object.keys(country.currencies) : [];
      const currency = currencies.length > 0 ? currencies[0] : 'USD';
      
      return {
        name: country.name.common,
        currency: currency,
        currencyName: country.currencies?.[currency]?.name || currency,
        currencySymbol: country.currencies?.[currency]?.symbol || currency,
      };
    }).sort((a: any, b: any) => a.name.localeCompare(b.name));

    res.json(formattedCountries);
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// Get exchange rates for a currency
router.get('/exchange-rates/:baseCurrency', async (req: Request, res: Response) => {
  try {
    const { baseCurrency } = req.params;
    
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    const data = await response.json();
    
    if (!data.rates) {
      return res.status(400).json({ error: 'Invalid currency code' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

export default router;