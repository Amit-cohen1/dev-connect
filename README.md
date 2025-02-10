# DevTogether

DevTogether is a web application designed to connect early-career developers with non-profit organizations and companies, enabling them to gain real-world experience through meaningful projects. The platform facilitates project-based hiring by allowing companies to evaluate potential candidates through their project contributions.

## Table of Contents

- [Technologies Used](#technologies-used)
- [Features](#features)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Technologies Used

- **Frontend:** React, React Router, Context API
- **Backend & Services:** Firebase Authentication, Firestore Database, Firebase Storage, Firebase Hosting
- **Styling:** Tailwind CSS, PostCSS

## Features

- User authentication with Firebase (email/password, Google Sign-in)
- Role-based access control for developers and organizations
- Project creation and management system
- Application system for developers to apply to projects
- Real-time messaging between users
- Notifications system for project updates and messages
- Profile management with achievements and skill tracking
- Avatar selection and customization
- Secure route protection for authenticated users and organizations

## Installation

### Prerequisites

Ensure you have the following installed:

- Node.js (v16 or later)
- npm or yarn

### Steps

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/devtogether.git
   cd devtogether
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and add your Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```
4. Start the development server:
   ```sh
   npm start
   ```

## Project Structure

```
/src
├── components/
│   ├── auth/ (Authentication components)
│   ├── Achievements.js (User achievements display)
│   ├── AvatarSelector.js (Profile avatar selection)
│   ├── Conversations.js (User messaging)
│   ├── MessagingSystem.js (Messaging functionality)
│   ├── Navbar.js (Navigation bar)
│   ├── NotificationSystem.js (User notifications)
│   ├── OrganizationRoute.js (Route protection for organizations)
│   ├── PrivateRoute.js (Route protection for authenticated users)
│   ├── ProjectApplications.js (Project applications management)
│   └── OrganizationRegistration.js (Organization registration)
├── context/
│   └── AuthContext.js (User authentication context)
├── firebase/
│   └── config.js (Firebase configuration)
├── pages/
│   ├── Home.js (Landing page)
│   ├── Login.js (User login page)
│   ├── OrganizationPortal.js (Organization dashboard)
│   ├── Profile.js (User profile)
│   ├── ProjectDetail.js (Project details view)
│   ├── Projects.js (Projects listing and search)
│   ├── Register.js (User registration)
│   ├── UploadProject.js (Project creation form)
│   └── DeveloperRegistration.js (Developer registration)
├── utils/
│   └── notifications.js (Notification utilities)
├── App.js (Main application entry)
├── index.css (Global styles)
└── index.js (Application entry point)
```

## Usage

### Running the App

1. Start the development server:
   ```sh
   npm start
   ```
2. Open `http://localhost:3000` in your browser.

### Authentication

- Users can register as **Developers** or **Organizations**.
- Organizations can post projects and review applications.
- Developers can browse and apply for projects.

### Messaging & Notifications

- Real-time messaging system for project communication.
- Notification system for project updates and messages.


## License

This project is licensed under the MIT License.
