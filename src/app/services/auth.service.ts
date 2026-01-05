import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user, User, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, GithubAuthProvider, signInWithPopup, onAuthStateChanged } from '@angular/fire/auth';
import { Observable, firstValueFrom } from 'rxjs';
import { FirestoreService } from './firestore.service';

export interface UserProfile {
  firstName: string;
  lastName: string;
  birthDate: string;
  sexe: string;
  email?: string;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestoreService = inject(FirestoreService);
  user$: Observable<User | null> = user(this.auth);

  // Register new user
  async register(email: string, password: string, profile?: UserProfile) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Save user profile to Firestore if provided
      if (profile && userCredential.user) {
        await this.firestoreService.setDocument('users', userCredential.user.uid, {
          ...profile,
          email: email,
          createdAt: new Date()
        });
      }
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  // Sign in existing user
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  // Google Sign-In
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      
      // Check if user profile exists, if not create basic profile
      try {
        const userDoc = await firstValueFrom(this.firestoreService.getDocument('users', userCredential.user.uid));
        
        if (!userDoc) {
          // Extract name from Google profile
          const displayName = userCredential.user.displayName || '';
          const nameParts = displayName.split(' ');
          
          await this.firestoreService.setDocument('users', userCredential.user.uid, {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            birthDate: '',
            sexe: '',
            email: userCredential.user.email,
            createdAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error checking/creating profile:', error);
        // Continue even if profile check fails
      }
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  }
  // Sign out
  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Wait for auth state to be ready
  waitForAuthState(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  // Update user profile
  async updateUserProfile(userId: string, profile: Partial<UserProfile>) {
    try {
      await this.firestoreService.updateDocument('users', userId, profile);
    } catch (error) {
      throw error;
    }
  }

  // Get user profile
  getUserProfile(userId: string): Observable<UserProfile | undefined> {
    return this.firestoreService.getDocument<UserProfile>('users', userId);
  }

  // Check if user profile is complete
  async isProfileComplete(userId: string): Promise<boolean> {
    try {
      const profile = await firstValueFrom(this.firestoreService.getDocument<UserProfile>('users', userId));
      if (!profile) return false;
      
      // Check if all required fields are filled
      return !!(profile.firstName && profile.lastName && profile.birthDate && profile.sexe);
    } catch (error) {
      console.error('Error checking profile:', error);
      return false;
    }
  }
}
