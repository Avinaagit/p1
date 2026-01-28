# Судалгааны мэдэгдэл ба давтамжтай судалгаа систем

## Боломжууд

### 1. Мэдэгдэл систем (Notification System)
- ✅ Real-time мэдэгдэл
- ✅ Navigation дээр notification bell
- ✅ Уншсан/уншаагүй төлөв
- ✅ Мэдэгдэл төрлүүд:
  - 📊 SURVEY_REMINDER - Судалгааны санамж
  - ⏰ SURVEY_DEADLINE - Дуусах хугацааны мэдэгдэл
  - 📧 SURVEY_INVITATION - Судалгааны урилга
  - 📋 TASK_ASSIGNED - Даалгавар өгөгдсөн
  - ⚠️ TASK_DEADLINE - Даалгаврын хугацаа

### 2. Давтамжтай судалгаа (Recurring Surveys)
- ✅ Судалгаа давтах тохиргоо:
  - WEEKLY - Долоо хоног тутам
  - BIWEEKLY - 2 долоо хоног тутам
  - MONTHLY - Сар тутам
  - QUARTERLY - Улирал тутам
  - YEARLY - Жил тутам

### 3. Автомат санамж (Automated Reminders)
- ✅ 3 хоногийн өмнө автомат санамж
- ✅ Зөвхөн бөглөөгүй хүмүүст илгээх
- ✅ И-мэйл + системийн мэдэгдэл

## API Endpoints

### Notifications
```
GET    /api/v1/notifications              - Мэдэгдэл авах
POST   /api/v1/notifications              - Мэдэгдэл үүсгэх (admin only)
PATCH  /api/v1/notifications/:id          - Унших тэмдэглэх
DELETE /api/v1/notifications/:id          - Устгах
POST   /api/v1/notifications/mark-all-read - Бүгдийг унших
```

### Cron Jobs
```
POST   /api/v1/cron/survey-reminders      - Санамж илгээх (automated)
```

## Cron Job тохиргоо

### Vercel (Production)
`vercel.json` файл үүсгэ:
```json
{
  "crons": [
    {
      "path": "/api/v1/cron/survey-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Manual testing
```bash
curl -X POST http://localhost:3000/api/v1/cron/survey-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

## Хэрэглээ

### 1. Мэдэгдэл харах
- Navigation дээрх 🔔 дарна
- Dropdown-оос бүх мэдэгдэл харна
- "Бүх мэдэгдэл харах" дарвал `/notifications` хуудас руу очно

### 2. Давтамжтай судалгаа үүсгэх
Prisma Studio-р эсвэл Admin UI-аар:
```typescript
await prisma.survey.update({
  where: { id: 'survey-id' },
  data: {
    isRecurring: true,
    frequency: 'MONTHLY',
    nextScheduledDate: new Date('2026-02-26'),
    reminderDays: 3
  }
})
```

### 3. Manual санамж илгээх
Admin хэрэглэгч:
```bash
POST /api/v1/cron/survey-reminders
```

## Database Schema

### Notification table
```prisma
model Notification {
  id        String    @id @default(cuid())
  userId    String
  type      String
  title     String
  message   String
  surveyId  String?
  isRead    Boolean   @default(false)
  readAt    DateTime?
  actionUrl String?
  createdAt DateTime  @default(now())
}
```

### Survey updates
```prisma
model Survey {
  // Existing fields...
  isRecurring       Boolean   @default(false)
  frequency         String?   // WEEKLY, MONTHLY, etc.
  nextScheduledDate DateTime?
  reminderDays      Int       @default(3)
}
```

## Тэмдэглэл
- Notification polling: 30 секунд тутам
- Email санамж: 3 хоногийн өмнө автоматаар
- Recurring surveys: Cron job-оор автоматаар шинэчлэгдэнэ
