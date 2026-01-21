import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  firstName = signal('');
  lastName = signal('');
  birthDate = signal('');
  sexe = signal('');
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);
  registrationComplete = signal(false);

  async onRegister() {
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validate required fields
    if (!this.firstName() || !this.lastName() || !this.birthDate() || !this.sexe()) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    if (this.password().length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.isLoading.set(true);

    try {
      await this.authService.register(
        this.email(), 
        this.password(),
        {
          firstName: this.firstName(),
          lastName: this.lastName(),
          birthDate: this.birthDate(),
          sexe: this.sexe()
        }
      );
      
      // Log the user out immediately after registration
      await this.authService.logout();
      
      // Show success message instead of redirecting
      this.registrationComplete.set(true);
      this.successMessage.set('Registration successful! Please check your email to verify your account before signing in.');
    } catch (error: any) {
      this.errorMessage.set(this.getErrorMessage(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/weak-password':
        return 'Password is too weak.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}