# EarthVibes - Travel Discovery Platform

A modern Angular-based travel platform that helps users explore cities worldwide with real-time data on weather, culture, pollution, bike availability, and music. Features include city comparison, favorites management, user ratings, and a powerful admin dashboard.

## 🌟 Features

- **Interactive City Exploration** - Explore cities on an interactive map with detailed information
- **Real-Time Data** - Weather, air pollution, bike availability, and cultural points of interest
- **City Comparison** - Compare up to 3 cities side-by-side
- **Favorites & Ratings** - Save favorite cities and rate them 1-5 stars
- **User Authentication** - Email/password and Google OAuth sign-in
- **Profile Management** - Complete profile setup for social logins
- **Admin Dashboard** - Comprehensive analytics and user management
  - User statistics (gender, age distribution)
  - City popularity and ratings
  - User account management (disable/enable, delete)
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## 🛠️ Technologies

- **Frontend**: Angular 20.3.4 (Standalone Components)
- **Backend**: Firebase (Authentication, Firestore)
- **Styling**: Custom CSS with modern design patterns
- **APIs**: Weather, Air Quality, Unsplash, and more

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Angular CLI** - Install globally:
  ```bash
  npm install -g @angular/cli
  ```
- **Firebase CLI** - Install globally:
  ```bash
  npm install -g firebase-tools
  ```
- **Git** - [Download](https://git-scm.com/)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/saadsfaoui/Devops_project.git
cd Devops_project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Edit `.env` and configure your admin email:

```env
ADMIN_EMAIL=your-admin-email@example.com
```

### 4. Configure Firebase

#### Option A: Use Existing Firebase Project

The project is already configured with Firebase. You can use the existing configuration or set up your own:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication (Email/Password and Google providers)
4. Enable Firestore Database
5. Copy your Firebase configuration from Project Settings

Update `src/app/app.config.ts` with your Firebase config:

```typescript
provideFirebaseApp(() => initializeApp({
  projectId: "your-project-id",
  appId: "your-app-id",
  storageBucket: "your-storage-bucket",
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  messagingSenderId: "your-messaging-sender-id"
}))
```

#### Option B: Keep Existing Configuration

The project already includes Firebase configuration for the `earthvibesapp` project.

### 5. Deploy Firestore Security Rules

```bash
firebase login
firebase use --add  # Select your Firebase project
firebase deploy --only firestore:rules
```

**Important**: Update the admin email in `firestore.rules` (line 8) to match your `.env` file:

```javascript
function isAdmin() {
  return request.auth != null && request.auth.token.email == 'your-admin-email@example.com';
}
```

### 6. Configure API Keys (Optional)

The app uses various external APIs. To use all features, you may need to configure:

- Weather API
- Air Quality API
- Unsplash API (for city images)

Add these to your Firebase Functions or environment configuration as needed.

### 7. Start Development Server

```bash
ng serve
```

Navigate to `http://localhost:4200/` in your browser. The app will automatically reload on file changes.

## 👤 User Roles

### Regular User
- Register/login with email or Google
- Explore cities and view detailed information
- Add cities to favorites
- Rate favorite cities (1-5 stars)
- Compare up to 3 cities
- Manage account profile

### Admin User
To access admin features, sign in with the email specified in your `.env` file (default: `admin@earthvibes.com`).

Admin capabilities:
- View user statistics (gender, age distribution)
- View city statistics (likes, ratings)
- Manage users (disable/enable accounts, delete users)
- Access comprehensive dashboard at `/admin`

## 📁 Project Structure

```
src/
├── app/
│   ├── components/          # Reusable components
│   │   ├── comparator-column/
│   │   ├── comparator-selector/
│   │   ├── detail-panel/
│   │   └── location-card/
│   ├── guards/              # Route guards
│   │   ├── auth.guard.ts
│   │   └── admin.guard.ts
│   ├── pages/               # Page components
│   │   ├── account/
│   │   ├── admin-dashboard/
│   │   ├── comparateur/
│   │   ├── explore/
│   │   ├── favourites/
│   │   ├── landing/
│   │   ├── login/
│   │   ├── profile-setup/
│   │   ├── register/
│   │   └── voyager/
│   ├── services/            # Business logic services
│   │   ├── admin.service.ts
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   ├── favourites.service.ts
│   │   ├── firestore.service.ts
│   │   └── search.service.ts
│   ├── map/                 # Map component
│   ├── navbar/              # Navigation component
│   └── app.routes.ts        # Route configuration
├── environments/            # Environment configs
└── styles.css              # Global styles
```

## 🔧 Available Scripts

### Development
```bash
npm start           # Start development server
ng serve           # Alternative start command
```

### Building
```bash
ng build           # Build for production
ng build --configuration production
```

### Testing
```bash
ng test            # Run unit tests
ng e2e             # Run end-to-end tests
```

### Firebase Deployment
```bash
firebase deploy --only firestore:rules   # Deploy security rules
firebase deploy --only hosting           # Deploy to Firebase Hosting
firebase deploy                          # Deploy all
```

## 🔐 Security & Firestore Rules

The project includes comprehensive Firestore security rules:

- **Users Collection**: Users can read/write their own profile; admin can read all
- **Favourites Collection**: Users can manage their own; admin can view all
- **Admin Access**: Restricted to email specified in environment configuration

Rules automatically check:
- User authentication
- User ownership of data
- Admin privileges
- Disabled account status

## 🎨 Key Features Implementation

### City Rating System
- Users can rate favorite cities 1-5 stars
- Ratings stored in Firestore with favourites
- Admin dashboard shows average ratings per city
- Interactive star UI in favourites page and detail panel

### Admin Dashboard
- Real-time statistics with Firebase queries
- User demographics visualization
- City popularity metrics with ratings
- User management (disable/enable/delete accounts)

### Profile Completion Flow
- Google sign-in users prompted to complete profile
- Required fields: first name, last name, birth date, gender
- Seamless redirect to profile setup page
- Can update profile anytime from account page

## 🐛 Troubleshooting

### Firebase Permission Errors
- Ensure Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Check that admin email in `firestore.rules` matches your `.env` file

### Authentication Issues
- Verify Firebase Authentication is enabled in Firebase Console
- Check that Email/Password and Google providers are enabled
- Ensure auth domain is correct in `app.config.ts`

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Angular cache: `ng cache clean`
- Check Node.js version: `node --version` (should be v18+)

## 📚 Additional Resources

- [Angular Documentation](https://angular.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Angular CLI Reference](https://angular.dev/tools/cli)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is for educational purposes as part of the EILCO DevOps course.

## 👨‍💻 Developers

**Mohamed Taha Tahereddine**
- GitHub: [@mohamedtahatahereddine](https://github.com/tahereddine)

**Imane Karam**

**Ibrahim Salah**
- GitHub: [@ibrahimsalah](https://github.com/salahibra)

**Saad Sfaoui**
- GitHub: [@saadsfaoui](https://github.com/saadsfaoui)




---

Built with ❤️ using Angular and Firebase
