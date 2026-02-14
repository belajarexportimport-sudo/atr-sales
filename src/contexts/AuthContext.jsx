import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        if (!userId) {
            setProfile(null);
            return;
        }

        let { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        // FAILSAFE: If profile missing, force create it via RPC
        if (!data || error) {
            console.log("⚠️ Profile missing, attempting self-repair...");
            const { error: rpcError } = await supabase.rpc('ensure_user_profile');
            if (!rpcError) {
                // Retry fetch
                const retry = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();
                data = retry.data;
            }
        }

        setProfile(data);
    };

    useEffect(() => {
        // Check active session
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                
                setUser(session?.user ?? null);
                if (session?.user?.id) {
                    await fetchProfile(session.user.id);
                }
            } catch (err) {
                console.error("Auth Init Error:", err);
                // Optional: Sentry.captureException(err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            fetchProfile(session?.user?.id);
            setLoading(false); // Ensure loading is off on change events too
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    };

    const signUp = async (email, password, metadata = {}) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error.message };
        }
    };

    const value = {
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
