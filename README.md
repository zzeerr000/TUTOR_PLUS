# TutorHub - Tutor & Student Management App

A full-stack application for managing tutoring relationships between tutors and students.

## Features

- 🔐 User authentication (Registration & Login)
- 👥 Role-based access (Tutor/Student)
- 📅 Dynamic calendar with current date
- ✅ Task management
- 💬 Messaging system
- 📊 Progress tracking
- 💰 Finance management

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React Icons

### Backend
- NestJS
- TypeORM
- SQLite
- JWT Authentication
- bcryptjs

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm run start:dev
```

The backend will run on http://localhost:3000

### Frontend Setup

1. Install dependencies (from root directory):
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## Usage

1. Start the backend server first
2. Start the frontend server
3. Open http://localhost:5173 in your browser
4. Register a new account (choose Tutor or Student role)
5. Login with your credentials
6. The app will show different views based on your role

## Database

The SQLite database (`tutorplus.db`) is automatically created in the `backend` directory when you first run the backend server.

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Tasks
- `GET /tasks` - Get user's tasks
- `POST /tasks` - Create new task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
