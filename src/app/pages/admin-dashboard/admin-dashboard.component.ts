import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, UserStats, CityStats, UserData } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
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
  filteredUsers = signal<UserData[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  selectedTab = signal<'overview' | 'users' | 'cities'>('overview');
  searchQuery = signal<string>('');
  lastUpdated = signal<Date | null>(null);
  
  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);
  
  // Engagement metrics
  totalRatings = signal<number>(0);
  totalLikes = signal<number>(0);
  averageRating = signal<number>(0);
  activeUsersCount = signal<number>(0);

  // Pie chart data signals
  genderChartData = signal<any>({ labels: [], datasets: [] });
  ageGroupChartData = signal<any>({ labels: [], datasets: [] });
  topCitiesChartData = signal<any>({ labels: [], datasets: [] });
  userActivityChartData = signal<any>({ labels: [], datasets: [] });
  citiesComparisonChartData = signal<any>({ labels: [], datasets: [] });

  // Chart options
  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12, weight: 500 as any },
          padding: 15,
          color: '#333'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8
      }
    }
  };

  activityChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { size: 12, weight: 500 as any },
          color: '#333',
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#666'
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.1)'
        }
      } as any,
      x: {
        ticks: {
          color: '#666'
        },
        grid: {
          display: false
        }
      } as any
    }
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { size: 12, weight: 500 as any },
          color: '#333',
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.label === 'Ratings') {
              label += context.parsed.y.toFixed(1) + '/5';
            } else {
              label += context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Likes'
        },
        ticks: {
          color: '#666'
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.1)'
        }
      } as any,
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Rating (out of 5)'
        },
        ticks: {
          color: '#666'
        },
        grid: {
          drawOnChartArea: false
        }
      } as any,
      x: {
        ticks: {
          color: '#666'
        },
        grid: {
          display: false
        }
      } as any
    }
  };

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

      // Prepare chart data (except activity which needs users data)
      this.prepareGenderChartData();
      this.prepareAgeGroupChartData();
      this.prepareTopCitiesChartData();
      this.prepareCitiesComparisonChartData();
      
      // Calculate engagement metrics
      this.calculateEngagementMetrics();
      
      // Set last updated timestamp
      this.lastUpdated.set(new Date());

      // Load all users
      this.adminService.getAllUsers().subscribe({
        next: (users) => {
          this.allUsers.set(users);
          this.filteredUsers.set(users);
          // Prepare user activity chart after users are loaded
          this.prepareUserActivityChartData();
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

  onSearchChange(query: string) {
    this.searchQuery.set(query.toLowerCase());
    this.currentPage.set(1); // Reset to first page on search
    this.filterUsers();
  }

  filterUsers() {
    const query = this.searchQuery();
    const allUsers = this.allUsers();
    
    if (!query) {
      this.filteredUsers.set(allUsers);
      return;
    }

    const filtered = allUsers.filter(user =>
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.sexe?.toLowerCase().includes(query)
    );
    
    this.filteredUsers.set(filtered);
  }

  getPaginatedUsers(): UserData[] {
    const filtered = this.filteredUsers();
    const page = this.currentPage();
    const itemsPerPage = this.itemsPerPage();
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filtered.slice(start, end);
  }

  getTotalPages(): number {
    const filtered = this.filteredUsers();
    const itemsPerPage = this.itemsPerPage();
    return Math.ceil(filtered.length / itemsPerPage);
  }

  goToPage(page: number) {
    const totalPages = this.getTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.currentPage.set(page);
    }
  }

  nextPage() {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentPage();
    if (currentPage < totalPages) {
      this.currentPage.set(currentPage + 1);
    }
  }

  prevPage() {
    const currentPage = this.currentPage();
    if (currentPage > 1) {
      this.currentPage.set(currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  refreshData() {
    this.loadDashboardData();
  }

  exportUsersData() {
    try {
      const users = this.filteredUsers();
      const csv = this.convertToCSV(users);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data');
    }
  }

  private convertToCSV(users: UserData[]): string {
    if (users.length === 0) return '';
    
    const headers = ['First Name', 'Last Name', 'Email', 'Gender', 'Age', 'Status', 'Created At'];
    const rows = users.map(user => [
      user.firstName || '',
      user.lastName || '',
      user.email || '',
      user.sexe || '',
      this.calculateAge(user.birthDate),
      user.disabled ? 'Disabled' : 'Active',
      this.getCreatedAtDate(user.createdAt)?.toLocaleDateString() || ''
    ]);

    const headerRow = headers.join(',');
    const dataRows = rows.map(row => row.map(cell => `"${cell}"`).join(','));
    
    return [headerRow, ...dataRows].join('\n');
  }

  calculateEngagementMetrics() {
    const cities = this.cityStats();
    
    let totalRatings = 0;
    let totalLikes = 0;
    let sumRatings = 0;

    cities.forEach(city => {
      totalLikes += city.likeCount || 0;
      totalRatings += city.totalRatings || 0;
      sumRatings += (city.averageRating || 0) * (city.totalRatings || 1);
    });

    const avgRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
    const stats = this.userStats();
    const activeCount = stats ? Math.round(stats.totalUsers * 0.7) : 0;

    this.totalRatings.set(totalRatings);
    this.totalLikes.set(totalLikes);
    this.averageRating.set(Math.round(avgRating * 10) / 10);
    this.activeUsersCount.set(activeCount);
  }

  prepareUserActivityChartData() {
    const allUsers = this.allUsers();
    
    // Count users by their actual registration month
    const monthCounts = new Map<number, number>();
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months with 0
    for (let i = 0; i < 12; i++) {
      monthCounts.set(i, 0);
    }

    // Get current year and month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Count users by their registration month
    allUsers.forEach(user => {
      if (user.createdAt) {
        const createdDate = this.getCreatedAtDate(user.createdAt);
        if (createdDate && createdDate.getFullYear() === currentYear) {
          const monthIndex = createdDate.getMonth();
          monthCounts.set(monthIndex, (monthCounts.get(monthIndex) || 0) + 1);
        }
      }
    });

    // Get last 4 months + current month (5 months total)
    const displayMonths: string[] = [];
    const userData: number[] = [];
    
    for (let i = 4; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      displayMonths.push(monthLabels[monthIndex]);
      userData.push(monthCounts.get(monthIndex) || 0);
    }

    this.userActivityChartData.set({
      labels: displayMonths,
      datasets: [
        {
          label: 'New Users',
          data: userData,
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.1)',
          borderWidth: 3,
          fill: true,
          pointBackgroundColor: '#34d399',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4
        }
      ]
    });
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

  // Pie chart data preparation methods
  prepareGenderChartData() {
    const stats = this.userStats();
    if (!stats) return;

    const genderLabels = Object.keys(stats.usersBySex);
    const genderValues = Object.values(stats.usersBySex);
    const genderColors = ['#34d399', '#1abc9c', '#17a2b8', '#04444C'];

    this.genderChartData.set({
      labels: genderLabels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
      datasets: [
        {
          data: genderValues,
          backgroundColor: genderColors.slice(0, genderLabels.length),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 10
        }
      ]
    });
  }

  prepareAgeGroupChartData() {
    const stats = this.userStats();
    if (!stats) return;

    const ageLabels = Object.keys(stats.usersByAge);
    const ageValues = Object.values(stats.usersByAge);
    const ageColors = ['#34d399', '#20c997', '#1abc9c', '#17a2b8', '#04444C'];

    this.ageGroupChartData.set({
      labels: ageLabels,
      datasets: [
        {
          data: ageValues,
          backgroundColor: ageColors.slice(0, ageLabels.length),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 10
        }
      ]
    });
  }

  prepareTopCitiesChartData() {
    const topCities = this.cityStats().slice(0, 8);
    if (topCities.length === 0) return;

    const cityLabels = topCities.map(city => `${city.cityName}`);
    const cityValues = topCities.map(city => city.likeCount);
    const cityColors = [
      '#34d399', '#20c997', '#1abc9c', '#17a2b8',
      '#04444C', '#114936', '#0f5c3d', '#0d4531'
    ];

    this.topCitiesChartData.set({
      labels: cityLabels,
      datasets: [
        {
          data: cityValues,
          backgroundColor: cityColors.slice(0, topCities.length),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 10
        }
      ]
    });
  }

  prepareCitiesComparisonChartData() {
    const topCities = this.cityStats().slice(0, 10);
    if (topCities.length === 0) return;

    const cityLabels = topCities.map(city => city.cityName);
    const likesData = topCities.map(city => city.likeCount);
    const ratingsData = topCities.map(city => city.averageRating || 0);

    this.citiesComparisonChartData.set({
      labels: cityLabels,
      datasets: [
        {
          label: 'Likes',
          data: likesData,
          backgroundColor: '#34d399',
          borderColor: '#20c997',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Ratings',
          data: ratingsData,
          backgroundColor: '#1abc9c',
          borderColor: '#17a2b8',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y1'
        }
      ]
    });
  }
}
