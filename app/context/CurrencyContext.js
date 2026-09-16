'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const CURRENCIES = [
    { code: 'INR', label: 'IN', name: 'Indian Rupee', symbol: '₹', flag: 'IN' },
    { code: 'USD', label: 'US', name: 'US Dollar', symbol: '$', flag: 'US' },
    { code: 'EUR', label: 'EU', name: 'Euro', symbol: '€', flag: 'EU' },
    { code: 'GBP', label: 'GB', name: 'British Pound', symbol: '£', flag: 'GB' },
    { code: 'CAD', label: 'CA', name: 'Canadian Dollar', symbol: 'C$', flag: 'CA' },
    { code: 'AUD', label: 'AU', name: 'Australian Dollar', symbol: 'A$', flag: 'AU' },
    { code: 'AED', label: 'AE', name: 'UAE Dirham', symbol: 'د.إ', flag: 'AE' },
    { code: 'JPY', label: 'JP', name: 'Japanese Yen', symbol: '¥', flag: 'JP' },
    { code: 'SGD', label: 'SG', name: 'Singapore Dollar', symbol: 'S$', flag: 'SG' },
    { code: 'CHF', label: 'CH', name: 'Swiss Franc', symbol: 'CHF', flag: 'CH' },
];

export const DEFAULT_FALLBACK_RATES = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0094,
    CAD: 0.0163,
    AUD: 0.0182,
    AED: 0.0441,
    JPY: 1.78,
    SGD: 0.0161,
    CHF: 0.0105
};

const CACHE_KEY_RATES = 'shophub_currency_rates_v2';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 Hours TTL to handle 500k DAU without rate limits

const CurrencyContext = createContext(undefined);

export function CurrencyProvider({ children }) {
    const [currency, setCurrency] = useState('INR');
    const [rate, setRate] = useState(1);
    const [taxRate, setTaxRate] = useState(0);

    const [freeShippingThreshold, setFreeShippingThreshold] = useState(5000);
    const [loading, setLoading] = useState(true);

    const [shippingIndia, setShippingIndia] = useState(100);
    const [shippingTier1, setShippingTier1] = useState(2500);
    const [shippingRow, setShippingRow] = useState(4000);

    // Get cached rates or fallback to defaults
    const getStoredRates = useCallback(() => {
        if (typeof window === 'undefined') return DEFAULT_FALLBACK_RATES;
        try {
            const raw = localStorage.getItem(CACHE_KEY_RATES);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.rates) {
                    return parsed.rates;
                }
            }
        } catch {
            // Ignore localStorage parse errors
        }
        return DEFAULT_FALLBACK_RATES;
    }, []);

    // Save rates with timestamp
    const persistRates = useCallback((newRates) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(CACHE_KEY_RATES, JSON.stringify({
                timestamp: Date.now(),
                rates: newRates
            }));
        } catch {
            // Ignore storage quota errors
        }
    }, []);

    // Fetch exchange rates from network with 3s timeout and fallback
    const fetchLiveRates = useCallback(async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const res = await fetch('https://open.er-api.com/v6/latest/INR', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.rates) {
                    persistRates(data.rates);
                    return data.rates;
                }
            }
        } catch {
            // Silently fallback if offline or rate-limited
        }
        return getStoredRates();
    }, [getStoredRates, persistRates]);

    const changeCurrency = async (newCurrency) => {
        const target = CURRENCIES.some(c => c.code === newCurrency) ? newCurrency : 'INR';
        setCurrency(target);
        if (typeof window !== 'undefined') {
            localStorage.setItem('userCurrency', target);
        }

        if (target === 'INR') {
            setRate(1);
            return;
        }

        // Instant local resolution
        const cachedRates = getStoredRates();
        if (cachedRates[target]) {
            setRate(cachedRates[target]);
        }

        // Background fresh validation if needed
        try {
            const liveRates = await fetchLiveRates();
            if (liveRates[target]) {
                setRate(liveRates[target]);
            }
        } catch {
            // Keep existing rate
        }
    };

    useEffect(() => {
        async function initGlobalSettings() {
            try {
                // 1. Fetch store settings with fallback
                let dbData = {};
                try {
                    const dbRes = await fetch('/api/admin/settings', {
                        headers: { 'Accept': 'application/json' }
                    });
                    if (dbRes.ok) {
                        dbData = await dbRes.json();
                    }
                } catch {
                    // Fail silently to defaults
                }

                setTaxRate(dbData.taxRate || 0);
                setFreeShippingThreshold(dbData.freeShippingAmount || 5000);
                setShippingIndia(dbData.shippingIndia || 100);
                setShippingTier1(dbData.shippingTier1 || 2500);
                setShippingRow(dbData.shippingRow || 4000);

                // 2. Identify active currency
                let savedCurrency = null;
                if (typeof window !== 'undefined') {
                    savedCurrency = localStorage.getItem('userCurrency');
                }

                let targetCurrency = savedCurrency;

                // Smart location tracking with strict timeout (2000ms)
                if (!savedCurrency && typeof window !== 'undefined') {
                    try {
                        const controller = new AbortController();
                        const timer = setTimeout(() => controller.abort(), 2000);

                        const ipRes = await fetch('https://ipapi.co/json/', { signal: controller.signal });
                        clearTimeout(timer);

                        if (ipRes.ok) {
                            const ipData = await ipRes.json();
                            const cc = ipData.country_code;
                            if (cc === 'IN') targetCurrency = 'INR';
                            else if (cc === 'US') targetCurrency = 'USD';
                            else if (cc === 'GB') targetCurrency = 'GBP';
                            else if (cc === 'CA') targetCurrency = 'CAD';
                            else if (cc === 'AU') targetCurrency = 'AUD';
                            else if (cc === 'AE') targetCurrency = 'AED';
                            else if (cc === 'JP') targetCurrency = 'JPY';
                            else if (cc === 'SG') targetCurrency = 'SGD';
                            else if (cc === 'CH') targetCurrency = 'CHF';
                            else if (['FR', 'DE', 'IT', 'ES', 'NL'].includes(cc)) targetCurrency = 'EUR';
                            else targetCurrency = dbData.defaultCurrency || 'INR';
                        }
                    } catch {
                        targetCurrency = dbData.defaultCurrency || 'INR';
                    }

                    if (!targetCurrency) targetCurrency = 'INR';
                    localStorage.setItem('userCurrency', targetCurrency);
                }

                if (!targetCurrency) targetCurrency = 'INR';
                setCurrency(targetCurrency);

                // 3. Resolve exchange rate
                if (targetCurrency !== 'INR') {
                    const cached = getStoredRates();
                    if (cached[targetCurrency]) {
                        setRate(cached[targetCurrency]);
                    }
                    const freshRates = await fetchLiveRates();
                    if (freshRates[targetCurrency]) {
                        setRate(freshRates[targetCurrency]);
                    }
                } else {
                    setRate(1);
                }

            } catch (error) {
                console.error("Currency context init failure:", error);
            } finally {
                setLoading(false);
            }
        }

        initGlobalSettings();
    }, [fetchLiveRates, getStoredRates]);

    const convertPrice = useCallback((baseInrPrice) => {
        if (baseInrPrice === undefined || baseInrPrice === null) return '';
        const numeric = Number(baseInrPrice) || 0;
        const converted = numeric * (rate || 1);

        const activeObj = CURRENCIES.find(c => c.code === currency);
        const currencyCode = activeObj ? activeObj.code : 'INR';

        // Non-decimal currencies (INR and JPY) show whole units; others (USD, EUR, GBP, etc.) show 2 decimals
        const isZeroDecimalCurrency = ['INR', 'JPY'].includes(currencyCode);
        const fractionDigits = isZeroDecimalCurrency ? 0 : 2;

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits
        }).format(converted);
    }, [currency, rate]);

    const activeCurrencyObj = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    return (
        <CurrencyContext.Provider value={{
            currency,
            symbol: activeCurrencyObj.symbol,
            activeCurrency: activeCurrencyObj,
            allCurrencies: CURRENCIES,
            taxRate,
            freeShippingThreshold,
            exchangeRate: rate,
            convertPrice,
            changeCurrency,
            loading,
            shippingIndia,
            shippingTier1,
            shippingRow
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useGlobalCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) throw new Error("useGlobalCurrency must be used within a CurrencyProvider");
    return context;
}