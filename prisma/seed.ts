import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with demo data...');

  // Create demo users
  const admin = await prisma.user.upsert({
    where: { email: 'consultant@company.com' },
    update: {},
    create: {
      email: 'consultant@company.com',
      firstName: 'Admin',
      lastName: 'User',
      password: 'password123', // In production, hash this!
      role: 'ADMIN',
      department: 'Corporate',
      isActive: true,
    },
  });

  const consultant = await prisma.user.upsert({
    where: { email: 'hr@company.com' },
    update: {},
    create: {
      email: 'hr@company.com',
      firstName: 'Consultant',
      lastName: 'Manager',
      password: 'password123',
      role: 'HR',
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

  const employee2 = await prisma.user.upsert({
    where: { email: 'jane.smith@company.com' },
    update: {},
    create: {
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

  // Removed legacy demo surveys (Q1 2026 Employee Engagement Survey & wellbeing pulse)
  const mentalHealthQuestions = [
    'Сүүлийн үед би байнга сэтгэл зүйн дарамт мэдэрч байна',
    'Ажлын ачаалал надад хэт их санагддаг',
    'Би ажлын стрессээ тайлахад хүндрэлтэй байдаг',
    'Ажлын дараа сэтгэл санаагаар амар тайван болдог',
    'Би уур уцаартай, бухимдуу болсон гэж мэдэрдэг',
    'Би сэтгэл санааны хувьд тогтвортой байдаг',
    'Би санаа зовнил ихтэй байдаг',
    'Би өөрийгөө тайван, тэнцвэртэй гэж мэдэрдэг',
    'Би өглөө сэрэхдээ ядарсан хэвээр байдаг',
    'Би хангалттай амарч чаддаг',
    'Би ажлын дараа сэтгэл зүйн хувьд бүрэн сэргэдэг',
    'Би амралтын өдрүүдэд ч ажлаа бодсоор байдаг',
  ];

  const orgCultureQuestions = [
    'Би ажлын байрандаа өөрийнхөөрөө байх боломжтой',
    'Би санаа бодлоо айдасгүй илэрхийлж чаддаг',
    'Алдаа гаргасан үед намайг ойлгож ханддаг',
    'Миний удирдлагад итгэж болдог',
    'Манай хамт олон бие биедээ итгэдэг',
    'Шударга бус хандлага мэдрэгддэг',
    'Ажлын орчинд хүндлэл мэдрэгддэг',
    'Дотоод харилцаа ойлгомжтой байдаг',
    'Зөрчил маргаан эрүүл байдлаар шийдэгддэг',
    'Би сэтгэл зүйн дэмжлэг авч чаддаг',
    'Байгууллага ажилтнуудын wellbeing-д анхаардаг',
    'Би ганцаардаж байна гэж мэдэрдэг',
  ];

  const personalProfileQuestions = [
    'Би өөрийн сэтгэл хөдлөлийг сайн ойлгодог',
    'Би өөрийн давуу талыг мэддэг',
    'Би сул талаа хүлээн зөвшөөрч чаддаг',
    'Би сэтгэл хөдлөлөө удирдаж чаддаг',
    'Би стрессийг эрүүл аргаар зохицуулдаг',
    'Би сөрөг бодлоо хянаж чаддаг',
    'Би шинэ нөхцөл байдалд хурдан дасдаг',
    'Би өөрчлөлтийг эерэгээр хүлээн авдаг',
    'Тодорхойгүй байдал намайг түгшээдэг',
    'Би өөртөө итгэлтэй байдаг',
    'Би өөрийгөө үнэлдэг',
    'Би өөрийгөө бусадтай байнга харьцуулдаг',
  ];

  const behaviorQuestions = [
    'Би бусадтай нээлттэй харилцдаг',
    'Би бусдыг анхааралтай сонсдог',
    'Би санал зөрөлдөөнөөс зайлсхийдэг',
    'Би багаар ажиллах дуртай',
    'Би хамт олондоо хувь нэмэр оруулдаг',
    'Би бусдаас тусламж хүсэхэд эвгүйцдэг',
    'Би шүүмжлэлийг хүлээж авч чаддаг',
    'Би бусдыг ойлгож хандахыг хичээдэг',
    'Би бусдын сэтгэл хөдлөлийг анзаардаг',
    'Би үүрэг хариуцлагаа ухамсарладаг',
    'Би амласнаа биелүүлдэг',
    'Би ажлаас зайлсхийх хандлагатай',
  ];

  const wellbeingQuestions = [
    'Би амьдралдаа сэтгэл хангалуун байдаг',
    'Би өөрийгөө аз жаргалтай гэж мэдэрдэг',
    'Би ирээдүйд итгэлтэй ханддаг',
    'Миний ажил хувийн амьдралд хэт нөлөөлдөг',
    'Би гэр бүл, хувийн амьдралдаа хангалттай цаг гаргадаг',
    'Би ажлаасаа болоод хувийн амьдралаа золиосолдог',
    'Би өдөр тутам эрч хүчтэй байдаг',
    'Би ихэнхдээ ядрангуй байдаг',
    'Би өглөө босоход урамтай байдаг',
    'Миний wellbeing сайн түвшинд байна',
    'Би өөрийн сэтгэл зүйн байдалдаа санаа зовдог',
    'Надад мэргэжлийн дэмжлэг хэрэгтэй санагддаг',
  ];


  const predefinedSurveys = [
    {
      title: 'Ажлын байрны сэтгэл зүйн үнэлгээ',
      description: 'Ажилтнуудын стресс, сэтгэл хөдлөлийн төлөв.',
    },
    {
      title: 'Байгууллагын соёлын үнэлгээ',
      description: 'Байгууллагын соёлын сайн сайхан байдал.',
    },
    {
      title: 'Бие хүний онцлог',
      description: 'Хувь хүний зан чанар, сэтгэл зүйн шугам.',
    },
    {
      title: 'Зөөлөн ур чадвар',
      description: 'Харилцаа, багийн ажил, үүрэг хариуцлага.',
    },
    {
      title: 'Сэтгэл зүйн эрүүл мэнд',
      description: 'Гүнзгий шинжилгээ, зөвлөмж.',
    },
  ];

  for (const predefined of predefinedSurveys) {
    const existing = await prisma.survey.findFirst({
      where: { title: predefined.title },
    });

    if (!existing) {
      await prisma.survey.create({
        data: {
          title: predefined.title,
          description: predefined.description,
          createdBy: consultant.id,
          status: 'PUBLISHED',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          targetDepartment: null,
          isAnonymous: true,
          questions: {
            create: [
              {
                questionText: 'Энэ судалгаанд оролцсоноор таны сэтгэгдэл үнэтэй гэж үзэж байна уу?',
                questionType: 'likert',
                isRequired: true,
                displayOrder: 0,
              },
              {
                questionText: 'Сүүлийн сард таны ажлын ачаалал хэр зохистой байсан бэ?',
                questionType: 'likert',
                isRequired: true,
                displayOrder: 1,
              },
            ],
          },
        },
      });
    }
  }

  const ratingOptions = JSON.stringify([1, 2, 3, 4, 5]);

  async function upsertSurveyWithResponses(params: {
    id: string;
    title: string;
    description: string;
    questions: { text: string; type: string; options?: string | null }[];
    responses: { respondentId: string; answers: (number | string)[]; sentimentScore?: number }[];
  }) {
    const surveyRecord = await prisma.survey.upsert({
      where: { id: params.id },
      update: {
        title: params.title,
        description: params.description,
        createdBy: admin.id,
        status: 'PUBLISHED',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        targetDepartment: null,
        targetRoles: JSON.stringify(['EMPLOYEE']),
        isAnonymous: true,
      },
      create: {
        id: params.id,
        title: params.title,
        description: params.description,
        createdBy: admin.id,
        status: 'PUBLISHED',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        targetDepartment: null,
        targetRoles: JSON.stringify(['EMPLOYEE']),
        isAnonymous: true,
      },
    });

    await prisma.surveyResponse.deleteMany({ where: { surveyId: surveyRecord.id } });
    await prisma.surveyQuestion.deleteMany({ where: { surveyId: surveyRecord.id } });

    await prisma.surveyQuestion.createMany({
      data: params.questions.map((q, index) => ({
        surveyId: surveyRecord.id,
        questionText: q.text,
        questionType: q.type,
        options: q.options ?? null,
        isRequired: true,
        displayOrder: index + 1,
        createdAt: new Date(),
      })),
    });

    const createdQuestions = await prisma.surveyQuestion.findMany({
      where: { surveyId: surveyRecord.id },
      orderBy: { displayOrder: 'asc' },
    });

    for (const response of params.responses) {
      await prisma.surveyResponse.create({
        data: {
          surveyId: surveyRecord.id,
          respondentId: response.respondentId,
          sentimentScore: response.sentimentScore ?? null,
          questionResponses: {
            create: response.answers.map((answer, index) => ({
              questionId: createdQuestions[index]?.id || '',
              answer: JSON.stringify(answer),
            })),
          },
        },
      });
    }
  }

  await upsertSurveyWithResponses({
    id: 'work-psych-2026',
    title: 'Ажлын байрны сэтгэл зүйн үнэлгээ',
    description: 'Ажилтнуудын стресс, сэтгэл хөдлөлийн төлөвийг үнэлнэ.',
    questions: mentalHealthQuestions.map((text) => ({
      text,
      type: 'RATING',
      options: ratingOptions,
    })),
    responses: [
      {
        respondentId: employee1.id,
        answers: [4, 4, 3, 3, 3, 4, 3, 4, 3, 3, 4, 3],
        sentimentScore: 0.3,
      },
      {
        respondentId: employee2.id,
        answers: [2, 2, 2, 3, 3, 2, 4, 3, 2, 2, 3, 4],
        sentimentScore: -0.1,
      },
      {
        respondentId: employee1.id,
        answers: [5, 4, 4, 4, 2, 4, 2, 4, 3, 4, 4, 3],
        sentimentScore: 0.5,
      },
    ],
  });

  await upsertSurveyWithResponses({
    id: 'org-culture-2026',
    title: 'Байгууллагын соёлын үнэлгээ',
    description: 'Байгууллагын соёлын сайн сайхан байдлыг үнэлнэ.',
    questions: orgCultureQuestions.map((text) => ({
      text,
      type: 'RATING',
      options: ratingOptions,
    })),
    responses: [
      {
        respondentId: employee2.id,
        answers: [4, 4, 4, 5, 4, 2, 4, 4, 3, 4, 4, 2],
        sentimentScore: 0.4,
      },
      {
        respondentId: employee1.id,
        answers: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        sentimentScore: 0.0,
      },
      {
        respondentId: employee2.id,
        answers: [5, 5, 4, 4, 4, 2, 4, 4, 4, 5, 5, 1],
        sentimentScore: 0.6,
      },
    ],
  });

  await upsertSurveyWithResponses({
    id: 'personality-profile-2026',
    title: 'Бие хүний онцлог',
    description: 'Хувь хүний зан чанар, сэтгэл зүйн шугамын үнэлгээ.',
    questions: personalProfileQuestions.map((text) => ({
      text,
      type: 'RATING',
      options: ratingOptions,
    })),
    responses: [
      {
        respondentId: employee1.id,
        answers: [4, 4, 4, 4, 3, 3, 4, 4, 2, 4, 4, 3],
        sentimentScore: 0.4,
      },
      {
        respondentId: employee2.id,
        answers: [5, 4, 4, 4, 4, 4, 5, 5, 3, 4, 5, 2],
        sentimentScore: 0.5,
      },
      {
        respondentId: employee1.id,
        answers: [3, 3, 3, 3, 3, 2, 3, 3, 4, 3, 3, 4],
        sentimentScore: 0.1,
      },
    ],
  });

  await upsertSurveyWithResponses({
    id: 'soft-skills-2026',
    title: 'Зөөлөн ур чадвар',
    description: 'Харилцаа, багийн ажил, үүрэг хариуцлагын үнэлгээ.',
    questions: behaviorQuestions.map((text) => ({
      text,
      type: 'RATING',
      options: ratingOptions,
    })),
    responses: [
      {
        respondentId: employee2.id,
        answers: [5, 4, 3, 5, 5, 3, 4, 4, 5, 5, 5, 2],
        sentimentScore: 0.6,
      },
      {
        respondentId: employee1.id,
        answers: [3, 3, 3, 4, 3, 3, 3, 4, 3, 4, 4, 3],
        sentimentScore: 0.1,
      },
      {
        respondentId: employee2.id,
        answers: [4, 5, 3, 4, 4, 2, 4, 5, 4, 4, 5, 2],
        sentimentScore: 0.5,
      },
    ],
  });

  await upsertSurveyWithResponses({
    id: 'mental-health-2026',
    title: 'Сэтгэл зүйн эрүүл мэнд',
    description: 'Гүнзгий шинжилгээ, зөвлөмжийн оролцоотой үнэлгээ.',
    questions: wellbeingQuestions.map((text) => ({
      text,
      type: 'RATING',
      options: ratingOptions,
    })),
    responses: [
      {
        respondentId: employee1.id,
        answers: [4, 4, 4, 2, 3, 2, 4, 3, 4, 4, 3, 2],
        sentimentScore: 0.2,
      },
      {
        respondentId: employee2.id,
        answers: [5, 4, 4, 3, 4, 2, 4, 3, 4, 4, 2, 2],
        sentimentScore: 0.3,
      },
      {
        respondentId: employee1.id,
        answers: [3, 3, 3, 4, 2, 4, 3, 4, 3, 3, 4, 4],
        sentimentScore: 0.1,
      },
    ],
  });

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
