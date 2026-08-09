'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on component mount
  useEffect(() => {
    const checkAuthStatus = () => {
      // Humne pichle components mein 'shophub_current_user' key use ki thi
      const storedUser = localStorage.getItem('shophub_current_user');

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse user from localStorage:', error);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      let role = 'customer';
      let name = email.split('@')[0];

      // Admin check logic
      if (email === 'admin@shophub.com' || email === 'demo@example.com') {
        role = 'admin';
        name = email === 'admin@shophub.com' ? 'Admin User' : 'Demo Admin';
      }

      const mockUser = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        role,
        avatarUrl: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`,
      };

      // Save to state and localStorage
      setUser(mockUser);

      if (rememberMe) {
        localStorage.setItem('shophub_current_user', JSON.stringify(mockUser));
      } else {
        sessionStorage.setItem('shophub_current_user', JSON.stringify(mockUser));
      }

      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Invalid login credentials' };
    }
  };

  // Register function
  const register = async (firstName, lastName, email, password) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockUser = {
        id: Math.random().toString(36).substr(2, 9),
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        role: 'customer',
        avatarUrl: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=0D8ABC&color=fff`,
      };

      setUser(mockUser);
      localStorage.setItem('shophub_current_user', JSON.stringify(mockUser));

      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Registration failed' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('shophub_current_user');
    sessionStorage.removeItem('shophub_current_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin'
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