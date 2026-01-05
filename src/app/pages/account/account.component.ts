import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, UserProfile } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);

  firstName = signal('');
  lastName = signal('');
  birthDate = signal('');
  sexe = signal('');
  email = signal('');
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);
  isEditing = signal(false);
  userId = signal<string | null>(null);

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.userId.set(user.uid);
    this.email.set(user.email || '');
    await this.loadUserProfile();
  }

  async loadUserProfile() {
    const uid = this.userId();
    if (!uid) return;

    this.isLoading.set(true);
    try {
      this.firestoreService.getDocument<UserProfile>('users', uid).subscribe({
        next: (profile) => {
          if (profile) {
            this.firstName.set(profile.firstName || '');
            this.lastName.set(profile.lastName || '');
            this.birthDate.set(profile.birthDate || '');
            this.sexe.set(profile.sexe || '');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.errorMessage.set('Failed to load profile.');
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.errorMessage.set('An error occurred.');
      this.isLoading.set(false);
    }
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.loadUserProfile();
  }

  async onUpdateProfile() {
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validate required fields
    if (!this.firstName() || !this.lastName() || !this.birthDate() || !this.sexe()) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }

    const uid = this.userId();
    if (!uid) {
      this.errorMessage.set('User not authenticated.');
      return;
    }

    this.isLoading.set(true);

    try {
      await this.authService.updateUserProfile(uid, {
        firstName: this.firstName(),
        lastName: this.lastName(),
        birthDate: this.birthDate(),
        sexe: this.sexe()
      });

      this.successMessage.set('Profile updated successfully!');
      this.isEditing.set(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        this.successMessage.set('');
      }, 3000);
    } catch (error: any) {
      console.error('Update error:', error);
      this.errorMessage.set('Failed to update profile. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/explore']);
  }
}
