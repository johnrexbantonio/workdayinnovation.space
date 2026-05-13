"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type Role = 'employee' | 'manager' | 'admin';

export interface User {
  id: string; // will use email as ID for simplicity
  email: string;
  name: string;
  role: Role;
  pin: string; // Storing PIN plainly or simple hash for this prototype
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pin: string) => Promise<boolean>;
  signup: (email: string, pin: string, name: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialUser = null;
    // Check local storage or session for simple persistence
    const storedUser = localStorage.getItem('training-manager-user');
    if (storedUser) {
      try {
        initialUser = JSON.parse(storedUser);
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setUser(initialUser);
    setLoading(false);
  }, []);

  const login = async (email: string, pin: string): Promise<boolean> => {
    try {
      const userRef = doc(db, 'users', email.toLowerCase());
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        if (userData.pin === pin) {
          setUser(userData);
          localStorage.setItem('training-manager-user', JSON.stringify(userData));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Login error", error);
      return false;
    }
  };

  const signup = async (email: string, pin: string, name: string): Promise<boolean> => {
    try {
      const formattedEmail = email.toLowerCase();
      const userRef = doc(db, 'users', formattedEmail);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return false; // User already exists
      }

      // Automatically make john.rex.antonio@ibm.com or admin1@ibm.com an admin
      let role: Role = 'employee';
      if (formattedEmail === 'john.rex.antonio@ibm.com' || formattedEmail === 'admin1@ibm.com') {
        role = 'admin';
      }

      const newUser: User = {
        id: formattedEmail,
        email: formattedEmail,
        name,
        role,
        pin
      };

      await setDoc(userRef, newUser);
      setUser(newUser);
      localStorage.setItem('training-manager-user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error("Signup error", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('training-manager-user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager',
        isEmployee: user?.role === 'employee',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
