# NestJS Chat Application

A full-stack real-time chat application built with NestJS, React 19, PostgreSQL, and WebSockets.

## 🚀 Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: Passport.js, Google OAuth 2.0, JWT
- **Real-time**: Socket.io
- **Testing**: Jest

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite
- **UI Library**: Ant Design
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **State Management**: TanStack Query
- **Testing**: Vitest

## 📋 Features

- 🔐 Google OAuth 2.0 Authentication
- 🔑 JWT-based Session Management
- 👥 Role-Based Access Control (FREE, PREMIUM, ADMIN)
- 💬 Real-time Messaging
- 📁 File Sharing
- 🎨 Modern UI with Ant Design + Tailwind
- 📱 Responsive Design

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Database Configuration
   DB_HOST=127.0.0.1
   DB_PORT=5433
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=chat_app

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_REFRESH_EXPIRES_IN=7d

   # Application Configuration
   PORT=3000
   NODE_ENV=development

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   ```

4. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE chat_app;
   ```

5. **Run the application**
   ```bash
   npm run start:dev
   ```

   The backend will be available at `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install required packages** (if not already installed)
   ```bash
   npm install @tailwindcss/postcss @ant-design/icons react-router-dom
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── AuthCallback.tsx    # OAuth callback handler
│   │   └── Dashboard.tsx       # Protected dashboard page
│   ├── App.tsx                 # Login page
│   ├── main.tsx                # App entry with routing
│   └── index.css               # Tailwind CSS imports
├── postcss.config.js           # PostCSS with Tailwind v4
└── tailwind.config.js          # Tailwind configuration
```

## 🗄️ Database Schema

### User Entity
- `id` (UUID, Primary Key)
- `email` (Unique, Required)
- `google_id` (Unique, Nullable)
- `display_name` (Required)
- `avatar_url` (Nullable)
- `role` (Enum: FREE, PREMIUM, ADMIN)
- `subscription_status` (Enum: ACTIVE, INACTIVE, CANCELLED, PAST_DUE)
- `status_message` (Nullable, Max 200 chars)
- `stripe_customer_id` (Nullable)
- `is_banned` (Boolean, Default: false)
- `refresh_token` (Nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Configure OAuth consent screen
5. Create OAuth 2.0 credentials (Web application)
6. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
7. Copy Client ID and Client Secret to `.env` file

## 📚 API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/profile` - Get current user profile (Protected)
- `POST /auth/logout` - Logout user (Protected)

### Root
- `GET /` - Health check endpoint

## 📅 Development Timeline

### Sprint 1: System Foundation and Authentication (Feb 2-8, 2026)

#### ✅ Day 1 (Feb 2, 2026) - Project Setup & Database Foundation
**Completed:**
- [x] Initialize NestJS application with TypeScript
- [x] Configure project structure (modules, controllers, services)
- [x] Set up PostgreSQL database connection (port 5433)
- [x] Configure TypeORM with PostgreSQL
- [x] Create initial database configuration
- [x] Set up environment variables (.env configuration)
- [x] Define User entity with all required fields
- [x] Database table created successfully with TypeORM synchronization
- [x] Fixed TypeORM entity type definitions
- [x] Application successfully starts on port 3000

**Issues Resolved:**
- Fixed Docker PostgreSQL authentication issues → switched to pgAdmin
- Fixed TypeORM "Data type Object" errors → added explicit types to nullable fields
- Fixed Google OAuth startup errors → made strategy conditional

#### ✅ Day 2 (Feb 3, 2026) - Google OAuth Implementation
**Completed:**
- [x] Configure Google OAuth credentials (Client ID, Secret)
- [x] Test Google OAuth flow end-to-end
- [x] Implement OAuth callback handler
- [x] Create user service for user creation/retrieval
- [x] Implement automatic user creation on first login
- [x] Install Passport.js and Google OAuth strategy
- [x] Implement Google OAuth authentication module
- [x] Create authentication controller with Google OAuth endpoints
- [x] Set up JWT module

**Status:** All Day 2 tasks complete! Google OAuth fully functional.

#### ✅ Day 3 (Feb 4, 2026) - JWT Authentication & Refresh Tokens + Frontend Integration
**Backend Completed:**
- [x] Implement JWT token generation (access tokens)
- [x] Implement refresh token generation and storage
- [x] Create token refresh endpoint
- [x] Implement token validation middleware
- [x] Create JWT authentication guard
- [x] Add token expiration handling (access: 15min, refresh: 7days)
- [x] Implement logout functionality (token invalidation)
- [x] Store refresh tokens in database
- [x] Generate secure JWT secrets using crypto
- [x] Configure JWT module with secure secrets

**Frontend Completed:**
- [x] Fix Tailwind CSS v4 configuration
- [x] Install @tailwindcss/postcss plugin
- [x] Create login page with Google OAuth button
- [x] Implement React Router with authentication routes
- [x] Create OAuth callback handler page
- [x] Create protected dashboard page
- [x] Implement token storage in localStorage
- [x] Add logout functionality
- [x] Display user profile information
- [x] Update backend callback to redirect with tokens

**Status:** All Day 3 tasks complete! Full-stack authentication working end-to-end.

**Enhancements Completed:**
- [x] Create token cleanup service for expired tokens
- [x] Implement refresh token rotation
- [x] Implement automatic token refresh on expiry
- [x] Add protected route guards
- [x] Set up TanStack Query
- [x] Create authentication context

#### ✅ Day 4 (Feb 4, 2026) - Role-Based Authorization
**Backend Completed:**
- [x] Define role enum (FREE, PREMIUM, ADMIN)
- [x] Update User entity with role field
- [x] Implement role-based authorization guards (RolesGuard)
- [x] Create custom decorators (@Roles, @CurrentUser)
- [x] Create role assignment logic (default: FREE)
- [x] Add role-based access control to endpoints
- [x] Create demo endpoints (/demo/free, /demo/premium, /demo/admin)
- [x] Create user management endpoints (admin-only)
- [x] Implement role update functionality

**Frontend Completed:**
- [x] Create protected route component
- [x] Implement route guards based on authentication
- [x] Create role-based component visibility logic (RoleGate)
- [x] Add role information to auth context
- [x] Create higher-order component for role checking (withRole)
- [x] Implement redirect logic for unauthorized access
- [x] Create "Upgrade to Premium" placeholder UI
- [x] Create role badge component with color coding
- [x] Create useRole hook for easy role checking
- [x] Update dashboard with role-based features

**Status:** All Day 4 tasks complete! Role-based authorization fully implemented.

**Deliverables:**
- ✅ Role-based access control system (FREE, PREMIUM, ADMIN)
- ✅ Protected routes and components
- ✅ Role-specific feature gating
- ✅ Admin user management endpoints

#### ✅ Day 5 (Feb 7, 2026) - User Profile Management
**Backend Completed:**
- [x] Create user profile module
- [x] Implement GET profile endpoint (fetch current user)
- [x] Implement PUT profile endpoint (update profile)
- [x] Add validation for profile updates (displayName 2-50 chars, statusMessage max 200, URL validation)
- [x] Implement profile picture upload endpoint (5MB limit, images only)
- [x] Create DTOs for profile requests/responses
- [x] Add authorization guards to profile endpoints
- [x] Implement error handling for profile operations
- [x] Write unit tests for profile service

**Frontend Completed:**
- [x] Create user profile page component
- [x] Implement profile display UI
- [x] Create profile edit form with Ant Design
- [x] Add form validation
- [x] Implement profile update API integration
- [x] Create avatar upload component
- [x] Add loading and error states
- [x] Create success/error notifications
- [x] Style profile page with Tailwind
- [x] Add profile route to router
- [x] Add navigation to profile from dashboard

**Status:** All Day 5 tasks complete! User profile management fully implemented.

**Deliverables:**
- ✅ User profile management functionality (GET, PUT, POST endpoints)
- ✅ Profile view and edit interfaces with seamless mode switching
- ✅ Profile picture management with upload and validation


## 🧪 Testing

### Backend
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend
```bash
# Unit tests
npm run test

# Coverage
npm run test:coverage
```

## 📝 Scripts

### Backend
- `npm run start` - Start production server
- `npm run start:dev` - Start development server with watch mode
- `npm run start:debug` - Start server in debug mode
- `npm run build` - Build for production
- `npm run test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Muhammad Muzammil

