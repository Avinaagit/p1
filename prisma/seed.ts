import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with demo data...');

  // Create demo users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      firstName: 'Admin',
      lastName: 'User',
      password: 'password123', // In production, hash this!
      role: 'ADMIN',
      department: 'Corporate',
      isActive: true,
    },
  });

  const consultant = await prisma.user.upsert({
    where: { email: 'consultant@company.com' },
    update: {},
    create: {
      email: 'consultant@company.com',
      firstName: 'Consultant',
      lastName: 'Manager',
      password: 'password123',
      role: 'CONSULTANT',
      department: 'HR',
      isActive: true,
    },
  });

  const employee1 = await prisma.user.upsert({
    where: { email: 'employee@company.com' },
    update: {},
    create: {
      email: 'employee@company.com',
      firstName: 'John',
      lastName: 'Employee',
      password: 'password123',
      role: 'EMPLOYEE',
      department: 'Sales',
      isActive: true,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: 'jane.smith@company.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'password123',
      role: 'EMPLOYEE',
      department: 'Engineering',
      isActive: true,
    },
  });

  console.log('✓ Created demo users');

  // Create demo survey
  const survey = await prisma.survey.create({
    data: {
      title: 'Q1 2026 Employee Engagement Survey',
      description: 'Your feedback matters! Please share your thoughts on workplace culture, management, and career growth.',
      createdBy: consultant.id,
      status: 'PUBLISHED',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      targetDepartment: null,
      isAnonymous: true,
      questions: {
        create: [
          {
            questionText: 'How satisfied are you with your current role?',
            questionType: 'RATING',
            options: JSON.stringify([1, 2, 3, 4, 5]),
            isRequired: true,
            displayOrder: 1,
          },
          {
            questionText: 'How likely are you to recommend this company as a great place to work?',
            questionType: 'NPS',
            options: JSON.stringify(Array.from({ length: 11 }, (_, i) => i)),
            isRequired: true,
            displayOrder: 2,
          },
          {
            questionText: 'What aspects of your work do you enjoy the most?',
            questionType: 'MULTILINE',
            isRequired: false,
            displayOrder: 3,
          },
          {
            questionText: 'What areas need improvement?',
            questionType: 'MULTILINE',
            isRequired: false,
            displayOrder: 4,
          },
        ],
      },
    },
    include: { questions: true },
  });

  console.log('✓ Created demo survey');

  // Create demo survey responses
  const responses = [
    {
      text: 'Great company culture and supportive team members!',
      rating: 4,
    },
    {
      text: 'Very happy with my role and career growth opportunities.',
      rating: 5,
    },
    {
      text: 'Good environment but could improve communication.',
      rating: 3,
    },
    {
      text: 'Work-life balance could be better. Too many meetings.',
      rating: 2,
    },
  ];

  for (const resp of responses) {
    await prisma.surveyResponse.create({
      data: {
        surveyId: survey.id,
        respondentId: employee1.id,
        sentimentScore: (resp.rating - 3) / 2, // Convert rating to sentiment
        questionResponses: {
          create: [
            {
              questionId: survey.questions[0]?.id || '',
              answer: JSON.stringify(resp.rating),
            },
            {
              questionId: survey.questions[2]?.id || '',
              answer: JSON.stringify(resp.text),
            },
          ],
        },
        sentiment: {
          create: {
            rawText: resp.text,
            sentimentScore: (resp.rating - 3) / 2,
            sentimentLabel: resp.rating >= 4 ? 'positive' : resp.rating <= 2 ? 'negative' : 'neutral',
            confidence: 0.8,
            emotionAnalysis: JSON.stringify({
              joy: resp.rating >= 4 ? 0.7 : 0.2,
              trust: resp.rating >= 3 ? 0.6 : 0.3,
              sadness: resp.rating <= 2 ? 0.6 : 0.1,
            }),
            keywordsDetected: JSON.stringify(extractKeywords(resp.text)),
          },
        },
      },
    });
  }

  console.log('✓ Created demo survey responses');

  // Create engagement metrics
  await prisma.engagementMetric.create({
    data: {
      surveyId: survey.id,
      totalDistributed: 100,
      totalResponded: 4,
      responseRate: 4,
      npsScore: 50,
    },
  });

  console.log('✓ Created engagement metrics');

  // Create demo tasks
  await prisma.task.create({
    data: {
      title: 'Review Q1 engagement survey results',
      description: 'Analyze the Q1 survey responses and prepare insights for leadership.',
      assignedTo: consultant.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      surveyId: survey.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Implement feedback from employee survey',
      description: 'Address top concerns raised in the engagement survey.',
      assignedTo: admin.id,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      priority: 'MEDIUM',
      surveyId: survey.id,
    },
  });

  console.log('✓ Created demo tasks');

  console.log('✅ Database seeding completed successfully!');
}

function extractKeywords(text: string): string[] {
  const stopwords = ['the', 'a', 'is', 'are', 'be', 'been', 'have', 'has', 'do', 'does', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3 && !stopwords.includes(word))
    .slice(0, 5);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
