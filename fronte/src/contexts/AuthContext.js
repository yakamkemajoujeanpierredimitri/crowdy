"use client";

import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Mocking the initial state. In a real app, this would fetch from an API or read a JWT.
  // We'll default to a 'free' tier 'user' to test the gating mechanisms.
  const [user, setUser] = useState({
    id: 'mock-user-123',
    name: 'Anonymous Visitor',
    role: 'user', // 'user', 'business', 'admin'
    tier: 'free', // 'free', 'premium', 'business_plus'
  });

  const [isLoading, setIsLoading] = useState(false);

  // Helper to test UI states by switching roles and tiers
  const switchRole = (role, tier) => {
    setIsLoading(true);
    setTimeout(() => {
      setUser({
        id: `mock-${role}-${Date.now()}`,
        name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        role: role,
        tier: tier,
      });
      setIsLoading(false);
    }, 300); // Simulate network delay
  };

  const logout = () => {
    setUser({
      id: 'mock-anon',
      name: 'Anonymous',
      role: 'user',
      tier: 'free'
    });
  };

  const value = {
    user,
    isLoading,
    switchRole,
    logout,
    // Convenience booleans for rendering gated UI
    isFreeUser: user?.role === 'user' && user?.tier === 'free',
    isPremiumUser: user?.role === 'user' && user?.tier === 'premium',
    isBusiness: user?.role === 'business',
    isBusinessPlus: user?.role === 'business' && user?.tier === 'business_plus',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
