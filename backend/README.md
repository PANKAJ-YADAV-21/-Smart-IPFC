# 💻 IPFCMS Backend Core — Laravel REST API

[![Laravel](https://img.shields.io/badge/Backend-Laravel%2013-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![JWT](https://img.shields.io/badge/Auth-JWT%20Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

---

# 📌 Overview

The **IPFCMS Backend Core** is the server-side engine of the **Intellectual Property Facilitation Centre Management System (IPFCMS)**.

It is built using **Laravel 13** and follows a RESTful API architecture to manage authentication, intellectual property applications, document verification, workflow management, appointments, notifications, and user administration.

The backend provides secure, scalable, and role-based APIs for:

- Clients
- Staff Members
- Legal Experts
- Administrators

The system supports the management of:

- Patent Applications
- Trademark Registrations
- Copyright Registrations
- Industrial Design Registrations

---

# ✨ Backend Features

## 🔐 Authentication & Security
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Secure API middleware
- Email verification system
- OTP-based password reset
- Protected API routes

---

## 📝 Application Management
- Create and manage IP applications
- Multi-type application support
- Draft saving and updating
- Status tracking system
- Review and approval workflow

---

## 📂 Document Management
- Secure file uploads
- Document validation
- Verification workflow
- Protected file downloads

---

## ⚙️ Workflow & Review System
- Staff verification workflow
- Expert review process
- Application approval/rejection
- Revision request handling
- Workflow history tracking

---

## 📅 Appointment Management
- Consultation scheduling
- Appointment status updates
- Staff and expert coordination

---

## 💬 Communication & Notifications
- Notification system
- In-app messaging support
- Real-time workflow updates

---

## 📊 Admin Management
- User management
- Role management
- Staff approval system
- System analytics APIs

---

# 🏗️ Backend Architecture

The backend follows a modular and scalable architecture:

- RESTful API Design
- Stateless JWT Authentication
- Service Layer Architecture
- Middleware-based Security
- Eloquent ORM Database Management
- Structured Request Validation
- JSON Resource Responses

---

# 🛠️ Technology Stack

| Technology | Purpose |
|------|------|
| Laravel 13 | Backend Framework |
| PHP 8.2+ | Server-side Language |
| MySQL | Database |
| JWT Authentication | API Security |
| Eloquent ORM | Database ORM |
| Composer | Dependency Management |

---

# 📂 Backend Folder Structure

```text
backend/
│
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       ├── Auth Controllers
│   │   │       ├── Application Controllers
│   │   │       ├── Admin Controllers
│   │   │       └── Document Controllers
│   │   │
│   │   ├── Middleware/
│   │   │   ├── JWT Authentication
│   │   │   └── Role Middleware
│   │   │
│   │   └── Requests/
│   │       └── Request Validation Classes
│   │
│   ├── Models/
│   │   ├── User.php
│   │   ├── IpApplication.php
│   │   ├── Patent.php
│   │   ├── Trademark.php
│   │   ├── Copyright.php
│   │   ├── IndustrialDesign.php
│   │   ├── Document.php
│   │   ├── Appointment.php
│   │   ├── Notification.php
│   │   └── WorkflowHistory.php
│   │
│   └── Services/
│       └── Business Logic Services
│
├── config/
├── database/
│   ├── migrations/
│   ├── factories/
│   └── seeders/
│
├── routes/
│   └── api.php
│
├── tests/
│
└── composer.json
```

---

# 🚀 Backend Setup & Installation

## ⚙️ Prerequisites

Install the following before setup:

- PHP 8.2+
- Composer
- MySQL Server / MariaDB
- OpenSSL Extension
- GD Extension

---

# 📥 Installation Steps

## 1. Navigate to Backend Directory

```bash
cd backend
```

---

## 2. Install Dependencies

```bash
composer install
```

---

## 3. Create Environment File

```bash
cp .env.example .env
```

---

## 4. Configure Environment Variables

Update `.env` file:

```env
APP_NAME=IPFCMS
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ipfcms
DB_USERNAME=root
DB_PASSWORD=your_password

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="no-reply@ipfcms.com"
MAIL_FROM_NAME="${APP_NAME}"
```

---

## 5. Generate Application Key

```bash
php artisan key:generate
```

---

## 6. Generate JWT Secret

```bash
php artisan jwt:secret
```

---

## 7. Run Database Migrations

```bash
php artisan migrate
```

---

## 8. Start Development Server

```bash
php artisan serve
```

Backend server will run at:

```text
http://localhost:8000
```

---

# 🔒 Middleware & Security

## Authentication Middleware

```php
auth:api
```

Ensures:
- Valid JWT token
- Authenticated user access

---

## Role Middleware

```php
role:admin
role:staff
role:expert
role:client
```

Ensures:
- Role-based route access
- Secure endpoint restrictions

---

# 📡 API Modules

## 🔑 Authentication APIs
- User registration
- Login & logout
- Token refresh
- Password reset
- Email verification

---

## 📝 Application APIs
- Create application
- Update application
- View applications
- Status management
- Review submissions

---

## 📂 Document APIs
- Upload documents
- Download files
- Document verification
- File management

---

## 📅 Appointment APIs
- Book appointments
- Manage schedules
- Appointment status updates

---

## 📊 Admin APIs
- User management
- Analytics APIs
- Staff approval APIs
- System monitoring

---

# 🗄️ Database Models

| Model | Description |
|------|------|
| User | Stores users and roles |
| IpApplication | Main application records |
| Patent | Patent-specific data |
| Trademark | Trademark details |
| Copyright | Copyright information |
| IndustrialDesign | Design registration details |
| Document | Uploaded file records |
| Payment | Payment information |
| Appointment | Consultation schedules |
| ChatMessage | Messaging system |
| Notification | Notifications |
| WorkflowHistory | Status history tracking |

---

# 🧪 Testing

Run backend tests using:

```bash
php artisan test
```

---

# 📈 Future Enhancements

- Real-time notifications
- WebSocket integration
- API rate limiting
- Advanced analytics
- Cloud storage integration
- Payment gateway integration
- Multi-language API support

---

# 📄 Conclusion

The IPFCMS Backend Core provides a secure, scalable, and modular REST API infrastructure for managing Intellectual Property workflows digitally. The backend is designed to support secure authentication, workflow automation, document management, and role-based access for all platform users.

---

# 👨‍💻 Developed For

Intellectual Property Facilitation Centre Management System
