'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext(undefined);

export function CurrencyProvider({ children }) {
    // 🔥 DEFAULT CURRENCY AB 'INR' HAI
    const [currency, setCurrency] = useState('INR');
    const [rate, setRate] = useState(1);
    const [taxRate, setTaxRate] = useState(0);
    
    // 🔥 DEFAULT RATES IN INR (Ab admin panel mein direct INR input hoga)
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(5000);
    const [loading, setLoading] = useState(true);

    const [shippingIndia, setShippingIndia] = useState(100);
    const [shippingTier1, setShippingTier1] = useState(2500);
    const [shippingRow, setShippingRow] = useState(4000);

    const symbols = { USD: '$', INR: '₹', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$' };

    const changeCurrency = async (newCurrency) => {
        setLoading(true);
        setCurrency(newCurrency);
        localStorage.setItem('userCurrency', newCurrency);

        // 🔥 API BASE CHANGED TO 'INR' (Rupee ke hisaab se convert hoga)
        if (newCurrency !== 'INR') {
            try {
                const apiRes = await fetch('https://open.er-api.com/v6/latest/INR');
                if (apiRes.ok) {
                    const apiData = await apiRes.json();
                    setRate(apiData.rates[newCurrency] || 1);
                }
            } catch (error) {
                console.error("Failed to fetch new rate", error);
            }
        } else {
            setRate(1); // Agar INR hai toh rate 1 rahega
        }
        setLoading(false);
    };

    useEffect(() => {
        async function initGlobalSettings() {
            try {
                const dbRes = await fetch('/api/admin/settings');
                let dbData = {};
                
                if (dbRes.ok) {
                    dbData = await dbRes.json();
                } else {
                    console.warn("Admin settings API not ready yet. Using defaults.");
                }

                setTaxRate(dbData.taxRate || 0);
                // 🔥 Load INR values from DB directly
                setFreeShippingThreshold(dbData.freeShippingAmount || 5000);
                setShippingIndia(dbData.shippingIndia || 100);
                setShippingTier1(dbData.shippingTier1 || 2500);
                setShippingRow(dbData.shippingRow || 4000);

                const savedCurrency = localStorage.getItem('userCurrency');
                let targetCurrency = savedCurrency;

                // Smart Location tracking
                if (!savedCurrency) {
                    try {
                        const ipRes = await fetch('https://ipapi.co/json/');
                        if (ipRes.ok) {
                            const ipData = await ipRes.json();
                            if (ipData.country_code === 'IN') targetCurrency = 'INR';
                            else if (ipData.country_code === 'US') targetCurrency = 'USD';
                            else if (ipData.country_code === 'GB') targetCurrency = 'GBP';
                            else if (ipData.country_code === 'CA') targetCurrency = 'CAD';
                            else if (ipData.country_code === 'AU') targetCurrency = 'AUD';
                            else if (['FR', 'DE', 'IT', 'ES', 'NL'].includes(ipData.country_code)) targetCurrency = 'EUR';
                            else targetCurrency = dbData.defaultCurrency || 'INR';
                        } else {
                            targetCurrency = dbData.defaultCurrency || 'INR';
                        }
                    } catch (ipError) {
                        console.warn("Location fetch failed, using default.", ipError);
                        targetCurrency = dbData.defaultCurrency || 'INR';
                    }
                    localStorage.setItem('userCurrency', targetCurrency);
                }

                setCurrency(targetCurrency);

                // 🔥 Fetch Exchange Rate if target is not INR (Base is INR)
                if (targetCurrency !== 'INR') {
                    const apiRes = await fetch('https://open.er-api.com/v6/latest/INR');
                    if (apiRes.ok) {
                        const apiData = await apiRes.json();
                        setRate(apiData.rates[targetCurrency] || 1);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch global settings", error);
            } finally {
                setLoading(false);
            }
        }
        initGlobalSettings();
    }, []);

    const convertPrice = (baseInrPrice) => {
        if (baseInrPrice === undefined || baseInrPrice === null) return '';
        const converted = baseInrPrice * rate;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            symbol: symbols[currency] || '₹',
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
