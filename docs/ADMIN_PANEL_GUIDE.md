# College Central

## Administrator Panel User Guide

**Version:** 2.0  
**Last Updated:** December 2024

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Accessing the Admin Panel](#2-accessing-the-admin-panel)
3. [Dashboard Overview](#3-dashboard-overview)
4. [College Information Management](#4-college-information-management)
5. [Course Management](#5-course-management)
6. [Academic Calendar Management](#6-academic-calendar-management)
7. [Directory Management](#7-directory-management)
8. [Forms Management](#8-forms-management)
9. [Quick Links Management](#9-quick-links-management)
10. [Campus Map Configuration](#10-campus-map-configuration)
11. [Student Directory](#11-student-directory)
12. [Analytics & Reports](#12-analytics--reports)
13. [Best Practices](#13-best-practices)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Introduction

The College Central Administrator Panel provides authorized personnel with comprehensive tools to manage institutional content displayed to students and faculty. This guide details the functionality and operation of each administrative module.

### 1.1 Administrator Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Content Accuracy | Ensure all published information is accurate and up-to-date |
| Timely Updates | Update academic calendar and course information before each semester |
| User Support | Address content-related queries from students and faculty |
| Data Maintenance | Regularly review and maintain directory information |

### 1.2 Access Requirements

- Institutional email address (`@iitism.ac.in`)
- Administrator privileges assigned by system administrator
- Modern web browser (Chrome, Firefox, Safari, or Edge recommended)

---

## 2. Accessing the Admin Panel

### 2.1 Login Procedure

1. Navigate to the College Central application URL
2. Click **"Login with Google"**
3. Select your institutional Google account
4. Upon successful authentication, you will be redirected to the main dashboard

### 2.2 Navigating to Admin Panel

1. After login, append `/admin` to the application URL
   - Example: `https://collegecentral.live/admin`
2. Alternatively, if available, use the Admin Panel link in the navigation menu
3. The Admin Dashboard will load if you have administrator privileges

### 2.3 Access Denied

If you receive an access denied message:
- Verify you are using your institutional email account
- Contact the system administrator to confirm your admin privileges
- Ensure your email is listed in the authorized administrators list

---

## 3. Dashboard Overview

### 3.1 Navigation Structure

The Admin Panel consists of a sidebar navigation with the following modules:

| Tab | Function |
|-----|----------|
| **College Info** | Institution name, location, and contact details |
| **Branches** | Academic departments and branches |
| **Hostels** | Hostel/residence hall listings |
| **Quick Links** | Important website links |
| **Quotes** | Motivational quotes for student dashboard |
| **Forms** | Downloadable institutional forms |
| **Calendar** | Academic calendar events |
| **Directory** | Faculty and staff contact information |
| **Courses** | Course catalog and timetables |
| **Students** | Student directory (if enabled) |
| **Campus Map** | Building locations and navigation |
| **Analytics** | Platform usage statistics |
| **Export** | Data export functionality |

### 3.2 Interface Elements

| Element | Description |
|---------|-------------|
| **Save Button** | Saves current changes (auto-save is also enabled) |
| **Add Button** | Creates new entries in list-based modules |
| **Edit Icon** | Opens entry for modification |
| **Delete Icon** | Removes entry (confirmation required) |
| **Search Bar** | Filters entries in large lists |
| **Upload Button** | Imports data from Excel files |

---

## 4. College Information Management

### 4.1 Overview

This module controls the fundamental institutional information displayed throughout the platform.

### 4.2 Editable Fields

| Section | Fields |
|---------|--------|
| **Name** | Full Name, Short Name, Abbreviation |
| **Email** | Domain, Allowed Domain |
| **Website** | URL, Display Name |
| **Location** | City, State, Country |

### 4.3 Procedure

1. Navigate to **College Info** tab
2. Modify the required fields
3. Changes are saved automatically
4. Verify changes on the student-facing application

### 4.4 Guidelines

- **Full Name**: Use official institution name as per UGC/AICTE records
- **Short Name**: Common abbreviated name used in official communications
- **Abbreviation**: Shortest form for headers and compact displays

---

## 5. Course Management

### 5.1 Overview

The Courses module manages the academic course catalog, including course details and scheduled time slots.

### 5.2 Course Information Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Course Code** | Official course identifier | `CS101` |
| **Course Name** | Full course title | `Introduction to Programming` |
| **LTP** | Lecture-Tutorial-Practical hours | `3-1-0` |
| **Credits** | Credit value | `4` |
| **Course Type** | Curriculum framework | `CBCS` or `NEP` |

### 5.3 Adding a Course Manually

1. Navigate to **Courses** tab
2. Click **"Add Course"** button
3. Fill in all required fields
4. Click **"Save"**

### 5.4 Adding Time Slots

Each course can have multiple time slots:

1. Locate the course in the list
2. Click the expand icon to view slots
3. Click **"Add Slot"**
4. Enter slot details:

| Field | Description | Example |
|-------|-------------|---------|
| **Day** | Day of the week | `Monday` |
| **Start Time** | Class start time | `09:00` |
| **End Time** | Class end time | `10:00` |
| **Venue** | Room/Building | `LT-1` |

5. Click **"Save"**

### 5.5 Bulk Upload via Excel

For efficient course entry:

1. Click **"Upload Excel"** button
2. Download the template file (if needed)
3. Populate the template with course data
4. Upload the completed Excel file
5. Review the preview
6. Confirm import

#### Excel Template Format

| Column | Required | Description |
|--------|----------|-------------|
| Course Code | Yes | Unique identifier |
| Course Name | Yes | Full title |
| LTP | Yes | Format: `L-T-P` |
| Credits | Yes | Numeric value |
| Course Type | Yes | `CBCS` or `NEP` |

### 5.6 Editing and Deleting Courses

- **Edit**: Click the edit icon, modify fields, save
- **Delete**: Click delete icon, confirm deletion

> **⚠️ Warning:** Deleting a course removes all associated time slots.

---

## 6. Academic Calendar Management

### 6.1 Overview

This module manages the academic calendar displaying semester dates, examinations, holidays, and institutional events.

### 6.2 Semester Configuration

| Field | Description | Example |
|-------|-------------|---------|
| **Semester Start Date** | First day of academic session | `2024-07-22` |
| **Semester End Date** | Last day of academic session | `2024-12-15` |

### 6.3 Event Types

| Type | Usage |
|------|-------|
| **Start of Semester** | Session commencement |
| **Mid-Semester Exams** | Mid-term examination period |
| **End-Semester Exams** | Final examination period |
| **Holiday** | Institutional holidays |
| **Other** | Miscellaneous events |

### 6.4 Adding Calendar Events

1. Navigate to **Calendar** tab
2. Click **"Add Event"**
3. Enter event details:

| Field | Required | Description |
|-------|----------|-------------|
| Date | Yes | Event date (YYYY-MM-DD) |
| End Date | No | For multi-day events |
| Description | Yes | Event title/description |
| Type | Yes | Select from event types |

4. Click **"Save"**

### 6.5 Best Practices

- Add all events before semester begins
- Include examination schedules with specific dates
- Mark all institutional holidays
- Update promptly if dates change

---

## 7. Directory Management

### 7.1 Overview

The Directory module maintains faculty and staff contact information accessible to students.

### 7.2 Directory Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Full name with title |
| Department | Yes | Academic department |
| Designation | Yes | Official designation |
| Email | Yes | Official email address |
| Phone | No | Contact number |

### 7.3 Adding Directory Entries

1. Navigate to **Directory** tab
2. Click **"Add Entry"**
3. Fill in all required fields
4. Click **"Save"**

### 7.4 Bulk Upload

1. Click **"Upload Excel"**
2. Use the provided template format
3. Upload and confirm import

### 7.5 Guidelines

- Use official designations only
- Verify email addresses before publishing
- Obtain consent before publishing phone numbers
- Update promptly when faculty/staff changes occur

---

## 8. Forms Management

### 8.1 Overview

This module manages the repository of downloadable institutional forms.

### 8.2 Form Entry Fields

| Field | Description | Example |
|-------|-------------|---------|
| Title | Form name | `Leave Application Form` |
| Form Number | Official form identifier | `Form-A1` |
| Category | Form classification | `General`, `UG`, `PG`, `PhD` |
| Download Link | URL to form file | `https://...` |
| Submit To | Submission location | `Academic Section` |

### 8.3 Categories

| Category | Target Users |
|----------|--------------|
| **General** | All students |
| **UG** | Undergraduate students |
| **PG** | Postgraduate students |
| **PhD** | Doctoral students |

### 8.4 Adding Forms

1. Navigate to **Forms** tab
2. Click **"Add Form"**
3. Enter form details
4. Paste the download link (Google Drive, institutional server, etc.)
5. Click **"Save"**

### 8.5 Best Practices

- Use direct download links when possible
- Verify links are accessible without login
- Update forms when new versions are released
- Remove obsolete forms promptly

---

## 9. Quick Links Management

### 9.1 Overview

Quick Links provide students with easy access to frequently used institutional resources.

### 9.2 Link Entry Fields

| Field | Description | Example |
|-------|-------------|---------|
| Name | Link display name | `ERP Portal` |
| URL | Destination URL | `https://erp.iitism.ac.in` |
| Icon | Icon identifier | `link`, `book`, `calendar` |
| Color | Display color class | `text-blue-600` |

### 9.3 Adding Quick Links

1. Navigate to **Quick Links** tab
2. Click **"Add Link"**
3. Enter link details
4. Click **"Save"**

### 9.4 Recommended Links

| Category | Examples |
|----------|----------|
| Academic | ERP, Moodle, Library |
| Administrative | Fee Payment, Hostel Portal |
| Resources | Placement Portal, Alumni Network |
| External | NPTEL, SWAYAM |

---

## 10. Campus Map Configuration

### 10.1 Overview

The Campus Map module manages building locations and navigation routes.

### 10.2 Location Entry Fields

| Field | Description |
|-------|-------------|
| Name | Building/Location name |
| Category | Classification (Academic, Hostel, etc.) |
| Description | Brief description |
| Coordinates | Latitude and Longitude |

### 10.3 Adding Locations

1. Navigate to **Campus Map** tab
2. Click **"Add Location"**
3. Enter location details with coordinates
4. Click **"Save"**

### 10.4 Quick Routes

Define common navigation routes between popular locations:

| Field | Description |
|-------|-------------|
| Name | Route name |
| From | Starting location |
| To | Destination |
| Description | Walking directions |

---

## 11. Student Directory

### 11.1 Overview

If enabled, this module maintains a searchable student directory.

### 11.2 Entry Fields

| Field | Description |
|-------|-------------|
| Admission Number | Unique student ID |
| Name | Student full name |
| Branch | Academic department |

### 11.3 Bulk Upload

Student data can be uploaded via Excel:
1. Prepare Excel file with required columns
2. Upload through the admin panel
3. Review and confirm import

---

## 12. Analytics & Reports

### 12.1 Available Metrics

| Metric | Description |
|--------|-------------|
| Total Users | Registered user count |
| Active Users | Users active in selected period |
| Page Views | Platform usage statistics |
| Feature Usage | Most accessed features |

### 12.2 Viewing Analytics

1. Navigate to **Analytics** tab
2. Select date range if applicable
3. Review displayed charts and metrics

---

## 13. Best Practices

### 13.1 Content Management

| Practice | Rationale |
|----------|-----------|
| Update before each semester | Students rely on accurate information |
| Verify all links monthly | Broken links create poor user experience |
| Use consistent formatting | Improves readability and professionalism |
| Review directory quarterly | Staff changes should be reflected promptly |

### 13.2 Security

| Practice | Rationale |
|----------|-----------|
| Log out after sessions | Prevents unauthorized access |
| Use official email only | Maintains access control integrity |
| Report suspicious activity | Enables prompt security response |

---

## 14. Troubleshooting

### 14.1 Common Issues

| Issue | Solution |
|-------|----------|
| Changes not saving | Check internet connection; try refreshing page |
| Upload fails | Verify Excel format matches template |
| Access denied | Confirm admin privileges with system administrator |
| Content not appearing | Clear browser cache; wait few minutes for propagation |

### 14.2 Support Contact

For technical assistance:

| Method | Details |
|--------|---------|
| Phone | +91 8074021047 |
| Response Time | 24-48 business hours |

---

## Appendix A: Excel Upload Templates

### Courses Template

| Course Code | Course Name | LTP | Credits | Course Type |
|-------------|-------------|-----|---------|-------------|
| CS101 | Introduction to Programming | 3-1-0 | 4 | CBCS |
| MA102 | Engineering Mathematics | 3-1-0 | 4 | NEP |

### Directory Template

| Name | Department | Designation | Email | Phone |
|------|------------|-------------|-------|-------|
| Dr. John Doe | Computer Science | Professor | john@iitism.ac.in | 9876543210 |

### Student Template

| Admission Number | Name | Branch |
|------------------|------|--------|
| 21JE0001 | Student Name | CSE |

---

**Document End**
