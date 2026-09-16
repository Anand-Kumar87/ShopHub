'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Synchronize authenticated user profile from Supabase
    const syncUserProfile = useCallback(async (sessionUser) => {
        if (!sessionUser) {
            setUser(null);
            setProfile(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('currentUser');
                window.dispatchEvent(new Event('userStateChange'));
            }
            return null;
        }

        try {
            const { data: dbProfile } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email, role, avatar_url')
                .eq('id', sessionUser.id)
                .maybeSingle();

            let profileData = dbProfile;

            // Auto-provision profile in 'profiles' table for first-time social login
            if (!dbProfile) {
                const fullName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || '';
                const nameParts = fullName.trim().split(/\s+/);
                const firstName = nameParts[0] || sessionUser.email?.split('@')[0] || 'User';
                const lastName = nameParts.slice(1).join(' ') || '';
                const avatarUrl = sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || '';

                profileData = {
                    id: sessionUser.id,
                    email: sessionUser.email,
                    first_name: firstName,
                    last_name: lastName,
                    role: 'customer',
                    avatar_url: avatarUrl
                };

                await supabase.from('profiles').insert([
                    {
                        ...profileData,
                        created_at: new Date().toISOString()
                    }
                ]);
            }

            const verifiedUser = {
                id: sessionUser.id,
                email: sessionUser.email,
                firstName: profileData.first_name || sessionUser.email?.split('@')[0] || 'User',
                lastName: profileData.last_name || '',
                role: (profileData.role || 'customer').toLowerCase(),
                image: profileData.avatar_url || ''
            };

            setUser(sessionUser);
            setProfile(verifiedUser);

            if (typeof window !== 'undefined') {
                localStorage.setItem('currentUser', JSON.stringify(verifiedUser));
                window.dispatchEvent(new Event('userStateChange'));
            }

            return verifiedUser;
        } catch (err) {
            console.error('Failed to sync user profile:', err);
            return null;
        }
    }, []);

    // Initial session check on mount & auth event listener
    useEffect(() => {
        let isMounted = true;

        async function initAuth() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted) {
                    if (session?.user) {
                        await syncUserProfile(session.user);
                    } else {
                        // Purge any stale ghost sessions in localStorage
                        if (typeof window !== 'undefined' && localStorage.getItem('currentUser')) {
                            localStorage.removeItem('currentUser');
                            window.dispatchEvent(new Event('userStateChange'));
                        }
                        setUser(null);
                        setProfile(null);
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        initAuth();

        // Real-time listener for sign-in, token refresh, and sign-out
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || !session?.user) {
                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('shophub_db_orders');
                        window.dispatchEvent(new Event('userStateChange'));
                    }
                }
            } else if (session?.user) {
                if (isMounted) {
                    await syncUserProfile(session.user);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription?.unsubscribe();
        };
    }, [syncUserProfile]);

    // Secure Sign Out
    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch {
            // Proceed with local cleanup regardless of network error
        } finally {
            setUser(null);
            setProfile(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('shophub_db_orders');
                sessionStorage.clear();
                window.dispatchEvent(new Event('userStateChange'));
            }
        }
    };

    const isAdmin = profile?.role === 'admin';
    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            isAuthenticated,
            isAdmin,
            signOut,
            refreshUser: () => syncUserProfile(user)
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}