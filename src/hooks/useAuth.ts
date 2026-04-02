'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getAuth,
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    User,
} from 'firebase/auth';
import app from '@/lib/firebase';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = useCallback(async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
        }
    }, []);

    const signInWithEmail = useCallback(async (email: string, password: string) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            console.error('Email sign in error:', error);
            throw error;
        }
    }, []);

    const signUpWithEmail = useCallback(async (email: string, password: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            console.error('Email sign up error:', error);
            throw error;
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }, []);

    return {
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
    };
}
