import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { authState } from '@angular/fire/auth';
import { from, switchMap, map, take } from 'rxjs';

export const authGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const firestore = inject(Firestore);

  return authState(auth).pipe(
    take(1),
    switchMap(async (user) => {
      if (!user) {
        router.navigate(['/login']);
        return false;
      }

      // Check if user account is disabled
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data()['disabled'] === true) {
          await auth.signOut();
          router.navigate(['/login']);
          alert('Your account has been disabled. Please contact the administrator.');
          return false;
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }

      return true;
    })
  );
};
