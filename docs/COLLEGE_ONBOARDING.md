# College Central

## Institutional Onboarding Documentation

**Version:** 2.0  
**Last Updated:** December 2025

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Platform Features](#2-platform-features)
3. [Prerequisites](#3-prerequisites)
4. [Firebase Project Setup](#4-firebase-project-setup)
5. [Information Required](#5-information-required)
6. [Deliverables](#6-deliverables)
7. [Admin Panel Operations](#7-admin-panel-operations)
8. [Data Security & Privacy](#8-data-security--privacy)
9. [Support & Contact](#9-support--contact)
10. [Frequently Asked Questions](#10-frequently-asked-questions)

---

## 1. Introduction

College Central is a comprehensive campus management platform designed to streamline academic operations and enhance student experience. The platform provides a unified interface for academic calendars, course schedules, campus directories, and essential institutional resources.

This document outlines the prerequisites and procedures for onboarding your institution to the College Central platform.

---

## 2. Platform Features

| Module | Description |
|--------|-------------|
| **Academic Calendar** | Semester schedules, examination dates, holidays, and institutional events |
| **Course Management** | Timetables with class schedules, room allocations, and faculty assignments |
| **Campus Directory** | Searchable faculty and staff contact information |
| **Forms Repository** | Centralized access to downloadable institutional forms |
| **Campus Map** | Interactive campus navigation with building locations |
| **Student Dashboard** | Personal grade tracking, profile management, and activity feed |
| **Quick Links** | Curated links to important institutional resources |
| **Weather Integration** | Local weather information based on campus location |

---

## 3. Prerequisites

The following prerequisites must be fulfilled before platform deployment:

### 3.1 Google Workspace Requirements

| Requirement | Description |
|-------------|-------------|
| **Google Workspace Domain** | Your institution must have a Google Workspace (formerly G Suite) domain configured for institutional email addresses |
| **Email Domain** | Institutional email suffix (e.g., `@iitism.ac.in`) |
| **Google Account Access** | Users must have Google accounts with institutional email addresses |

### 3.2 Firebase Project Requirements

Your institution must create and configure a Firebase project. The following credentials are required:

| Credential | Description |
|------------|-------------|
| **Firebase Project ID** | Unique identifier for your Firebase project |
| **Firebase API Key** | Web API key from Firebase Console |
| **Firebase Auth Domain** | Authentication domain (format: `<project-id>.firebaseapp.com`) |
| **Firebase Storage Bucket** | Storage bucket URL (format: `<project-id>.appspot.com`) |
| **Firebase Messaging Sender ID** | Cloud Messaging sender ID |
| **Firebase App ID** | Web application ID |
| **Firebase Measurement ID** | Google Analytics measurement ID |
| **Firebase Service Account JSON** | Service account credentials for deployment |

### 3.3 Optional Requirements

| Requirement | Description |
|-------------|-------------|
| **Custom Domain** | If required (e.g., `central.iitism.ac.in`), DNS configuration access is needed |
| **SSL Certificate** | Automatically provisioned by Firebase Hosting |

---

## 4. Firebase Project Setup

Follow these steps to create and configure your Firebase project:

### Step 1: Create Firebase Project

1. Navigate to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Enter project name: `college-central-<institution-id>` (e.g., `college-central-iitism`)
4. Configure Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. Navigate to **Build → Authentication**
2. Click **"Get started"**
3. Select **Sign-in method** tab
4. Enable **Google** as a sign-in provider
5. Configure support email address
6. Save configuration

### Step 3: Create Firestore Database

1. Navigate to **Build → Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose preferred location:
   - **India:** `asia-south1` (Mumbai)
   - **United States:** `us-central1`
   - **Europe:** `europe-west1`
5. Click **"Enable"**

### Step 4: Enable Firebase Hosting

1. Navigate to **Build → Hosting**
2. Click **"Get started"**
3. Complete the initialization wizard

### Step 5: Enable Cloud Storage

1. Navigate to **Build → Storage**
2. Click **"Get started"**
3. Select **"Start in production mode"**
4. Click **"Done"**

### Step 6: Obtain Web Application Credentials

1. Navigate to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click the **Web** icon (`</>`) to register a web application
4. Enter app nickname: `College Central`
5. Click **"Register app"**
6. Copy the following configuration values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId`

### Step 7: Generate Service Account Key

1. Navigate to **Project Settings → Service Accounts**
2. Click **"Generate new private key"**
3. Click **"Generate key"**
4. Securely store the downloaded JSON file

> **⚠️ Security Notice:** The service account JSON file contains sensitive credentials. Store it securely and never share it publicly.

---

## 5. Information Required

Please provide the following institutional information:

### 5.1 Institution Details

| Field | Description | Example |
|-------|-------------|---------|
| **Full Name** | Official institution name | Indian Institute of Technology (Indian School of Mines) Dhanbad |
| **Short Name** | Common abbreviated name | IIT(ISM) Dhanbad |
| **Abbreviation** | Brief abbreviation | IIT(ISM) |
| **Website** | Official institution website | `https://iitism.ac.in` |

### 5.2 Location Information

| Field | Description | Example |
|-------|-------------|---------|
| **City** | City name | Dhanbad |
| **State** | State/Province | Jharkhand |
| **Country** | Country | India |

### 5.3 Contact Information

| Field | Description | Example |
|-------|-------------|---------|
| **Email Domain** | Institutional email suffix | `@iitism.ac.in` |
| **Admin Email(s)** | Administrator email address(es) | `admin@iitism.ac.in` |

### 5.4 Branding (Optional)

| Asset | Specifications |
|-------|----------------|
| **Institution Logo** | PNG or SVG format, transparent background, minimum 512x512px |
| **Favicon** | ICO or PNG format, 32x32px and 192x192px |

---

## 6. Deliverables

Upon successful onboarding, your institution will receive:

### 6.1 Platform Access

| Deliverable | Description |
|-------------|-------------|
| **Application URL** | Dedicated URL (e.g., `https://collegecentral.live`) or custom domain |
| **Admin Panel Access** | Administrative interface at `/admin` route |
| **PWA Installation** | Progressive Web App installable on mobile devices |

### 6.2 Access Control

- Login restricted to institutional email domain (`@iitism.ac.in`)
- Admin panel access granted to designated administrators
- Role-based permissions for content management

### 6.3 Documentation

- User guide for students
- Admin panel operation manual
- Technical support contact information

---

## 7. Admin Panel Operations

### 7.1 Accessing the Admin Panel

1. Log in to the application with your administrator email
2. Navigate to `/admin` (e.g., `https://collegecentral.live/admin`)
3. The admin dashboard will display available management modules

### 7.2 Content Management Modules

| Module | Functionality |
|--------|---------------|
| **College Info** | Update institution name, contact details, and location |
| **Courses** | Add, edit, or delete courses; configure time slots; bulk upload via Excel |
| **Calendar** | Manage academic events, holidays, and important dates |
| **Directory** | Maintain faculty and staff directory with contact information |
| **Forms** | Upload and categorize institutional forms |
| **Quick Links** | Configure important website links |
| **Campus Map** | Manage building locations and navigation routes |
| **Analytics** | View platform usage statistics |

### 7.3 Content Updates

- All changes are saved automatically
- Updates are reflected immediately for all users
- No technical expertise required for content management

---

## 8. Data Security & Privacy

### 8.1 Data Protection

| Aspect | Implementation |
|--------|----------------|
| **Authentication** | Google OAuth 2.0 with institutional domain restriction |
| **Data Encryption** | TLS 1.3 encryption for data in transit |
| **Data Storage** | Google Cloud Firestore with automatic encryption at rest |
| **Access Control** | User-level data isolation; personal data visible only to owner |

### 8.2 Privacy Assurances

- Student grades and personal data are private and inaccessible to other users
- Administrators can only manage institutional content, not personal user data
- No source code or technical credentials are shared with institutions
- Data hosted on Google Cloud infrastructure with enterprise-grade security

### 8.3 Compliance

The platform architecture supports compliance with common data protection regulations. Institutions are responsible for ensuring compliance with applicable local regulations.

---

## 9. Support & Contact

For technical assistance, feature requests, or general inquiries:

| Contact Method | Details |
|----------------|---------|
| **Phone** | +91 8074021047 |
| **Response Time** | Within 24-48 business hours |

### Support Scope

| Included | Not Included |
|----------|--------------|
| Platform deployment and configuration | Custom feature development |
| Technical issue resolution | Third-party integration support |
| Admin panel training | On-site technical support |
| Security updates | Hardware/network issues |

---

## 10. Frequently Asked Questions

### Q: Who can access the platform?
**A:** Only users with your institutional email domain (e.g., `@iitism.ac.in`) can log in. All other email addresses are automatically blocked.

### Q: Can students view other students' grades?
**A:** No. Grade information is private and visible only to the individual student who entered it.

### Q: How do we add courses in bulk?
**A:** The admin panel supports Excel file upload for bulk course entry. Download the provided template, populate it with course data, and upload.

### Q: Can we use our own domain?
**A:** Yes. Custom domain configuration (e.g., `central.iitism.ac.in`) is available. DNS configuration access is required.

### Q: Is there a mobile application?
**A:** College Central is a Progressive Web App (PWA). Users can install it directly from their browser for a native app-like experience on mobile devices.

### Q: How are platform updates deployed?
**A:** Updates are deployed centrally and automatically reflected across all institutional instances. No action is required from your institution.

### Q: What happens if we need additional features?
**A:** Feature requests can be submitted through the support contact. Commonly requested features may be incorporated into future platform updates.

---

**Document End**
