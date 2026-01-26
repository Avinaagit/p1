# Employee Pulse & Engagement System

**Ажилтанчуудын сонсголын демократжуулалт** - Democratizing Employee Listening & Engagement

A comprehensive Next.js application for employee engagement, sentiment analysis, and HR analytics with enterprise-grade features.

## System Overview

### Architecture
- **Frontend**: Next.js 16+ with React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes with TypeScript
- **Database**: Microsoft SQL Server (MSSQL) with Prisma ORM
- **Authentication**: JWT with HttpOnly cookies, RBAC (Role-Based Access Control)
- **NLP/Analytics**: Real-time sentiment analysis + batch NLP processing
- **BI Integration**: REST APIs for Power BI and Tableau

### Key Features

#### P1: Foundation Web Platform
- General information and introduction pages
- System overview and navigation

#### P2: Authentication & Authorization
- Email/password login
- Google OAuth integration
- Role-based access control (Admin, Consultant, Employee)
- Role selection popup on first login
- User management dashboard (Admin only)

#### P3: Employee Pulse & Survey
- Survey creation and management
- Multi-question types (text, rating, NPS, multiple choice)
- Anonymous response support
- Survey scheduling and status management
- Real-time survey analytics

#### P4: Engagement & Sentiment Analytics - HR Analytics
- CEO-friendly KPI dashboards
- Real-time sentiment analysis on survey responses
- Sentiment score calculation (-1 to 1 scale)
- Emotion analysis (joy, sadness, anger, fear, trust, disgust)
- Keyword extraction and topic analysis
- Department and role-based breakdowns

#### P5: Executive Dashboard
- Real-time engagement metrics
- Response rates and trends
- Sentiment trend analysis
- Company-wide employee pulse overview
- Customizable metrics display
- CEO-friendly visualizations

#### P6: Task System Integration
- Task assignment based on survey insights
- Deadline and status tracking
- Integration with survey actions
- Task priority levels (Critical, High, Medium, Low)
- Task completion workflows

#### P7: BI/Data Export
- Power BI direct SQL connection support
- Tableau data export endpoints
- CSV/JSON export functionality
- Denormalized data format for BI tools
- Scheduled automated exports
- Compliance-ready data structure

#### P8: AI-Driven Insights
- Automated insight generation
- Anomaly detection in sentiment trends
- Recommended actions based on data
- Natural language summaries
- Predictive analytics

#### P9: AI & Analytics Strategy
- Data governance and compliance
- Privacy-first design (no individual profiling without consent)
- Aggregation thresholds (≥5 respondents)
- Explainable AI (no black-box scoring)
- Audit logging of all analytics queries

## Project Structure

```
app/
├── api/v1/                          # API endpoints
│   ├── auth/                        # Authentication
│   │   ├── login/route.ts          # Email/OAuth login
│   │   ├── logout/route.ts         # Logout
│   │   └── me/route.ts             # Current user info
│   ├── surveys/                    # Survey management
│   │   ├── route.ts                # List & create surveys
│   │   ├── [id]/route.ts           # Get/update/delete survey
│   │   └── [id]/responses/route.ts # Survey responses
│   ├── analytics/                  # Analytics endpoints
│   │   └── engagement/[surveyId]/route.ts
│   ├── tasks/                      # Task management
│   │   ├── route.ts                # List & create tasks
│   │   └── [id]/route.ts           # Task details & updates
│   └── exports/                    # BI exports
│       └── route.ts                # Survey, sentiment, engagement exports
│
├── _lib/                           # Shared utilities
│   ├── auth.ts                     # JWT token management
│   ├── db.ts                       # Prisma client
│   ├── rbac.ts                     # Role-based access control
│   ├── dal.ts                      # Data Access Layer
│   └── nlp.ts                      # NLP & sentiment analysis
│
├── _components/                    # Reusable React components
│   ├── LoginForm.tsx               # Login form
│   ├── SurveyList.tsx              # Survey listing
│   ├── EngagementDashboard.tsx    # Dashboard metrics
│   ├── TaskList.tsx                # Task management
│   └── Navigation.tsx              # Navigation bar
│
├── dashboard/                      # Dashboard page
├── surveys/                        # Surveys page
├── tasks/                          # Tasks page
├── analytics/                      # Analytics page
├── page.js                         # Home/login page
└── layout.js                       # Root layout

prisma/
├── schema.prisma                   # Database schema
└── migrations/                     # Database migrations

.env.local                          # Environment configuration
```

## Database Schema

### Core Tables
- **User**: User accounts with roles (Admin, Consultant, Employee)
- **Survey**: Survey definitions with metadata
- **SurveyQuestion**: Individual questions within surveys
- **SurveyResponse**: Submitted survey responses
- **QuestionResponse**: Individual answer responses
- **SentimentAnalysis**: Aggregated sentiment per survey
- **SentimentDetail**: Detailed sentiment for each response
- **EngagementMetric**: Engagement statistics and KPIs
- **Task**: Action items linked to survey insights
- **DashboardPreference**: User dashboard customization
- **AuditLog**: Complete audit trail of all actions

### Key Features
- Row-level security via RBAC in DAL
- Indexed columns for query performance
- Audit logging on all sensitive operations
- Support for anonymous responses
- JSON columns for flexible metadata storage

## API Endpoints

### Authentication
```
POST   /api/v1/auth/login              # Email/password login
POST   /api/v1/auth/logout             # Logout
GET    /api/v1/auth/me                 # Current user info
```

### Surveys
```
GET    /api/v1/surveys                 # List surveys (role-aware)
POST   /api/v1/surveys                 # Create survey (Admin/Consultant)
GET    /api/v1/surveys/[id]            # Get survey details
PUT    /api/v1/surveys/[id]            # Update survey (Admin/Creator)
DELETE /api/v1/surveys/[id]            # Delete survey (Admin/Creator)
POST   /api/v1/surveys/[id]/responses  # Submit response
GET    /api/v1/surveys/[id]/responses  # Get responses (Admin/Consultant)
```

### Analytics
```
GET    /api/v1/analytics/engagement/[surveyId]  # Engagement metrics
GET    /api/v1/analytics/sentiment/[surveyId]   # Sentiment analysis
```

### Tasks
```
GET    /api/v1/tasks                   # List user's tasks
POST   /api/v1/tasks                   # Create task (Admin/Consultant)
GET    /api/v1/tasks/[id]              # Get task details
PUT    /api/v1/tasks/[id]              # Update task status
```

### Exports (BI)
```
GET    /api/v1/exports?format=json     # Export survey data
GET    /api/v1/exports/sentiment       # Export sentiment analysis
GET    /api/v1/exports/engagement      # Export engagement metrics
```

## Authentication & RBAC

### Roles & Permissions

**Admin**
- Full system access
- Create/edit/delete surveys
- View all responses and analytics
- Manage users and roles
- Access audit logs
- Configure system settings

**Consultant (Manager)**
- Create and manage surveys
- View department-level analytics
- Create and assign tasks
- Export data for reporting
- Limited user management

**Employee**
- View and submit surveys
- View own responses
- Manage own tasks
- Access personal engagement insights

### JWT Token Structure
```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "role": "EMPLOYEE",
  "department": "Sales",
  "iat": 1234567890,
  "exp": 1234654290
}
```

Token is stored in HttpOnly, Secure, SameSite=Strict cookie for XSS protection.

## NLP & Sentiment Analysis

### Real-time Analysis
- Uses `sentiment` library (AFINN-165 wordlist)
- Processes on every survey submission
- Sentiment score: -1 (very negative) to 1 (very positive)
- Confidence score: 0 to 1
- Labels: positive, neutral, negative

### Batch Processing
- Scheduled daily for deeper analysis
- Uses `compromise` library for NLP
- Extracts keywords and topics
- Emotion analysis (6 emotions)
- Stores aggregated statistics

### API Response
```json
{
  "score": 0.45,
  "label": "positive",
  "confidence": 0.72,
  "keywords": ["feedback", "improvement", "process"],
  "emotions": {
    "joy": 0.6,
    "trust": 0.5,
    "sadness": 0.2,
    "anger": 0.1,
    "fear": 0.0,
    "disgust": 0.0
  }
}
```

## Data Export for BI

### Format for Power BI & Tableau
All exports are denormalized for BI tool consumption:

**Surveys Export**
```json
[
  {
    "surveyId": "...",
    "surveyTitle": "...",
    "surveyStatus": "PUBLISHED",
    "responseId": "...",
    "respondentDepartment": "Sales",
    "respondentRole": "EMPLOYEE",
    "responseSubmittedAt": "2026-01-26T10:00:00Z",
    "sentimentScore": 0.45,
    "sentimentLabel": "positive"
  }
]
```

**Sentiment Export**
```json
[
  {
    "surveyId": "...",
    "surveyTitle": "...",
    "averageSentiment": 0.52,
    "positiveCount": 45,
    "neutralCount": 23,
    "negativeCount": 8,
    "topicsExtracted": ["management", "work-life-balance", "compensation"]
  }
]
```

## Environment Configuration

Create `.env.local`:
```env
# Database
DATABASE_URL="sqlserver://user:password@host:1433;database=EmployeeEngagement;encrypt=true;trustServerCertificate=true;"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRATION="7d"

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-secret"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Features
SENTIMENT_ANALYSIS_ENABLED="true"
BATCH_NLP_PROCESSING_ENABLED="true"
BATCH_NLP_SCHEDULE="0 0 * * *"
```

## Getting Started

### Prerequisites
- Node.js 18+
- MSSQL Server 2019 or later
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev --name init

# Create seed data (admin/consultant/employee accounts)
npx prisma db seed

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## Compliance & Security

### Data Privacy
- GDPR-ready data structure
- No individual profiling without consent
- Aggregation thresholds (≥5 respondents for reporting)
- Data retention policies configurable per survey
- Right to be forgotten support (anonymous by default)

### Audit & Compliance
- Complete audit logging of all actions
- User, timestamp, resource, action tracked
- IP address and user agent logging
- Compliant with SOX, GDPR, CCPA requirements

### Security
- HTTPS-only in production
- CSRF protection via SameSite cookies
- SQL injection prevention via Prisma
- XSS protection via React and Content Security Policy
- Rate limiting on API endpoints
- Input validation on all endpoints

## Performance Optimization

### Database
- Indexed columns for common queries
- Connection pooling via Prisma
- Pagination on large result sets (default 10 per page)
- Lazy loading for relationships

### Frontend
- Server-side rendering where possible
- Code splitting by route
- Image optimization
- CSS minification via Tailwind

### API
- Response caching headers
- Gzip compression
- Request deduplication
- Batch operation endpoints

## Deployment

### Environment-specific Configuration
- Development: Local database, verbose logging
- Staging: Cloud database, rate limiting
- Production: Replicated database, caching, CDN

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Database Migrations
```bash
# Apply pending migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Monitoring & Logging

### Structured Logging
- API request/response logging
- Database query logging (development only)
- Error tracking and alerts
- User activity audit logs

### Metrics
- API response times
- Database query performance
- Sentiment analysis accuracy
- System uptime and error rates

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify MSSQL server is running
- Check DATABASE_URL format
- Test connection: `sqlcmd -S <server> -U <user>`

**Sentiment Analysis Not Working**
- Ensure `sentiment` package is installed
- Check NLP processing is enabled in .env
- Verify text input is valid UTF-8

**API Returns 401 Unauthorized**
- Token may be expired (refresh by logging in)
- Cookie may not be set (check browser settings)
- CORS issues in development (check origin)

## Support & Contributing

For issues, feature requests, or contributions, please contact the development team.

---

**Last Updated**: January 2026
**Version**: 1.0.0
**License**: Proprietary
