import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Observable } from 'rxjs';
import { orderBy, Timestamp } from '@angular/fire/firestore';

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date | Timestamp | any;
  status: 'new' | 'read' | 'replied';
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private firestoreService = inject(FirestoreService);
  private readonly collectionName = 'contactMessages';

  // Submit a contact message
  async submitMessage(name: string, email: string, message: string): Promise<string> {
    const contactMessage: Omit<ContactMessage, 'id'> = {
      name,
      email,
      message,
      createdAt: new Date(),
      status: 'new'
    };

    try {
      const docId = await this.firestoreService.addDocument(this.collectionName, contactMessage);
      return docId;
    } catch (error) {
      console.error('Error submitting contact message:', error);
      throw error;
    }
  }

  // Get all contact messages (for admin)
  getAllMessages(): Observable<ContactMessage[]> {
    return this.firestoreService.getCollectionWithQuery<ContactMessage>(
      this.collectionName,
      orderBy('createdAt', 'desc')
    );
  }

  // Update message status
  async updateMessageStatus(messageId: string, status: 'new' | 'read' | 'replied'): Promise<void> {
    try {
      await this.firestoreService.updateDocument<ContactMessage>(
        this.collectionName,
        messageId,
        { status }
      );
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.firestoreService.deleteDocument(this.collectionName, messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
}
