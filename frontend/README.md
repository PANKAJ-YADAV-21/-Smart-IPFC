# 💻 IPFCMS Frontend Web Client — React SPA (Vite)


# 📌 Overview

The **IPFCMS Frontend Web Client** is a modern Single Page Application (SPA) developed for the **Intellectual Property Facilitation Centre Management System (IPFCMS)**.

The frontend provides a responsive and secure user interface for managing Intellectual Property services such as:

- Patent Registration
- Trademark Registration
- Copyright Registration
- Industrial Design Registration

The application is built using **React 19**, powered by **Vite**, and styled using **Tailwind CSS** with smooth animations and modern dashboard layouts.

It enables applicants, staff members, experts, and administrators to interact with the platform through role-based dashboards and workflow-driven interfaces.

---

# ✨ Frontend Features

## 🔐 Authentication & Security
- JWT-based authentication
- Protected routes
- Role-Based Access Control (RBAC)
- Email verification flow
- OTP verification support
- Session persistence using `sessionStorage`

---

## 📝 Application Management
- Multi-step IP application forms
- Dynamic forms based on IP type
- Draft saving functionality
- Application editing and resubmission

---

## 📂 Document Management
- Secure document uploads
- File validation
- Document status tracking
- Download functionality

---

## 📊 Dashboard System
### 👤 Client Dashboard
- Application tracking
- Status monitoring
- Appointment management
- Payment tracking
- Notifications and messaging

### 🧑‍💼 Staff Dashboard
- Application verification
- Document review
- Correction requests
- Workflow forwarding

### ⚖️ Expert Dashboard
- Application review
- Approval/rejection system
- Expert remarks and verification

### ⚙️ Admin Dashboard
- User management
- Analytics overview
- System monitoring
- Staff approval management

---

# 🎨 UI & Design System

The frontend uses a clean and modern UI architecture with:

- Glassmorphism effects
- Responsive layouts
- Dark-themed dashboard design
- Gradient-based UI elements
- Interactive animations
- Smooth transitions
- Mobile-friendly responsiveness

---

# 🏗️ Frontend Tech Stack

| Technology | Purpose |
|------|------|
| React 19 | Frontend Framework |
| Vite | Build Tool |
| Tailwind CSS | Styling Framework |
| Framer Motion | Animations |
| Axios | API Requests |
| React Router DOM | Client-side Routing |
| Lucide React | Icon Library |

---

# 🔧 Core Frontend Modules

## 🔑 Authentication Context (`AuthContext.jsx`)
Responsible for:
- Managing JWT tokens
- Maintaining user session state
- Synchronizing authenticated user data
- Attaching bearer tokens to API requests

Example:

```javascript
const token = sessionStorage.getItem("token");
```

---

## 🛡️ Route Protection (`App.jsx`)
Implements:
- Protected routes
- Role verification
- Email verification checks
- Unauthorized access prevention

---

## 📝 Application Wizard (`ApplicationWizard.jsx`)
Handles:
- Patent applications
- Trademark applications
- Copyright applications
- Industrial Design applications

Features:
- Multi-step forms
- Dynamic validation
- Draft management

---

# 📂 Frontend Folder Structure

```text
frontend/
│
├── public/
│   └── Static assets
│
├── src/
│   ├── assets/
│   │   └── Images, icons, styles
│   │
│   ├── components/
│   │   └── Reusable UI components
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── StaffDashboard.jsx
│   │   ├── ApplicationWizard.jsx
│   │   ├── StaffReviewWizard.jsx
│   │   ├── VerifyEmail.jsx
│   │   └── AccessDenied.jsx
│   │
│   ├── services/
│   │   └── API service handlers
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── tailwind.config.js
├── vite.config.js
├── eslint.config.js
└── package.json
```

---

# 🚀 Frontend Installation & Setup

## ⚙️ Prerequisites

Install the following:

- Node.js v18+
- NPM

---

# 📥 Installation Steps

## 1. Navigate to Frontend Folder

```bash
cd frontend
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Backend API URL

Update Axios base URL inside:

```text
src/context/AuthContext.jsx
```

Example:

```javascript
axios.defaults.baseURL = "http://localhost:8000/api";
```

---

## 4. Start Development Server

```bash
npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

---

## 5. Create Production Build

```bash
npm run build
```

Production files will be generated inside:

```text
dist/
```

---

# 🔒 Security Features

- JWT Authentication
- Protected Routes
- Role-Based Access Control
- Secure API Communication
- Email Verification
- OTP Validation
- Session Persistence

---

# 📡 API Integration

The frontend communicates with the Laravel backend using REST APIs.

Main functionalities include:
- Authentication APIs
- Application APIs
- Document APIs
- Appointment APIs
- Notification APIs

---

# 📱 Responsive Design

The frontend is fully responsive and optimized for:
- Desktop devices
- Tablets
- Mobile devices

---

# 📈 Future Enhancements

- Real-time notifications
- WebSocket chat integration
- Dark/Light mode toggle
- Advanced analytics UI
- Progressive Web App (PWA)
- Multi-language support

---

# 📄 Conclusion

The IPFCMS Frontend Web Client delivers a scalable, responsive, and user-friendly interface for managing Intellectual Property workflows digitally. The application combines secure authentication, modern UI design, and workflow-driven dashboards to provide an efficient user experience for all platform roles.

---

# 👨‍💻 Developed For

Intellectual Property Facilitation Centre Management System