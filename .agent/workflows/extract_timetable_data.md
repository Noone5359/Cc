---
description: How to extract timetable data from Excel files
---

# Extracting Timetable Data

This project includes scripts to extract course usage data from Excel timetable files.

## Prerequisites
- Node.js installed
- `xlsx` package installed (`npm install xlsx`)
- Excel files placed in the project root:
  - `TimeTable_CBCS.xls` (for regular courses)
  - `TimeTable_NEP.xlsx` (for NEP courses)

## Scripts

### 1. Extract Regular Course Data
To extract regular course data and update `config/courseData.tsx`:

```bash
node scripts/extract_timetable.js > config/courseData.tsx
```

To just view the output without saving:
```bash
node scripts/extract_timetable.js
```

### 2. Extract NEP Course Data
To extract NEP course data and update `config/nepCourseData.tsx`:

```bash
node scripts/extract_nep_timetable.js > config/nepCourseData.tsx
```

To just view the output without saving:
```bash
node scripts/extract_nep_timetable.js
```

### 3. Inspect Excel File Structure
To inspect the raw structure of an Excel file (change the filename in the script if needed):

```bash
node scripts/inspect_excel.js
```