import { useState, useEffect } from "react";
import { Globe, DollarSign, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Country {
  name: { common: string; official: string };
  cca2: string;
  currencies: { [key: string]: { name: string; symbol: string } };
  flag: string;
}

interface CountryCurrencySelectProps {
  onCountryChange?: (country: Country | null, currency: string | null) => void;
  value?: { country: Country | null; currency: string | null };
  className?: string;
  required?: boolean;
}

export const CountryCurrencySelect = ({ 
  onCountryChange, 
  value, 
  className,
  required = false
}: CountryCurrencySelectProps) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(value?.country || null);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(value?.currency || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch countries and currencies on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          'https://restcountries.com/v3.1/all?fields=name,currencies,cca2,flag'
        );
        const data: Country[] = await response.json();
        
        // Filter countries that have currencies and sort by name
        const countriesWithCurrencies = data
          .filter(country => country.currencies)
          .sort((a, b) => a.name.common.localeCompare(b.name.common));
        
        setCountries(countriesWithCurrencies);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Filter countries based on search term
  const filteredCountries = countries.filter(country =>
    country.name.common.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (country.currencies && Object.keys(country.currencies).some(currencyCode =>
      country.currencies[currencyCode].name.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    
    // Auto-select the first currency if available
    const currencyCodes = Object.keys(country.currencies || {});
    const firstCurrency = currencyCodes[0] || null;
    setSelectedCurrency(firstCurrency);
    
    // Notify parent component
    if (onCountryChange) {
      onCountryChange(country, firstCurrency);
    }
    
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    if (onCountryChange && selectedCountry) {
      onCountryChange(selectedCountry, currencyCode);
    }
  };

  const getDisplayText = () => {
    if (!selectedCountry || !selectedCurrency) {
      return "Select country and currency";
    }
    
    const currency = selectedCountry.currencies[selectedCurrency];
    return `${selectedCountry.name.common} - ${currency?.name} (${currency?.symbol || selectedCurrency})`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Selector */}
      <div className="space-y-2">
        <Label className="text-foreground">Country & Currency</Label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="w-full justify-between text-left font-normal"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">
                  {isLoading ? "Loading countries..." : getDisplayText()}
                </span>
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search countries or currencies..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandEmpty>No countries found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[200px]">
                  {filteredCountries.map((country) => {
                    const currencyCodes = Object.keys(country.currencies || {});
                    return (
                      <CommandItem
                        key={country.cca2}
                        onSelect={() => handleCountrySelect(country)}
                        className="flex items-center justify-between p-2 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-lg">{country.flag}</span>
                          <div className="flex flex-col">
                            <span className="font-medium">{country.name.common}</span>
                            <div className="flex flex-wrap gap-1">
                              {currencyCodes.map(code => {
                                const currency = country.currencies[code];
                                return (
                                  <Badge 
                                    key={code} 
                                    variant="secondary" 
                                    className="text-xs"
                                  >
                                    {code} {currency?.symbol}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </ScrollArea>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Currency Selector - Show if multiple currencies available */}
      {selectedCountry && Object.keys(selectedCountry.currencies || {}).length > 1 && (
        <div className="space-y-2">
          <Label className="text-foreground">Select Currency</Label>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(selectedCountry.currencies).map(([code, currency]) => (
              <Button
                key={code}
                variant={selectedCurrency === code ? "default" : "outline"}
                onClick={() => handleCurrencyChange(code)}
                className="justify-start"
                size="sm"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                {currency.name} ({currency.symbol || code})
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Display selected values */}
      {selectedCountry && selectedCurrency && (
        <div className="rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{selectedCountry.flag}</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {selectedCountry.name.common}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedCountry.currencies[selectedCurrency]?.name} 
                ({selectedCountry.currencies[selectedCurrency]?.symbol || selectedCurrency})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCurrencySelect;
