import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user, User, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, GithubAuthProvider, signInWithPopup, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, verifyBeforeUpdateEmail } from '@angular/fire/auth';
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
      
      // Send email verification with custom settings (skip for admin)
      if (email !== 'admin@earthvibes.com') {
        const actionCodeSettings = {
          url: window.location.origin + '/login?verified=true',
          handleCodeInApp: true
        };
        await sendEmailVerification(userCredential.user, actionCodeSettings);
      }
      
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
  // Send verification email to current user
  async resendVerificationEmail() {
    try {
      const currentUser = this.auth.currentUser;
      if (currentUser && !currentUser.emailVerified) {
        // Skip verification for admin
        if (currentUser.email === 'admin@earthvibes.com') {
          throw new Error('Admin account does not require verification');
        }
        const actionCodeSettings = {
          url: window.location.origin + '/login?verified=true',
          handleCodeInApp: true
        };
        await sendEmailVerification(currentUser, actionCodeSettings);
      } else if (!currentUser) {
        throw new Error('No user is currently signed in');
      } else {
        throw new Error('Email is already verified');
      }
    } catch (error) {
      throw error;
    }
  }

  // Send password reset email
  async resetPassword(email: string) {
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      };
      await sendPasswordResetEmail(this.auth, email, actionCodeSettings);
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

  // Update user email with verification
  async updateUserEmail(newEmail: string) {
    try {
      const currentUser = this.auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Prevent admin email from being changed
      if (currentUser.email === 'admin@earthvibes.com') {
        throw new Error('Admin email cannot be changed');
      }

      // Check if the new email is the same as the current one
      if (currentUser.email === newEmail) {
        throw new Error('New email is the same as the current email');
      }

      // Send verification email to the new address
      // Firebase will automatically send a notification to the old email
      const actionCodeSettings = {
        url: window.location.origin + '/account?emailUpdated=true',
        handleCodeInApp: true
      };
      
      await verifyBeforeUpdateEmail(currentUser, newEmail, actionCodeSettings);
      
      // Update email in Firestore after verification
      await this.firestoreService.updateDocument('users', currentUser.uid, {
        email: newEmail
      });
    } catch (error) {
      throw error;
    }
  }
}
