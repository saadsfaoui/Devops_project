import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './profile-setup.component.html',
  styleUrl: './profile-setup.component.css'
})
export class ProfileSetupComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  firstName = signal('');
  lastName = signal('');
  birthDate = signal('');
  sexe = signal('');
  email = signal('');
  errorMessage = signal('');
  isLoading = signal(false);
  userId = signal<string | null>(null);

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.userId.set(user.uid);
    this.email.set(user.email || '');

    // Load existing profile data if any
    this.authService.getUserProfile(user.uid).subscribe({
      next: (profile) => {
        console.log('Profile loaded:', profile);
        if (profile) {
          this.firstName.set(profile.firstName || '');
          this.lastName.set(profile.lastName || '');
          this.birthDate.set(profile.birthDate || '');
          this.sexe.set(profile.sexe || '');
        }
      },
      error: (err) => {
        console.error('Error loading profile:', err);
      }
    });
  }

  async onCompleteProfile() {
    this.errorMessage.set('');

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
        sexe: this.sexe(),
        email: this.email()
      });

      // Navigate to explore page after completion
      this.router.navigate(['/explore']);
    } catch (error) {
      console.error('Error updating profile:', error);
      this.errorMessage.set('Failed to update profile. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
