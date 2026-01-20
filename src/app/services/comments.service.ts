import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { Observable, map, firstValueFrom } from 'rxjs';
import { 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from '@angular/fire/firestore';

export interface Comment {
  id?: string;
  cityName: string;
  country: string;
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  // Get all comments for a specific city
  getCityComments(cityName: string, country: string): Observable<Comment[]> {
    return this.firestoreService.getCollectionWithQuery<any>(
      'comments',
      where('cityName', '==', cityName),
      where('country', '==', country)
    ).pipe(
      map(comments => comments
        .map(comment => ({
          ...comment,
          createdAt: comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt)
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      )
    );
  }

  // Add a new comment
  async addComment(cityName: string, country: string, text: string): Promise<string> {
    const user = await firstValueFrom(this.authService.user$);
    
    if (!user) {
      throw new Error('User must be authenticated to add comments');
    }

    // Get user profile for name
    const userProfile = await firstValueFrom(
      this.firestoreService.getDocument<any>('users', user.uid)
    );

    const comment: Omit<Comment, 'id'> = {
      cityName,
      country,
      userId: user.uid,
      userName: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Anonymous',
      userEmail: user.email || '',
      text,
      createdAt: new Date()
    };

    return await this.firestoreService.addDocument('comments', comment);
  }

  // Delete a comment (only by the owner or admin)
  async deleteComment(commentId: string): Promise<void> {
    const user = await firstValueFrom(this.authService.user$);
    
    if (!user) {
      throw new Error('User must be authenticated to delete comments');
    }

    // Get the comment to verify ownership
    const comment = await firstValueFrom(
      this.firestoreService.getDocument<Comment>('comments', commentId)
    );

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user is the owner
    if (comment.userId !== user.uid) {
      throw new Error('You can only delete your own comments');
    }

    await this.firestoreService.deleteDocument('comments', commentId);
  }

  // Get comments count for a city
  async getCommentsCount(cityName: string, country: string): Promise<number> {
    const comments = await firstValueFrom(
      this.getCityComments(cityName, country)
    );
    return comments.length;
  }
}
