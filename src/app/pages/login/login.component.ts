import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FlashService } from '../../services/flash.service';

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
  private flash = inject(FlashService);

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
      // show success and go to explore
      this.flash.show('Logged in successfully', 'success', 2500);
      this.router.navigate(['/explore']);
    } catch (error: any) {
      this.errorMessage.set(this.getErrorMessage(error.code));
      // also show flash error briefly
      this.flash.show(this.errorMessage(), 'error', 4000);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onGoogleLogin() {
    this.isGoogleLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.loginWithGoogle();
      this.flash.show('Logged in successfully', 'success', 2500);
      this.router.navigate(['/explore']);
    } catch (error: any) {
      this.errorMessage.set(this.getErrorMessage(error.code));
      this.flash.show(this.errorMessage(), 'error', 4000);
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