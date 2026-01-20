import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FavouritesService } from '../../services/favourites.service';
import { FlashService } from '../../services/flash.service';
import { ApiService } from '../../services/api.service';
import { CommentsService, Comment } from '../../services/comments.service';
import { AuthService } from '../../services/auth.service';

export interface BikeData {
  status: string;
  available: number;
  closestStation: string;
  walkTime: string;
}

export interface LocationDetail {
  name: string;
  country: string;
  date: string;
  time: string;
  imageUrl: string;
  tab: 'weather' | 'culture' | 'music' | 'bike' | 'pollution';
  weatherData?: any;
  cultureData?: any;
  musicData?: any;
  bikeData?: BikeData;
  pollutionData?: any;
  latitude?: number;
  longitude?: number;
}

@Component({
  selector: 'app-detail-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './detail-panel.html',
  styleUrl: './detail-panel.css'
})
export class DetailPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() location!: LocationDetail;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() tabChange = new EventEmitter<string>();

  activeTab: 'weather' | 'culture' | 'music' | 'bike' | 'pollution' | 'comments' = 'bike';
  isFavourite = signal(false);
  isTogglingFavourite = signal(false);
  currentRating = signal<number | undefined>(undefined);
  isUpdatingRating = signal(false);
  cultureEvents = signal<any[]>([]);
  loadingCulture = signal(false);
  musicData = signal<any>(null);
  loadingMusic = signal(false);
  comments = signal<Comment[]>([]);
  loadingComments = signal(false);
  newComment = signal('');
  isAddingComment = signal(false);
  currentUser = signal<any>(null);
  private commentsSubscription?: Subscription;

  constructor(
    private favouritesService: FavouritesService,
    private flashService: FlashService,
    private apiService: ApiService,
    private commentsService: CommentsService,
    private authService: AuthService
  ) {}

  tabs = [
    { icon: '☀️', label: 'Météo', value: 'weather' },
    { icon: '🗽', label: 'Culture', value: 'culture' },
    { icon: '🎶', label: 'Musique', value: 'music' },
    { icon: '🚲', label: 'Vélo', value: 'bike' },
    { icon: '💨', label: 'Air pollution', value: 'pollution' },
    { icon: '💬', label: 'Comments', value: 'comments' }
  ];

  ngOnInit() {
    this.checkFavouriteStatus();
    this.authService.user$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['location'] && !changes['location'].firstChange) {
      this.checkFavouriteStatus();
      this.checkRating();
      this.cultureEvents.set([]);
      this.musicData.set(null);
      this.comments.set([]);
      this.newComment.set('');
      // Unsubscribe from previous comments and reload if on comments tab
      if (this.commentsSubscription) {
        this.commentsSubscription.unsubscribe();
        this.commentsSubscription = undefined;
      }
      if (this.activeTab === 'comments') {
        this.loadComments();
      }
    }
  }

  ngOnDestroy() {
    if (this.commentsSubscription) {
      this.commentsSubscription.unsubscribe();
    }
  }

  checkFavouriteStatus() {
    if (this.location?.name && this.location?.country) {
      this.favouritesService.isFavourite(this.location.name, this.location.country).subscribe(
        isFav => this.isFavourite.set(isFav)
      );
    }
  }

  checkRating() {
    if (this.location?.name && this.location?.country) {
      this.favouritesService.getRating(this.location.name, this.location.country).subscribe(
        rating => this.currentRating.set(rating)
      );
    }
  }

  loadCultureEvents() {
    if (this.cultureEvents().length > 0 || this.loadingCulture()) {
      return; // Already loaded or loading
    }

    this.loadingCulture.set(true);
    
    this.apiService.getEvents(this.location.name)
      .then(events => {
        this.cultureEvents.set(events || []);
      })
      .catch(err => {
        console.error('Failed to load culture events:', err);
        this.flashService.show('Failed to load events', 'error');
        this.cultureEvents.set([]);
      })
      .finally(() => {
        this.loadingCulture.set(false);
      });
  }

  loadMusicData() {
    if (this.musicData() || this.loadingMusic()) {
      return; // Already loaded or loading
    }

    this.loadingMusic.set(true);

    this.apiService.getCountryFromCity(this.location.name)
      .then(country => this.apiService.getMusicByCountry(country))
      .then(data => {
        this.musicData.set(data);
      })
      .catch(err => {
        console.error('Failed to load music data:', err);
        this.flashService.show('Failed to load music data', 'error');
        this.musicData.set(null);
      })
      .finally(() => {
        this.loadingMusic.set(false);
      });
  }

  async toggleFavourite(event: Event) {
    event.stopPropagation();
    
    if (this.isTogglingFavourite()) return;
    
    if (!this.location.country || this.location.latitude === undefined || this.location.longitude === undefined) {
      this.flashService.show('Missing location information', 'error');
      return;
    }

    this.isTogglingFavourite.set(true);

    try {
      const added = await this.favouritesService.toggleFavourite(
        this.location.name,
        this.location.country,
        this.location.latitude,
        this.location.longitude
      );
      
      if (added) {
        this.flashService.show(`${this.location.name} added to favourites`, 'success');
      } else {
        this.flashService.show(`${this.location.name} removed from favourites`, 'success');
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      this.flashService.show('Failed to update favourites', 'error');
    } finally {
      this.isTogglingFavourite.set(false);
    }
  }

  onTabClick(tabValue: string) {
    this.activeTab = tabValue as any;
    this.tabChange.emit(tabValue);
    
    // Load data when specific tabs are clicked
    if (tabValue === 'culture') {
      this.loadCultureEvents();
    } else if (tabValue === 'music') {
      this.loadMusicData();
    } else if (tabValue === 'comments') {
      this.loadComments();
    }
  }

  onClose() {
    this.close.emit();
  }

  async updateRating(rating: number, event: Event) {
    event.stopPropagation();
    
    if (this.isUpdatingRating()) return;
    
    if (!this.isFavourite()) {
      this.flashService.show('Please add to favourites first to rate', 'error');
      return;
    }

    this.isUpdatingRating.set(true);

    try {
      await this.favouritesService.updateRating(
        this.location.name,
        this.location.country,
        rating
      );
      this.currentRating.set(rating);
      this.flashService.show(`Rated ${this.location.name} ${rating} stars`, 'success');
    } catch (error) {
      console.error('Error updating rating:', error);
      this.flashService.show('Failed to update rating', 'error');
    } finally {
      this.isUpdatingRating.set(false);
    }
  }

  getRatingArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  loadComments() {
    // Unsubscribe from previous subscription if exists
    if (this.commentsSubscription) {
      this.commentsSubscription.unsubscribe();
    }
    
    this.loadingComments.set(true);
    
    this.commentsSubscription = this.commentsService.getCityComments(this.location.name, this.location.country)
      .subscribe({
        next: (comments) => {
          this.comments.set(comments);
          this.loadingComments.set(false);
        },
        error: (err) => {
          console.error('Failed to load comments:', err);
          this.flashService.show('Failed to load comments', 'error');
          this.loadingComments.set(false);
        }
      });
  }

  async addComment() {
    if (!this.newComment().trim()) {
      this.flashService.show('Please enter a comment', 'error');
      return;
    }

    if (!this.currentUser()) {
      this.flashService.show('Please login to add comments', 'error');
      return;
    }

    this.isAddingComment.set(true);

    try {
      await this.commentsService.addComment(
        this.location.name,
        this.location.country,
        this.newComment()
      );
      this.newComment.set('');
      this.flashService.show('Comment added successfully', 'success');
      // No need to reload - the subscription will automatically update
    } catch (error) {
      console.error('Error adding comment:', error);
      this.flashService.show('Failed to add comment', 'error');
    } finally {
      this.isAddingComment.set(false);
    }
  }

  async deleteComment(commentId: string | undefined) {
    if (!commentId) return;

    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await this.commentsService.deleteComment(commentId);
      this.flashService.show('Comment deleted successfully', 'success');
      // No need to reload - the subscription will automatically update
    } catch (error) {
      console.error('Error deleting comment:', error);
      this.flashService.show('Failed to delete comment', 'error');
    }
  }

  canDeleteComment(comment: Comment): boolean {
    return this.currentUser() && comment.userId === this.currentUser().uid;
  }

  formatCommentDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
}
