import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData,
  deleteDoc,
  doc,
  query,
  getDocs,
  getDoc,
  updateDoc
} from '@angular/fire/firestore';
import { Auth, deleteUser } from '@angular/fire/auth';
import { Observable, from, map } from 'rxjs';

export interface UserStats {
  totalUsers: number;
  usersBySex: { [key: string]: number };
  usersByAge: { [key: string]: number };
}

export interface CityStats {
  cityName: string;
  country: string;
  likeCount: number;
  averageRating?: number;
  totalRatings?: number;
}

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  sexe: string;
  createdAt: any;
  disabled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  // Get all users
  getAllUsers(): Observable<UserData[]> {
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'id' }) as Observable<UserData[]>;
  }

  // Get user statistics
  async getUserStatistics(): Promise<UserStats> {
    const usersRef = collection(this.firestore, 'users');
    const snapshot = await getDocs(usersRef);
    
    const stats: UserStats = {
      totalUsers: 0,
      usersBySex: {},
      usersByAge: {}
    };

    snapshot.forEach((doc) => {
      const data = doc.data();
      stats.totalUsers++;

      // Count by sex (normalize to capitalize first letter)
      if (data['sexe'] && data['sexe'].trim() !== '') {
        const normalizedSex = data['sexe'].charAt(0).toUpperCase() + data['sexe'].slice(1).toLowerCase();
        stats.usersBySex[normalizedSex] = (stats.usersBySex[normalizedSex] || 0) + 1;
      } else {
        stats.usersBySex['Not specified'] = (stats.usersBySex['Not specified'] || 0) + 1;
      }

      // Calculate age and categorize
      if (data['birthDate']) {
        const birthDate = new Date(data['birthDate']);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        
        let ageGroup = '';
        if (age < 18) ageGroup = '0-17';
        else if (age < 25) ageGroup = '18-24';
        else if (age < 35) ageGroup = '25-34';
        else if (age < 45) ageGroup = '35-44';
        else if (age < 55) ageGroup = '45-54';
        else if (age < 65) ageGroup = '55-64';
        else ageGroup = '65+';

        stats.usersByAge[ageGroup] = (stats.usersByAge[ageGroup] || 0) + 1;
      }
    });

    return stats;
  }

  // Get city statistics from favourites
  async getCityStatistics(): Promise<CityStats[]> {
    const favouritesRef = collection(this.firestore, 'favourites');
    const snapshot = await getDocs(favouritesRef);
    
    const cityMap = new Map<string, { likeCount: number, ratings: number[] }>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const cityKey = `${data['cityName']}_${data['country']}`;
      
      if (cityMap.has(cityKey)) {
        const existing = cityMap.get(cityKey)!;
        existing.likeCount++;
        if (data['rating']) {
          existing.ratings.push(data['rating']);
        }
      } else {
        cityMap.set(cityKey, {
          likeCount: 1,
          ratings: data['rating'] ? [data['rating']] : []
        });
      }
    });

    // Convert map to array and calculate average ratings
    const stats: CityStats[] = [];
    cityMap.forEach((value, key) => {
      const [cityName, country] = key.split('_');
      const averageRating = value.ratings.length > 0 
        ? value.ratings.reduce((sum, r) => sum + r, 0) / value.ratings.length 
        : undefined;
      
      stats.push({
        cityName: cityName || 'Unknown',
        country: country || 'Unknown',
        likeCount: value.likeCount,
        averageRating: averageRating ? Math.round(averageRating * 10) / 10 : undefined,
        totalRatings: value.ratings.length
      });
    });

    // Sort by like count
    return stats.sort((a, b) => b.likeCount - a.likeCount);
  }

  // Delete user account
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Delete user document from Firestore
      const userDocRef = doc(this.firestore, 'users', userId);
      await deleteDoc(userDocRef);

      // Delete user's favourites
      const favouritesRef = collection(this.firestore, 'favourites');
      const q = query(favouritesRef);
      const snapshot = await getDocs(q);
      
      const deletePromises: Promise<void>[] = [];
      snapshot.forEach((docSnapshot) => {
        if (docSnapshot.data()['userId'] === userId) {
          deletePromises.push(deleteDoc(doc(this.firestore, 'favourites', docSnapshot.id)));
        }
      });

      await Promise.all(deletePromises);

      // Note: Deleting from Firebase Auth requires the user to be currently logged in
      // or using Firebase Admin SDK. For production, implement this on the backend.
      console.log(`User ${userId} deleted from Firestore`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get user details by ID
  async getUserDetails(userId: string): Promise<UserData | null> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      const docSnapshot = await getDoc(userDocRef);
      
      if (docSnapshot.exists()) {
        return { id: docSnapshot.id, ...docSnapshot.data() } as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  }

  // Toggle user account status (enable/disable)
  async toggleUserStatus(userId: string, currentStatus: boolean): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      await updateDoc(userDocRef, { disabled: !currentStatus });
      console.log(`User ${userId} status updated to ${!currentStatus ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }
}
