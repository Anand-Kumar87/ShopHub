'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext(undefined);

export function CurrencyProvider({ children }) {
    const [currency, setCurrency] = useState('USD');
    const [rate, setRate] = useState(1);
    const [taxRate, setTaxRate] = useState(0);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(100);
    const [loading, setLoading] = useState(true);

    // 🔥 NAYE SHIPPING STATES (Default values in USD)
    const [shippingIndia, setShippingIndia] = useState(15);
    const [shippingTier1, setShippingTier1] = useState(50);
    const [shippingRow, setShippingRow] = useState(80);

    const symbols = { USD: '$', INR: '₹', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$' };

    const changeCurrency = async (newCurrency) => {
        setLoading(true);
        setCurrency(newCurrency);
        localStorage.setItem('userCurrency', newCurrency);

        if (newCurrency !== 'USD') {
            try {
                const apiRes = await fetch('https://open.er-api.com/v6/latest/USD');
                if (apiRes.ok) {
                    const apiData = await apiRes.json();
                    setRate(apiData.rates[newCurrency] || 1);
                }
            } catch (error) {
                console.error("Failed to fetch new rate", error);
            }
        } else {
            setRate(1);
        }
        setLoading(false);
    };

    useEffect(() => {
        async function initGlobalSettings() {
            try {
                // 1. Fetch Admin Settings
                const dbRes = await fetch('/api/admin/settings');
                let dbData = {};
                
                if (dbRes.ok) {
                    dbData = await dbRes.json();
                } else {
                    console.warn("Admin settings API not ready yet. Using defaults.");
                }

                setTaxRate(dbData.taxRate || 0);
                setFreeShippingThreshold(dbData.freeShippingAmount || 100);
                setShippingIndia(dbData.shippingIndia || 15);
                setShippingTier1(dbData.shippingTier1 || 50);
                setShippingRow(dbData.shippingRow || 80);

                // 🔥 2. Smart Location & Currency Detection Logic
                const savedCurrency = localStorage.getItem('userCurrency');
                let targetCurrency = savedCurrency;

                // अगर यूज़र ने पहले से कोई करेंसी मैन्युअली नहीं चुनी है, तब ही लोकेशन ट्रैक करें
                if (!savedCurrency) {
                    try {
                        const ipRes = await fetch('https://ipapi.co/json/');
                        if (ipRes.ok) {
                            const ipData = await ipRes.json();
                            // Country के हिसाब से करेंसी सेट करें
                            if (ipData.country_code === 'IN') targetCurrency = 'INR';
                            else if (ipData.country_code === 'US') targetCurrency = 'USD';
                            else if (ipData.country_code === 'GB') targetCurrency = 'GBP';
                            else if (ipData.country_code === 'CA') targetCurrency = 'CAD';
                            else if (ipData.country_code === 'AU') targetCurrency = 'AUD';
                            // यूरोपियन देशों के लिए
                            else if (['FR', 'DE', 'IT', 'ES', 'NL'].includes(ipData.country_code)) targetCurrency = 'EUR';
                            else targetCurrency = dbData.defaultCurrency || 'USD';
                        } else {
                            targetCurrency = dbData.defaultCurrency || 'USD';
                        }
                    } catch (ipError) {
                        console.warn("Location fetch failed, using default.", ipError);
                        targetCurrency = dbData.defaultCurrency || 'USD';
                    }
                    
                    // डिटेक्ट की गई करेंसी को सेव कर लें ताकि हर पेज लोड पर API कॉल न हो
                    localStorage.setItem('userCurrency', targetCurrency);
                }

                setCurrency(targetCurrency);

                // 3. Fetch Exchange Rate if not USD
                if (targetCurrency !== 'USD') {
                    const apiRes = await fetch('https://open.er-api.com/v6/latest/USD');
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

    const convertPrice = (baseUsdPrice) => {
        if (baseUsdPrice === undefined || baseUsdPrice === null) return '';
        const converted = baseUsdPrice * rate;
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
            symbol: symbols[currency] || '$',
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
