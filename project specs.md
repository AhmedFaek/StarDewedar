# ⚡ Electrical Manufacturing Platform
## Full System Documentation (Production-Level)

---

# 📌 1. Project Overview

This project is a modern full-stack web platform for an electrical manufacturing company.

The company specializes in:
- Electrical panels
- Industrial lighting (floodlights, LED systems)
- Electrical components
- Custom industrial electrical projects

---

# 🎯 2. Project Goals

The system aims to:

1. Present the company professionally (branding & trust)
2. Showcase products and technical specifications
3. Display completed projects (portfolio)
4. Generate leads:
   - Quote requests
   - Factory visit requests
5. Provide an admin dashboard for full control
6. Automate product data entry using AI

---

# 🏗️ 3. System Architecture

## 3.1 Frontend
- Framework: React (Next.js recommended)
- Styling: Tailwind CSS
- Animations: Framer Motion

---

## 3.2 Backend
- Runtime: Node.js
- Framework: Express.js (or NestJS)

---

## 3.3 Database
- PostgreSQL

---

## 3.4 ORM
- Prisma

---

## 3.5 File Storage
- AWS S3 OR Cloudinary
- Used for:
  - Product images
  - PDF catalogs
  - Uploaded request files

---

## 3.6 AI Integration
- OpenAI API OR local LLM
- Used for:
  - Extracting product data from PDFs
  - Generating specs from product names

---

# 🗄️ 4. Database Design

## 4.1 Design Principles

- Use UUID as primary keys
- Use relational structure
- Avoid hardcoded fields for specifications
- Support scalability and flexibility

---

## 4.2 Tables Overview

---

### 🔹 Users (Admins)
- Authentication and access control

Fields:
- id (UUID, PK)
- name
- email (unique)
- password (hashed)
- role
- created_at
- updated_at

---

### 🔹 Categories
Used for:
- Products
- Projects

Fields:
- id
- name
- type ('product' | 'project')
- created_at
- updated_at

---

### 🔹 Products

Fields:
- id
- name
- description
- price
- category_id (FK)
- created_at
- updated_at

---

### 🔹 Product Images

Fields:
- id
- product_id (FK)
- image_url
- created_at

---

### 🔹 Product Catalogs

Fields:
- id
- product_id (FK)
- file_url (PDF)
- title
- created_at

---

### 🔹 Product Specifications (IMPORTANT)

Dynamic key-value structure.

Fields:
- id
- product_id (FK)
- key (e.g. "Voltage")
- value (e.g. "220V")
- created_at

---

### 🔹 Projects

Fields:
- id
- title
- description
- category_id (FK)
- client_name
- created_at
- updated_at

---

### 🔹 Project Images

Fields:
- id
- project_id (FK)
- image_url
- created_at

---

### 🔹 Quote Requests

Fields:
- id
- first_name
- last_name
- phone
- email
- product_id (optional FK)
- details
- file_url
- status ('new', 'contacted', 'closed')
- created_at
- updated_at

---

### 🔹 Visit Requests

Fields:
- id
- factory_name
- factory_activity
- name
- phone_number
- whatsapp_number
- email
- address
- preferred_date
- details
- status ('new', 'contacted', 'scheduled', 'closed')
- created_at
- updated_at

---

### 🔹 Contact Messages

Fields:
- id
- first_name
- last_name
- email
- phone_number
- whatsapp_number
- message
- created_at

---

# 🤖 5. AI System Design

---

## 5.1 Purpose

Automate product data entry by extracting structured data from:
- PDF catalogs
- Product names

---

## 5.2 AI Features

### 1. PDF Extraction
Extract:
- Product name
- Description
- Technical specifications

---

### 2. Autofill System
- Populate admin product form automatically

---

### 3. AI Search (Fallback)
- Generate specs based on product name

---

## 5.3 AI Output Format

```json
{
  "name": "string",
  "description": "string",
  "specifications": [
    {
      "key": "string",
      "value": "string"
    }
  ]
}