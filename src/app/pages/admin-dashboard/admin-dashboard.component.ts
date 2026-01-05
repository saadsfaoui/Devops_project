import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, UserStats, CityStats, UserData } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);

  userStats = signal<UserStats | null>(null);
  cityStats = signal<CityStats[]>([]);
  allUsers = signal<UserData[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  selectedTab = signal<'overview' | 'users' | 'cities'>('overview');

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      this.loading.set(true);
      this.error.set(null);

      // Load user statistics
      const stats = await this.adminService.getUserStatistics();
      this.userStats.set(stats);

      // Load city statistics
      const cities = await this.adminService.getCityStatistics();
      this.cityStats.set(cities);

      // Load all users
      this.adminService.getAllUsers().subscribe({
        next: (users) => {
          this.allUsers.set(users);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading users:', err);
          this.error.set('Failed to load users');
          this.loading.set(false);
        }
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      this.error.set('Failed to load dashboard data');
      this.loading.set(false);
    }
  }

  selectTab(tab: 'overview' | 'users' | 'cities') {
    this.selectedTab.set(tab);
  }

  async deleteUser(userId: string, userName: string) {
    if (confirm(`Are you sure you want to delete user ${userName}? This action cannot be undone.`)) {
      try {
        await this.adminService.deleteUserAccount(userId);
        alert('User deleted successfully');
        await this.loadDashboardData();
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user');
      }
    }
  }

  async toggleUserStatus(userId: string, userName: string, currentStatus: boolean) {
    const action = currentStatus ? 'enable' : 'disable';
    if (confirm(`Are you sure you want to ${action} user ${userName}?`)) {
      try {
        await this.adminService.toggleUserStatus(userId, currentStatus);
        alert(`User ${action}d successfully`);
        await this.loadDashboardData();
      } catch (err) {
        console.error('Error toggling user status:', err);
        alert(`Failed to ${action} user`);
      }
    }
  }

  calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  getCreatedAtDate(createdAt: any): Date | null {
    if (!createdAt) return null;
    // Handle Firestore Timestamp
    if (createdAt.toDate && typeof createdAt.toDate === 'function') {
      return createdAt.toDate();
    }
    // Handle JavaScript Date
    if (createdAt instanceof Date) {
      return createdAt;
    }
    // Handle string or timestamp
    return new Date(createdAt);
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
