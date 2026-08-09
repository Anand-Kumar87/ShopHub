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
                const dbRes = await fetch('/api/admin/settings');

                let dbData = {};
                // HTML 404/500 error ko JSON parse hone se bachane ke liye check
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

                const savedCurrency = localStorage.getItem('userCurrency');
                const targetCurrency = savedCurrency || dbData.defaultCurrency || 'USD';
                setCurrency(targetCurrency);

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