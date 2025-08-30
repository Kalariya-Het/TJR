import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAccount } from 'wagmi';

interface User {
  id: string;
  email: string;
  role: string;
  wallet_address: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  is_active: boolean;
  is_verified: boolean;
  kyc_status: string;
}

interface UserContextType {
  user: User | null;
  token: string | null;
  isLoadingUser: boolean;
  loginUser: (email: string, password: string) => Promise<boolean>;
  logoutUser: () => void;
  fetchUserProfileByWallet: (walletAddress: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { address } = useAccount(); // Connected wallet address
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Load token from localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
      setToken(storedToken);
      // Optionally, validate token here or fetch user profile if token is valid
      // For now, we'll assume token is valid and fetch profile based on it
      // This part will be refined later when we have a /profile endpoint that uses token
      // For now, we'll just set isLoadingUser to false if token is present
      setIsLoadingUser(false);
    } else {
      setIsLoadingUser(false);
    }
  }, []);

  // Function to log in user via email/password
  const loginUser = async (email: string, password: string): Promise<boolean> => {
    setIsLoadingUser(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.token && data.user) {
        localStorage.setItem('jwtToken', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsLoadingUser(false);
        return true;
      } else {
        console.error('Login failed:', data.error);
        setIsLoadingUser(false);
        return false;
      }
    } catch (error) {
      console.error('Error during login:', error);
      setIsLoadingUser(false);
      return false;
    }
  };

  // Function to fetch user profile by wallet address (public endpoint)
  const fetchUserProfileByWallet = async (walletAddress: string) => {
    console.log('Attempting to fetch user profile for wallet:', walletAddress);
    setIsLoadingUser(true);
    try {
      const response = await fetch(`http://localhost:3001/api/users/by-wallet/${walletAddress}`);
      const data = await response.json();
      console.log('Response from /api/users/by-wallet:', response.ok, data);
      if (response.ok && data.user) {
        setUser(data.user);
        console.log('User profile set:', data.user);
      } else {
        console.error('Failed to fetch user profile by wallet:', data.error);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile by wallet:', error);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Function to log out user
  const logoutUser = () => {
    localStorage.removeItem('jwtToken');
    setToken(null);
    setUser(null);
  };

  // Effect to fetch user profile when wallet address changes (for initial load or wallet switch)
  useEffect(() => {
    console.log('UserContext useEffect triggered. Address:', address, 'Token:', token);
    if (address) {
      fetchUserProfileByWallet(address);
    } else if (!token) {
      // If no wallet and no token, then no user is logged in
      setUser(null);
      setIsLoadingUser(false);
    }
  }, [address, token]); // Depend on address and token

  return (
    <UserContext.Provider value={{ user, token, isLoadingUser, loginUser, logoutUser, fetchUserProfileByWallet }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};