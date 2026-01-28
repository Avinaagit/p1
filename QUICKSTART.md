# Quick Start Guide

## Employee Pulse System - Setup Instructions

### Step 1: Prerequisites
- Node.js 18 or higher installed
- MSSQL Server 2019 or later running
- npm or yarn package manager

### Step 2: Installation

```bash
cd c:\project1

# Install dependencies
npm install

# The project already has the following installed:
# - Prisma (ORM)
# - jose (JWT)
# - sentiment (NLP)
# - compromise (NLP)
# - mssql (Database driver)
# - Tailwind CSS 4
# - Next.js 16
```

### Step 3: Configure Database

1. **Update .env.local** with your MSSQL connection:

```env
DATABASE_URL="sqlserver://YOUR_USER:YOUR_PASSWORD@YOUR_SERVER:1433;database=EmployeeEngagement;encrypt=true;trustServerCertificate=true;"
```

Example for local MSSQL:
```env
DATABASE_URL="sqlserver://sa:YourPassword123@localhost:1433;database=EmployeeEngagement;encrypt=true;trustServerCertificate=true;"
```

2. **Ensure your .env.local has all required variables** (already created with defaults):
   - DATABASE_URL
   - JWT_SECRET
   - NEXT_PUBLIC_GOOGLE_CLIENT_ID (optional for Google OAuth)

### Step 4: Initialize Database

```bash
# Create database tables
npm run db:migrate

# Seed demo data (creates admin, consultant, employee accounts)
npm run db:seed
```

### Step 5: Run Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### Step 6: Login with Demo Accounts

#### Admin Account
- Email: `consultant@company.com`
- Password: `password123`
- Access: Full system access, all features

#### Consultant Account
- Email: `hr@company.com`
- Password: `password123`
- Access: Create surveys, view analytics, manage tasks

#### Employee Account
- Email: `employee@company.com`
- Password: `password123`
- Access: Take surveys, view own data, manage own tasks

---

## Project Structure Overview

### Directories & Files

```
app/
├── api/v1/                        API endpoints
│   ├── auth/                      Login, logout, user info
│   ├── surveys/                   Survey CRUD and responses
│   ├── analytics/                 Sentiment & engagement metrics
│   ├── tasks/                     Task management
│   └── exports/                   BI data exports
│
├── _lib/                          Shared logic
│   ├── auth.ts                    JWT token handling
│   ├── db.ts                      Database connection
│   ├── rbac.ts                    Role permissions
│   ├── dal.ts                     Data access rules
│   └── nlp.ts                     Sentiment analysis
│
├── _components/                   React components
│   ├── LoginForm.tsx
│   ├── SurveyList.tsx
│   ├── EngagementDashboard.tsx
│   ├── TaskList.tsx
│   └── Navigation.tsx
│
├── dashboard/                     Dashboard page
├── surveys/                       Surveys page
├── tasks/                         Tasks page
├── analytics/                     Analytics page
└── page.js                        Home/login page

prisma/
├── schema.prisma                  Database schema
└── seed.ts                        Demo data seeder
```

---

## Key Features Implemented

### ✅ P1: Foundation Platform
- Home page with login interface
- Navigation between modules

### ✅ P2: Authentication
- Email/password login
- Google OAuth setup (requires client ID)
- Role-based access control (Admin, Consultant, Employee)
- JWT token with HttpOnly cookies
- User logout

### ✅ P3: Employee Pulse & Survey
- Create/edit/delete surveys
- Multiple question types (text, rating, NPS, multiple choice)
- Anonymous response support
- Survey status management (draft, published, closed)
- Response submission with validation

### ✅ P4: Engagement & Sentiment Analytics
- Real-time sentiment analysis on submissions
- Sentiment scores: -1 (negative) to 1 (positive)
- Emotion analysis (6 emotions)
- Keyword extraction
- Response rate and engagement metrics
- CEO-friendly dashboard cards

### ✅ P5: Executive Dashboard
- Real-time engagement overview
- Sentiment trend visualization
- Response rate metrics
- Active survey count
- Task status overview

### ✅ P6: Task System Integration
- Task creation and assignment
- Priority levels (Critical, High, Medium, Low)
- Status tracking (Pending, In Progress, Completed, Cancelled)
- Survey-linked tasks
- Deadline management

### ✅ P7: BI Data Export
- JSON/CSV export endpoints
- Survey response data export
- Sentiment analysis export
- Engagement metrics export
- Power BI/Tableau compatible format

### ✅ P8: AI-Driven Insights
- Automated sentiment analysis
- Emotion detection
- Topic extraction
- Keyword analysis
- Confidence scoring

### ✅ P9: AI & Analytics Strategy
- Audit logging of all actions
- Role-based data access
- Privacy-first design
- Compliance-ready structure
- GDPR-ready (with consent)

---

## API Examples

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "consultant@company.com",
    "password": "password123"
  }'
```

### Get Surveys
```bash
curl http://localhost:3000/api/v1/surveys \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Submit Survey Response
```bash
curl -X POST http://localhost:3000/api/v1/surveys/{surveyId}/responses \
  -H "Content-Type: application/json" \
  -d '{
    "responses": [
      {
        "questionId": "q1",
        "answer": "Very satisfied"
      }
    ]
  }'
```

### Get Analytics
```bash
curl http://localhost:3000/api/v1/analytics/engagement/{surveyId} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Export Data
```bash
curl http://localhost:3000/api/v1/exports?format=json \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Database Management

### View Database Schema
```bash
# Open Prisma Studio to view/edit data
npx prisma studio
```

### Reset Database (Development Only)
```bash
# ⚠️ This deletes all data!
npm run db:reset
```

### Create Migration
```bash
# After modifying prisma/schema.prisma
npm run db:migrate -- --name describe_change
```

---

## Troubleshooting

### "Database connection failed"
- Verify MSSQL server is running
- Check DATABASE_URL format
- Test: `sqlcmd -S your_server -U sa -P your_password`

### "Port 3000 already in use"
```bash
# Use different port
npm run dev -- -p 3001
```

### "Prisma client not generated"
```bash
npx prisma generate
```

### "Sentiment analysis not working"
- Check NLP library installed: `npm list sentiment`
- Verify SENTIMENT_ANALYSIS_ENABLED=true in .env.local

---

## Next Steps

1. **Customize Branding**: Update logo/colors in components
2. **Add Google OAuth**: Get credentials from Google Cloud Console
3. **Configure Email**: Add email notifications for survey invites
4. **Setup BI Connection**: Configure Power BI/Tableau data sources
5. **Deploy**: Push to cloud platform (Azure, Vercel, AWS)

---

## Support

For issues or questions:
1. Check SYSTEM_DOCUMENTATION.md for detailed information
2. Review component comments for implementation details
3. Check API endpoint comments for usage examples

---

**Status**: ✅ Ready for Development/Testing
**Last Updated**: January 26, 2026
