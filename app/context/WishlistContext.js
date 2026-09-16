'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const WishlistContext = createContext();

// 🔥 Safe JSON Parser to prevent crashes
const safeJsonParse = (key, fallback) => {
    if (typeof window === 'undefined') return fallback;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        return fallback;
    }
};

export function WishlistProvider({ children }) {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [userId, setUserId] = useState(null);

    const isValidUUID = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    const initWishlist = () => {
        const localUser = safeJsonParse('currentUser', null);
        if (localUser?.id && isValidUUID(localUser.id)) {
            setUserId(localUser.id);
            fetchWishlistFromDB(localUser.id);
        } else {
            setUserId(null);
            setWishlistItems(safeJsonParse('shophub_wishlist_guest', []));
        }
    };

    useEffect(() => {
        initWishlist();
        window.addEventListener('userStateChange', initWishlist);
        return () => window.removeEventListener('userStateChange', initWishlist);
    }, []);

    const fetchWishlistFromDB = async (uid) => {
        if (!isValidUUID(uid)) return;
        try {
            const { data, error } = await supabase
                .from('wishlist')
                .select('product_data')
                .eq('user_id', uid); // 🔥 Correctly requesting user_id, NOT user_email

            if (error) throw error;
            if (data) setWishlistItems(data.map(item => item.product_data));
        } catch (err) {
            console.error("DB Fetch Error:", err);
        }
    };

    const addToWishlist = async (product) => {
        const prevItems = [...wishlistItems];

        // Instant UI Update
        setWishlistItems((prev) => {
            if (!prev.find((item) => item.id === product.id)) return [...prev, product];
            return prev;
        });

        if (userId) {
            try {
                const { error } = await supabase
                    .from('wishlist')
                    .insert([{
                        user_id: userId, // 🔥 Match database UUID
                        product_id: product.id.toString(),
                        product_data: product
                    }]);

                if (error) throw error;
            } catch (err) {
                console.error("DB Insert Error:", err);
                setWishlistItems(prevItems); // Rollback UI if DB fails
            }
        } else {
            // Guest User
            const current = safeJsonParse('shophub_wishlist_guest', []);
            if (!current.find((item) => item.id === product.id)) {
                localStorage.setItem('shophub_wishlist_guest', JSON.stringify([...current, product]));
            }
        }
    };

    const removeFromWishlist = async (productId) => {
        const prevItems = [...wishlistItems];
        setWishlistItems((prev) => prev.filter((item) => item.id !== productId));

        if (userId) {
            try {
                const { error } = await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', userId)
                    .eq('product_id', productId.toString());

                if (error) throw error;
            } catch (err) {
                console.error("DB Delete Error:", err);
                setWishlistItems(prevItems);
            }
        } else {
            const current = safeJsonParse('shophub_wishlist_guest', []);
            localStorage.setItem('shophub_wishlist_guest', JSON.stringify(current.filter(item => item.id !== productId)));
        }
    };

    const isInWishlist = (productId) => wishlistItems.some((item) => item.id === productId);
    const wishlistCount = wishlistItems.length;

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            wishlistCount,
            addToWishlist,
            removeFromWishlist,
            isInWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    return useContext(WishlistContext);
}