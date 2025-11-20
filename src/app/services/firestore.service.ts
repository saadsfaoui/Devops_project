import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  docData, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore: Firestore = inject(Firestore);

  // Get all documents from a collection
  getCollection<T>(collectionName: string): Observable<T[]> {
    const collectionRef = collection(this.firestore, collectionName);
    return collectionData(collectionRef, { idField: 'id' }) as Observable<T[]>;
  }

  // Get documents with query constraints
  getCollectionWithQuery<T>(
    collectionName: string, 
    ...queryConstraints: QueryConstraint[]
  ): Observable<T[]> {
    const collectionRef = collection(this.firestore, collectionName);
    const q = query(collectionRef, ...queryConstraints);
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  // Get a single document by ID
  getDocument<T>(collectionName: string, documentId: string): Observable<T | undefined> {
    const documentRef = doc(this.firestore, collectionName, documentId);
    return docData(documentRef, { idField: 'id' }) as Observable<T | undefined>;
  }

  // Add a new document (auto-generated ID)
  async addDocument<T>(collectionName: string, data: T): Promise<string> {
    try {
      const collectionRef = collection(this.firestore, collectionName);
      const docRef = await addDoc(collectionRef, data as any);
      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  // Set a document with a specific ID
  async setDocument<T>(collectionName: string, documentId: string, data: T): Promise<void> {
    try {
      const documentRef = doc(this.firestore, collectionName, documentId);
      await setDoc(documentRef, data as any);
    } catch (error) {
      console.error('Error setting document:', error);
      throw error;
    }
  }

  // Update an existing document
  async updateDocument<T>(collectionName: string, documentId: string, data: Partial<T>): Promise<void> {
    try {
      const documentRef = doc(this.firestore, collectionName, documentId);
      await updateDoc(documentRef, data as any);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Delete a document
  async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    try {
      const documentRef = doc(this.firestore, collectionName, documentId);
      await deleteDoc(documentRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Get documents by user ID
  getUserDocuments<T>(collectionName: string, userId: string): Observable<T[]> {
    return this.getCollectionWithQuery<T>(
      collectionName,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }
}
