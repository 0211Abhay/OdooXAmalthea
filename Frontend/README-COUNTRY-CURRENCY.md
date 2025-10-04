# Country and Currency Selection Implementation

This implementation adds country and currency selection functionality to the signup form using the provided REST APIs.

## Features Implemented

### 1. Country & Currency Selector Component (`CountryCurrencySelect.tsx`)

- **Fetches country data** from `https://restcountries.com/v3.1/all?fields=name,currencies,cca2,flag`
- **Interactive country search** with autocomplete functionality
- **Automatic currency detection** based on selected country
- **Multi-currency support** for countries with multiple currencies
- **Visual country flags** and currency symbols
- **Responsive design** with proper UI components

### 2. Currency Conversion Utilities (`utils/currency.ts`)

- **Exchange rate fetching** using `https://api.exchangerate-api.com/v4/latest/{BASE_CURRENCY}`
- **Currency conversion functions** for real-time conversions
- **Currency formatting** with proper localization
- **Popular currencies list** for quick selection
- **Currency code validation**

### 3. Enhanced Signup Form

- **Integrated country/currency selection** in the signup process
- **Form validation** to ensure country and currency are selected
- **User-friendly interface** with proper error handling
- **Future-ready structure** for storing user preferences

## Usage

### Basic Country/Currency Selection

```tsx
import { CountryCurrencySelect } from '../components/CountryCurrencySelect';

const [country, setCountry] = useState(null);
const [currency, setCurrency] = useState(null);

const handleCountryChange = (selectedCountry, selectedCurrency) => {
  setCountry(selectedCountry);
  setCurrency(selectedCurrency);
};

<CountryCurrencySelect 
  onCountryChange={handleCountryChange}
  value={{ country, currency }}
  required={true}
/>
```

### Currency Conversion Example

```tsx
import { convertCurrency, formatCurrency } from '../utils/currency';

// Convert 100 USD to EUR
const convertedAmount = await convertCurrency(100, 'USD', 'EUR');
console.log(formatCurrency(convertedAmount, 'EUR')); // €85.23
```

## API Integration

### Countries API
- **Endpoint**: `https://restcountries.com/v3.1/all?fields=name,currencies,cca2,flag`
- **Data**: Country names, currency information, country codes, flags
- **Filtering**: Countries with available currency information only

### Exchange Rate API
- **Endpoint**: `https://api.exchangerate-api.com/v4/latest/{BASE_CURRENCY}`
- **Data**: Real-time exchange rates for currency conversions
- **Usage**: Background currency conversion and rate display

## Component Structure

```
src/
├── components/
│   ├── CountryCurrencySelect.tsx    # Main selector component
│   └── CurrencyConverterExample.tsx  # Example usage component
├── pages/
│   └── Signup.tsx                    # Enhanced signup form
└── utils/
    └── currency.ts                   # Currency utilities and API calls
```

## Key Features

1. **Search Functionality**: Users can search countries by name or currency
2. **Visual Indicators**: Country flags and currency symbols for better UX
3. **Auto-Selection**: Automatic currency selection for single-currency countries
4. **Multi-Currency**: Support for countries with multiple currencies
5. **Validation**: Form validation ensures required selections are made
6. **Error Handling**: Proper error states and user feedback
7. **Loading States**: Visual feedback during API calls
8. **Responsive Design**: Works on all screen sizes

## Future Enhancements

1. **User Preference Storage**: Save country/currency to user profile
2. **Exchange Rate Display**: Show current rates in the UI
3. **Currency History**: Track user's currency usage patterns
4. **Offline Support**: Cache country data for offline usage
5. **Advanced Filtering**: Filter by region, continent, etc.

## Data Flow

1. **Component Mount**: Fetch all countries with currencies from REST API
2. **User Search**: Filter countries based on search input
3. **Country Selection**: User selects country from dropdown
4. **Currency Auto-Select**: Automatically select currency if only one available
5. **Manual Currency**: Allow manual selection if multiple currencies
6. **Form Submission**: Include country and currency in signup data
7. **Validation**: Ensure all required fields are completed

## Error Handling

- **Network Errors**: Graceful handling of API failures
- **Invalid Data**: Validation of country and currency formats
- **User Feedback**: Clear error messages and loading states
- **Fallback Options**: Graceful degradation when APIs are unavailable

## Testing

The implementation includes:
- **Component Testing**: Test country selection and currency detection
- **API Testing**: Mock API responses for reliable testing
- **Form Validation**: Test required field validation
- **Error States**: Test error handling and recovery

## Performance Considerations

- **Data Caching**: Countries are fetched once and cached
- **Debounced Search**: Search input is debounced to reduce API calls
- **Lazy Loading**: Components load data only when needed
- **Optimized Rendering**: Efficient list rendering with proper keys
