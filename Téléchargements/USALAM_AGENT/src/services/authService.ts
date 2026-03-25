import { User } from '../contexts/AuthContext';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  pin: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

class AuthService {
  private readonly API_URL = 'http://localhost:3001/api';

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Erreur de connexion'
        };
      }

      return {
        success: true,
        token: data.token,
        user: data.user
      };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return {
        success: false,
        message: 'Erreur réseau. Veuillez réessayer.'
      };
    }
  }

  // Register
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Erreur d\'inscription'
        };
      }

      return {
        success: true,
        token: data.token,
        user: data.user
      };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return {
        success: false,
        message: 'Erreur réseau. Veuillez réessayer.'
      };
    }
  }

  // Verify token
  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      return false;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('usalama_token');
      
      if (token) {
        await fetch(`${this.API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    } finally {
      // Nettoyer le stockage local même si l'API échoue
      localStorage.removeItem('usalama_token');
      localStorage.removeItem('usalama_user');
    }
  }

  // Refresh token
  async refreshToken(): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('usalama_token');
      
      if (!token) {
        return {
          success: false,
          message: 'Aucun token à rafraîchir'
        };
      }

      const response = await fetch(`${this.API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Erreur de rafraîchissement'
        };
      }

      return {
        success: true,
        token: data.token,
        user: data.user
      };
    } catch (error) {
      console.error('Erreur de rafraîchissement du token:', error);
      return {
        success: false,
        message: 'Erreur réseau. Veuillez réessayer.'
      };
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Erreur de demande de réinitialisation'
        };
      }

      return {
        success: true,
        message: 'Email de réinitialisation envoyé'
      };
    } catch (error) {
      console.error('Erreur de demande de réinitialisation:', error);
      return {
        success: false,
        message: 'Erreur réseau. Veuillez réessayer.'
      };
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('usalama_token');
      
      if (!token) {
        return {
          success: false,
          message: 'Utilisateur non authentifié'
        };
      }

      const response = await fetch(`${this.API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Erreur de changement de mot de passe'
        };
      }

      return {
        success: true,
        message: 'Mot de passe changé avec succès'
      };
    } catch (error) {
      console.error('Erreur de changement de mot de passe:', error);
      return {
        success: false,
        message: 'Erreur réseau. Veuillez réessayer.'
      };
    }
  }

  // Get user profile
  async getUserProfile(): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const token = localStorage.getItem('usalama_token');
      
      if (!token) {
        return {
          success: false,
          message: 'Utilisateur non authentifié'
        };
      }

      const response = await fetch(`${this.API_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Erreur de récupération du profil'
        };
      }

      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      console.error('Erreur de récupération du profil:', error);
      return {
        success: false,
        message: 'Erreur réseau. Veuillez réessayer.'
      };
    }
  }
}

export default new AuthService();
