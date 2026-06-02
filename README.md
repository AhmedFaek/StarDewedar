# Star Dewedar Website & Management System

A full-stack web platform built for **Star Dewedar Co.**, a company specialized in **civil works, electrical infrastructure, and low-voltage electrical equipment supply and installation**.

The platform consists of:

* Public Company Website
* Admin Dashboard (CMS)
* REST API Backend
* PostgreSQL Database
* AI-powered product enrichment (upcoming)
* RAG-based technical assistant chatbot (upcoming)

---

## Features

### Public Website

* Multi-language support (English / Arabic)
* Responsive design
* Products catalog
* Projects showcase
* Project details pages
* Product details pages
* Contact page
* About page
* Request a Quote form
* Request a Site Visit form

---

### User Accounts

* User Registration
* User Login
* JWT Authentication
* Refresh Token Authentication
* Forgot Password
* Password Reset
* Change Password

---

### Customer Features

* Save favorite products
* View previous quote requests
* Faster request submission through saved profile information
* Request tracking

---

### Admin Dashboard

* Secure authentication
* Role-based access control
* Product management
* Project management
* Category management
* Contact messages management
* Quote requests management
* Visit requests management
* Image uploads
* Catalog uploads
* Request status updates

---

### AI Features (Planned)

#### Product Catalog Assistant

Upload product catalogs (PDFs) and automatically generate:

* Product descriptions
* Technical specifications
* Product summaries

Powered by:

* OpenAI
* PDF processing
* Structured extraction

---

#### Technical AI Assistant (RAG)

Users can ask questions about:

* Products
* Projects
* Catalogs
* Technical documentation

Architecture:

Frontend Chat Widget
↓
Backend API
↓
AI Agent
↓
PostgreSQL + pgvector
↓
LLM Response

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* i18next

### Admin Dashboard

* React
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js
* Prisma ORM

### Database

* PostgreSQL

### Authentication

* JWT Access Tokens
* JWT Refresh Tokens
* Password Reset Tokens

### File Storage

* Cloudinary

### Email Service

* Nodemailer

### AI Services

* OpenAI
* pgvector
* PDF Processing

---

## Database Models

### Core Entities

* Users
* Categories
* Products
* Product Images
* Product Catalogs
* Projects
* Project Images
* Quote Requests
* Visit Requests
* Contact Messages

---

## API Modules

### Authentication

* Login
* Register
* Refresh Token
* Forgot Password
* Reset Password
* Change Password

### Products

* CRUD Operations
* Image Management
* Catalog Management

### Projects

* CRUD Operations
* Image Management

### Categories

* CRUD Operations

### Quote Requests

* Create Request
* Status Tracking

### Visit Requests

* Create Request
* Status Tracking

### Contact Messages

* Create Message
* Admin Management

---

## Project Structure

```text
frontend/
├── components/
├── pages/
├── services/
├── hooks/
├── locales/

backend/
├── modules/
│   ├── auth/
│   ├── products/
│   ├── projects/
│   ├── categories/
│   ├── quoteRequests/
│   ├── visitRequests/
│   └── contactMessages/
│
├── prisma/
├── middlewares/
├── utils/

admin-dashboard/
├── pages/
├── components/
├── services/
```

---

## Future Improvements

* AI Product Assistant
* Technical RAG Chatbot
