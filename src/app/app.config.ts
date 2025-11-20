import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()), provideFirebaseApp(() => initializeApp({ projectId: "earthvibesapp", appId: "1:991705463606:web:4e0a1e7182370b5b389197", storageBucket: "earthvibesapp.firebasestorage.app", apiKey: "AIzaSyAbNr5NtBWNNpXEw9T1zrP5mi6_VO2Wxuk", authDomain: "earthvibesapp.firebaseapp.com", messagingSenderId: "991705463606", projectNumber: "991705463606", version: "2" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())
  ]
};
