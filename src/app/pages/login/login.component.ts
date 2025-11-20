import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);
  isGoogleLoading = signal(false);
  isFacebookLoading = signal(false);
  isTwitterLoading = signal(false);
  isGithubLoading = signal(false);

  async onLogin() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.login(this.email(), this.password());
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.errorMessage.set(this.getErrorMessage(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  async onGoogleLogin() {
    this.isGoogleLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.errorMessage.set(this.getErrorMessage(error.code));
    } finally {
      this.isGoogleLoading.set(false);
    }
  }
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/user-disabled':
        return 'This user has been disabled.';
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
}