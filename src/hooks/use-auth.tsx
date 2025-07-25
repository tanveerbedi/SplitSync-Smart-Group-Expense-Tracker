
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { User } from '@/types';
import { sendNotificationEmail } from '@/ai/flows/send-notification-email';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'splitsync-auth-status';
const USER_KEY = 'splitsync-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { setCurrentUser, addMessage } = useStore.getState();

  useEffect(() => {
    try {
      const storedAuthStatus = localStorage.getItem(AUTH_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      
      if (storedAuthStatus && storedUser) {
        const authStatus = JSON.parse(storedAuthStatus);
        const user = JSON.parse(storedUser);
        if (authStatus && user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
        }
      }
    } catch (error) {
        console.error("Could not read auth state from local storage", error);
    } finally {
        setIsLoading(false);
    }
  }, [setCurrentUser]);

  const login = (user: User) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(true));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    const message = `${user.name} just logged in.`;
    addMessage({
        userId: 'system',
        text: message
    });
    sendNotificationEmail({
      subject: "User Logged In",
      message: message,
    }).catch(console.error);
    router.push('/dashboard');
  };

  const logout = () => {
    const currentUser = useStore.getState().currentUser;
    if (currentUser) {
        const message = `${currentUser.name} just logged out.`;
        addMessage({
            userId: 'system',
            text: message
        });
        sendNotificationEmail({
          subject: "User Logged Out",
          message: message,
        }).catch(console.error);
    }
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
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
