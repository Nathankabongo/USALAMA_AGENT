import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  trustScore: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  badges: string[];
  emergencyContacts: number;
  sharedTrips: number;
  activeSince: string;
  lastSOS?: string;
  bloodType: string;
  normalPin: string;
  emergencyPin: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'trustScore' | 'level' | 'badges' | 'emergencyContacts' | 'sharedTrips' | 'activeSince'>) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('usalama_token');
        const userData = localStorage.getItem('usalama_user');
        
        if (token && userData) {
          // Vérifier la validité du token
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const parsedUserData = JSON.parse(userData);
            setUser(parsedUserData);
          } else {
            // Token invalide, nettoyer le stockage
            localStorage.removeItem('usalama_token');
            localStorage.removeItem('usalama_user');
          }
        }
      } catch (error) {
        console.error('Erreur de vérification d\'authentification:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Appel API pour la connexion
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Stocker le token et les données utilisateur
        localStorage.setItem('usalama_token', data.token);
        localStorage.setItem('usalama_user', JSON.stringify(data.user));
        
        setUser(data.user);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'trustScore' | 'level' | 'badges' | 'emergencyContacts' | 'sharedTrips' | 'activeSince'>): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Appel API pour l'inscription
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Stocker le token et les données utilisateur
        localStorage.setItem('usalama_token', data.token);
        localStorage.setItem('usalama_user', JSON.stringify(data.user));
        
        setUser(data.user);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur d\'inscription');
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Nettoyer le stockage local
    localStorage.removeItem('usalama_token');
    localStorage.removeItem('usalama_user');
    
    // Réinitialiser l'état
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('usalama_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
