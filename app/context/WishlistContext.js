'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase'; // 🔥 Make sure this path is correct

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [userEmail, setUserEmail] = useState(null);

    // 🔥 Load Wishlist on Mount (Checks if user is logged in)
    useEffect(() => {
        const localUser = JSON.parse(localStorage.getItem('currentUser'));

        if (localUser && localUser.email) {
            setUserEmail(localUser.email);
            fetchWishlistFromDB(localUser.email);
        } else {
            // Guest User (Not logged in) - Load from Local Storage temporarily
            const savedWishlist = JSON.parse(localStorage.getItem('shophub_wishlist_guest')) || [];
            setWishlistItems(savedWishlist);
        }
    }, []);

    // 🔥 Fetch from Supabase
    const fetchWishlistFromDB = async (email) => {
        try {
            const { data, error } = await supabase
                .from('wishlist')
                .select('product_data')
                .eq('user_email', email);

            if (error) throw error;

            if (data) {
                // Extract product data from the database rows
                const products = data.map(item => item.product_data);
                setWishlistItems(products);
            }
        } catch (err) {
            console.error("Error fetching wishlist from DB:", err);
        }
    };

    // 🔥 Add to Wishlist (Supabase + Realtime UI)
    const addToWishlist = async (product) => {
        // 1. Fast UI Update (Optimistic update)
        setWishlistItems((prev) => {
            if (!prev.find((item) => item.id === product.id)) {
                return [...prev, product];
            }
            return prev;
        });

        // 2. Database Update
        if (userEmail) {
            try {
                await supabase
                    .from('wishlist')
                    .insert([{
                        user_email: userEmail,
                        product_id: product.id,
                        product_data: product
                    }]);
            } catch (err) {
                console.error("Error saving to DB:", err);
            }
        } else {
            // Guest User Save
            const current = JSON.parse(localStorage.getItem('shophub_wishlist_guest')) || [];
            localStorage.setItem('shophub_wishlist_guest', JSON.stringify([...current, product]));
        }
    };

    // 🔥 Remove from Wishlist (Supabase + Realtime UI)
    const removeFromWishlist = async (productId) => {
        // 1. Fast UI Update
        setWishlistItems((prev) => prev.filter((item) => item.id !== productId));

        // 2. Database Update
        if (userEmail) {
            try {
                await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_email', userEmail)
                    .eq('product_id', productId);
            } catch (err) {
                console.error("Error removing from DB:", err);
            }
        } else {
            // Guest User Remove
            const current = JSON.parse(localStorage.getItem('shophub_wishlist_guest')) || [];
            localStorage.setItem('shophub_wishlist_guest', JSON.stringify(current.filter(item => item.id !== productId)));
        }
    };

    // Check if item is in wishlist
    const isInWishlist = (productId) => {
        return wishlistItems.some((item) => item.id === productId);
    };

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
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