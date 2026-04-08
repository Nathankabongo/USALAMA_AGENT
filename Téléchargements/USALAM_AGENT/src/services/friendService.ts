import { offlineStorage } from './offlineStorage';

export interface Friend {
  id: string;
  name: string;
  phone: string;
  code: string;
  photoUrl?: string;
  lastLocation?: {
    lat: number;
    lng: number;
    address: string;
    precision: number;
    timestamp: string;
  };
  isActive: boolean;
}

class FriendService {
  private friends: Friend[] = [];
  private userCode: string | null = null;

  async init() {
    // Chargers le code de l'utilisateur
    const storedCode = await offlineStorage.getUserSetting('user_friend_code');
    if (storedCode && typeof storedCode === 'string') {
      this.userCode = storedCode;
    } else {
      this.userCode = this.generateRandomCode();
      await offlineStorage.setUserSetting('user_friend_code', this.userCode);
    }

    // Charger les amis
    const storedFriends = await offlineStorage.getUserSetting('user_friends');
    if (Array.isArray(storedFriends)) {
      this.friends = storedFriends;
    } else {
      // Données de test (MOCK) basées sur l'image
      this.friends = [
        {
          id: 'friend_1',
          name: 'Esther Howard',
          phone: '+243817015196',
          code: 'ILTY48345TJSDF9348S',
          isActive: true,
          lastLocation: {
            lat: -4.4419,
            lng: 15.2663,
            address: 'J7MW+PHC, Kinshasa, République démocratique du Co...',
            precision: 85,
            timestamp: new Date().toISOString()
          }
        }
      ];
      await this.saveFriends();
    }
  }

  getUserCode(): string {
    return this.userCode || 'CHARGEMENT...';
  }

  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async addFriendByCode(code: string): Promise<Friend | null> {
    // Simulation d'une recherche serveur
    // En réalité, on enverrait une requête au backend
    
    // Pour la démo, on simule une réponse positive si le code a 16 caractères
    if (code.length === 16) {
      const newFriend: Friend = {
        id: `friend_${Date.now()}`,
        name: 'Nouvel Ami',
        phone: '+243000000000',
        code: code.toUpperCase(),
        isActive: true,
        lastLocation: {
          lat: -4.4419 + (Math.random() - 0.5) * 0.01,
          lng: 15.2663 + (Math.random() - 0.5) * 0.01,
          address: 'Localisation simulée, Kinshasa',
          precision: 90,
          timestamp: new Date().toISOString()
        }
      };
      
      this.friends.push(newFriend);
      await this.saveFriends();
      return newFriend;
    }
    
    return null;
  }

  async getFriends(): Promise<Friend[]> {
    return this.friends;
  }

  private async saveFriends() {
    await offlineStorage.setUserSetting('user_friends', this.friends);
  }

  async removeFriend(friendId: string) {
    this.friends = this.friends.filter(f => f.id !== friendId);
    await this.saveFriends();
  }
}

export const friendService = new FriendService();
export default friendService;
