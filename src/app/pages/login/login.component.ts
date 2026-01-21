import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FlashService } from '../../services/flash.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private flash = inject(FlashService);
  private route = inject(ActivatedRoute);

  email = signal('');
  password = signal('');
  errorMessage = signal('');
  warningMessage = signal('');
  isLoading = signal(false);
  isGoogleLoading = signal(false);
  showVerificationWarning = signal(false);
  isResendingEmail = signal(false);
  showForgotPassword = signal(false);
  resetEmail = signal('');
  isResettingPassword = signal(false);
  resetSuccessMessage = signal('');

  ngOnInit() {
    // Check if user just verified their email
    this.route.queryParams.subscribe(params => {
      if (params['verified'] === 'true') {
        this.flash.show('✅ Email verified successfully! You can now log in.', 'success', 4000);
      }
    });
  }

  async onLogin() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.warningMessage.set('');
    this.showVerificationWarning.set(false);

    try {
      const userCredential = await this.authService.login(this.email(), this.password());
      
      // Check if email is verified (skip for admin)
      if (!userCredential.user.emailVerified && userCredential.user.email !== 'admin@earthvibes.com') {
        this.showVerificationWarning.set(true);
        this.warningMessage.set('Please verify your email address before logging in. Check your inbox for the verification link.');
        await this.authService.logout();
        return;
      }
      
      // show success and go to explore
      this.flash.show('Logged in successfully', 'success', 2500);
      this.router.navigate(['/explore']);
    } catch (error: any) {
      this.errorMessage.set(this.getErrorMessage(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  async resendVerificationEmail() {
    this.isResendingEmail.set(true);
    this.errorMessage.set('');
    
    try {
      // Login temporarily to resend email
      const userCredential = await this.authService.login(this.email(), this.password());
      await this.authService.resendVerificationEmail();
      await this.authService.logout();
      this.warningMessage.set('Verification email sent! Please check your inbox (and spam folder).');
    } catch (error: any) {
      this.errorMessage.set('Failed to resend verification email. Please try again.');
    } finally {
      this.isResendingEmail.set(false);
    }
  }

  toggleForgotPassword() {
    this.showForgotPassword.set(!this.showForgotPassword());
    this.errorMessage.set('');
    this.resetSuccessMessage.set('');
    if (this.showForgotPassword()) {
      this.resetEmail.set(this.email());
    }
  }

  async onPasswordReset() {
    this.isResettingPassword.set(true);
    this.errorMessage.set('');
    this.resetSuccessMessage.set('');

    const emailValue = this.resetEmail().trim();
    if (!emailValue) {
      this.errorMessage.set('Please enter your email address.');
      this.isResettingPassword.set(false);
      return;
    }

    try {
      await this.authService.resetPassword(emailValue);
      this.resetSuccessMessage.set('Password reset email sent! Please check your inbox (and spam folder).');
      this.flash.show('Password reset email sent successfully', 'success', 3000);
      
      // Close the dialog after 2 seconds
      setTimeout(() => {
        this.showForgotPassword.set(false);
        this.resetSuccessMessage.set('');
      }, 2000);
    } catch (error: any) {
      this.errorMessage.set(this.getPasswordResetErrorMessage(error.code));
    } finally {
      this.isResettingPassword.set(false);
    }
  }

  private getPasswordResetErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later.';
      default:
        return 'Failed to send password reset email. Please try again.';
    }
  }

  async onGoogleLogin() {
    this.isGoogleLoading.set(true);
    this.errorMessage.set('');

    try {
      const userCredential = await this.authService.loginWithGoogle();
      console.log('Google login successful, user:', userCredential.user.uid);
      this.flash.show('Logged in successfully', 'success', 2500);
      
      // Check if profile is complete
      const isComplete = await this.authService.isProfileComplete(userCredential.user.uid);
      console.log('Profile complete:', isComplete);
      
      if (isComplete) {
        console.log('Navigating to /explore');
        this.router.navigate(['/explore']);
      } else {
        console.log('Navigating to /profile-setup');
        this.router.navigate(['/profile-setup']);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
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