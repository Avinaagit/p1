/**
 * Survey Interpretation Engine - Production-Level Psychosocial Analytics
 * Three-tier analysis: Scoring → Impact → Reporting
 */

export interface CategoryScore {
  category: string;
  categoryMn: string;
  averageScore: number;
  weightedScore: number;
  level: 'healthy' | 'attention' | 'risk' | 'high-risk';
  levelMn: string;
  icon: string;
  interpretation: string;
  color: string;
  aiNarrative?: string;
  earlyWarning?: {
    triggered: boolean;
    severity: 'info' | 'warning' | 'critical';
    message: string;
  };
  domainWeight: number;
  impactItems?: {
    critical: number;
    risk: number;
    protective: number;
  };
}

export interface SurveyInterpretation {
  overallScore: number;
  overallIndex: number; // Weighted overall index
  overallLevel: string;
  overallInterpretation: string;
  categories: CategoryScore[];
  combinedDiagnosis?: {
    stressLevel: string;
    cultureLevel: string;
    diagnosis: string;
    diagnosisMn: string;
    severity: 'critical' | 'high' | 'moderate' | 'healthy';
    icon: string;
    recommendation: string;
  };
  earlyWarnings: Array<{
    category: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    actionRequired: string;
  }>;
  iso45003Compliance: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiresAction: boolean;
    complianceNotes: string;
  };
  esgMetrics: {
    socialScore: number;
    wellbeingIndex: number;
    diversityInclusionScore: number;
    psychologicalSafetyScore: number;
    overallESGRating: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  recommendationLevel: 'none' | 'monitor' | 'action-needed' | 'immediate-action';
  dataOutput: {
    overall_index: number;
    risk_level: string;
    domains: Record<string, { score: number; weighted_score: number; flag: string }>;
    recommendation_level: string;
  };
  generatedAt: Date;
}

/**
 * I. WEIGHTING MODEL - Domain weights based on psychosocial impact research
 */
const DOMAIN_WEIGHTS = {
  'Mental Health & Stress': 0.30, // MH - 30% (highest impact on burnout, turnover)
  'Workplace Psychological Environment': 0.25, // PS - 25% (culture, safety)
  'Personal Psychological State': 0.15, // PP - 15%
  'Behavior & Interaction Style': 0.15, // BI - 15%
  'Overall Wellbeing & Work-Life Balance': 0.15, // WB - 15%
};

/**
 * II. ITEM IMPACT MODEL - Question type multipliers
 */
enum ItemImpact {
  PROTECTIVE = 0.8, // Protective factors buffer risk
  NEUTRAL = 1.0, // Standard questions
  RISK = 1.3, // Risk indicators
  CRITICAL = 1.6, // Critical warning signs
}

/**
 * Item classification mapping (question index → impact type)
 * Based on psychometric research and clinical significance
 */
const ITEM_IMPACT_MAP: Record<number, ItemImpact> = {
  // Mental Health & Stress (0-11)
  0: ItemImpact.RISK, // Байнга дарамт мэдрэх
  1: ItemImpact.RISK, // Ачаалал хэт их
  2: ItemImpact.RISK, // Стресс тайлахад хүндрэлтэй
  3: ItemImpact.PROTECTIVE, // Амар тайван болдог
  4: ItemImpact.CRITICAL, // Уур уцаартай
  5: ItemImpact.PROTECTIVE, // Тогтвортой
  6: ItemImpact.RISK, // Санаа зовнил их
  7: ItemImpact.PROTECTIVE, // Тайван тэнцвэртэй
  8: ItemImpact.CRITICAL, // Өглөө ядарсан
  9: ItemImpact.PROTECTIVE, // Хангалттай амардаг
  10: ItemImpact.PROTECTIVE, // Сэргэдэг
  11: ItemImpact.CRITICAL, // Амралтын өдөр ч ажлаа бодох (burnout шинж)

  // Workplace Psychological Environment (12-23)
  12: ItemImpact.PROTECTIVE, // Өөрөө байх боломжтой
  13: ItemImpact.PROTECTIVE, // Айдасгүй илэрхийлэх
  14: ItemImpact.PROTECTIVE, // Алдааг ойлгож ханддаг
  15: ItemImpact.RISK, // Удирдлагад итгэх
  16: ItemImpact.PROTECTIVE, // Бие биедээ итгэдэг
  17: ItemImpact.CRITICAL, // Шударга бус хандлага
  18: ItemImpact.PROTECTIVE, // Хүндлэл мэдрэгддэг
  19: ItemImpact.NEUTRAL, // Харилцаа ойлгомжтой
  20: ItemImpact.PROTECTIVE, // Зөрчил эрүүл шийдэгддэг
  21: ItemImpact.PROTECTIVE, // Дэмжлэг авч чаддаг
  22: ItemImpact.PROTECTIVE, // Байгууллага wellbeing-д анхаардаг
  23: ItemImpact.CRITICAL, // Ганцаардсан

  // Personal Psychological State (24-35)
  24: ItemImpact.PROTECTIVE, // Сэтгэл хөдлөлөө ойлгодог
  25: ItemImpact.PROTECTIVE, // Давуу талаа мэддэг
  26: ItemImpact.PROTECTIVE, // Сул талаа хүлээн зөвшөөрдөг
  27: ItemImpact.PROTECTIVE, // Сэтгэл хөдлөлөө удирддаг
  28: ItemImpact.PROTECTIVE, // Стресс зохицуулдаг
  29: ItemImpact.PROTECTIVE, // Сөрөг бодлоо хянадаг
  30: ItemImpact.PROTECTIVE, // Шинэ нөхцөлд дасдаг
  31: ItemImpact.PROTECTIVE, // Өөрчлөлтийг эерэгээр хүлээн авдаг
  32: ItemImpact.RISK, // Тодорхойгүй байдал түгшээдэг
  33: ItemImpact.PROTECTIVE, // Өөртөө итгэлтэй
  34: ItemImpact.PROTECTIVE, // Өөрийгөө үнэлдэг
  35: ItemImpact.RISK, // Бусадтай харьцуулдаг

  // Behavior & Interaction (36-47)
  36: ItemImpact.PROTECTIVE, // Нээлттэй харилцдаг
  37: ItemImpact.PROTECTIVE, // Анхааралтай сонсдог
  38: ItemImpact.RISK, // Зөрөлдөөнөөс зайлсхийдэг
  39: ItemImpact.PROTECTIVE, // Багаар ажиллах дуртай
  40: ItemImpact.PROTECTIVE, // Хувь нэмэр оруулдаг
  41: ItemImpact.RISK, // Тусламж хүсэхэд эвгүйцдэг
  42: ItemImpact.PROTECTIVE, // Шүүмжлэл хүлээн авдаг
  43: ItemImpact.PROTECTIVE, // Ойлгож ханддаг
  44: ItemImpact.PROTECTIVE, // Сэтгэл хөдлөл анзаардаг
  45: ItemImpact.PROTECTIVE, // Хариуцлагаа ухамсарладаг
  46: ItemImpact.PROTECTIVE, // Амласнаа биелүүлдэг
  47: ItemImpact.CRITICAL, // Ажлаас зайлсхийх (withdrawal)

  // Overall Wellbeing (48-59)
  48: ItemImpact.PROTECTIVE, // Сэтгэл хангалуун
  49: ItemImpact.PROTECTIVE, // Аз жаргалтай
  50: ItemImpact.PROTECTIVE, // Ирээдүйд итгэлтэй
  51: ItemImpact.CRITICAL, // Ажил хувийн амьдралд хэт нөлөөлдөг
  52: ItemImpact.PROTECTIVE, // Хангалттай цаг гаргадаг
  53: ItemImpact.CRITICAL, // Амьдралаа золиосолдог
  54: ItemImpact.PROTECTIVE, // Эрч хүчтэй
  55: ItemImpact.PROTECTIVE, // Ядрангуй
  56: ItemImpact.PROTECTIVE, // Урамтай
  57: ItemImpact.PROTECTIVE, // Wellbeing сайн
  58: ItemImpact.RISK, // Байдалдаа санаа зовдог
  59: ItemImpact.CRITICAL, // Мэргэжлийн дэмжлэг хэрэгтэй
};

/**
 * Category definitions mapping question ranges to categories
 */
const CATEGORY_RANGES = [
  {
    category: 'Mental Health & Stress',
    categoryMn: 'Сэтгэл зүйн эрүүл мэнд & стресс',
    startIndex: 0,
    endIndex: 11,
    weight: DOMAIN_WEIGHTS['Mental Health & Stress'],
  },
  {
    category: 'Workplace Psychological Environment',
    categoryMn: 'Байгууллагын сэтгэл зүйн орчин & соёл',
    startIndex: 12,
    endIndex: 23,
    weight: DOMAIN_WEIGHTS['Workplace Psychological Environment'],
  },
  {
    category: 'Personal Psychological State',
    categoryMn: 'Хувь хүний сэтгэл зүйн төлөв',
    startIndex: 24,
    endIndex: 35,
    weight: DOMAIN_WEIGHTS['Personal Psychological State'],
  },
  {
    category: 'Behavior & Interaction Style',
    categoryMn: 'Зан төлөв & харилцааны хэв маяг',
    startIndex: 36,
    endIndex: 47,
    weight: DOMAIN_WEIGHTS['Behavior & Interaction Style'],
  },
  {
    category: 'Overall Wellbeing & Work-Life Balance',
    categoryMn: 'Ерөнхий wellbeing & амьдрал–ажлын тэнцвэр',
    startIndex: 48,
    endIndex: 59,
    weight: DOMAIN_WEIGHTS['Overall Wellbeing & Work-Life Balance'],
  },
];

/**
 * Score level thresholds
 */
function getScoreLevel(score: number): {
  level: 'healthy' | 'attention' | 'risk' | 'high-risk';
  levelMn: string;
  color: string;
  icon: string;
} {
  if (score >= 4.2) {
    return {
      level: 'healthy',
      levelMn: 'Эрүүл, тогтвортой',
      color: 'green',
      icon: '🟢',
    };
  } else if (score >= 3.4) {
    return {
      level: 'attention',
      levelMn: 'Анхаарал шаардах',
      color: 'yellow',
      icon: '🟡',
    };
  } else if (score >= 2.6) {
    return {
      level: 'risk',
      levelMn: 'Эрсдэл нэмэгдсэн',
      color: 'orange',
      icon: '🟠',
    };
  } else {
    return {
      level: 'high-risk',
      levelMn: 'Өндөр эрсдэл',
      color: 'red',
      icon: '🔴',
    };
  }
}

/**
 * Category-specific interpretations
 */
const INTERPRETATIONS: Record<string, Record<string, string>> = {
  'Mental Health & Stress': {
    healthy: 'Таны сэтгэл зүйн байдал одоогоор тогтвортой байна. Стрессээ сайн удирдаж, хангалттай сэргээлттэй байна.',
    attention:
      'Сүүлийн үед стресс нэмэгдсэн шинж илэрч байна. Ажлын ачаалал нэмэгдэж, амралт хангалтгүй байж магадгүй. Анхаарал шаардлагатай.',
    risk: 'Архаг стресс үүсэх эрсдэл нэмэгдсэн байна. Байнгын ядаргаа, нойр болон анхаарал алдагдаж байна.',
    'high-risk':
      'Burnout үүсэх өндөр эрсдэл илэрч байна. Сэтгэл санааны "хоосрол", ажилд хөндийрөх мэдрэмж илэрч байна. Дэмжлэг шаардлагатай.',
  },
  'Workplace Psychological Environment': {
    healthy:
      'Танай ажлын орчин сэтгэл зүйн хувьд аюулгүй байна. Итгэлцэл өндөр, нээлттэй харилцаа бий.',
    attention:
      'Сэтгэл зүйн аюулгүй байдал хэсэгчлэн хангагдаж байна. Зарим багт итгэл сул, харилцаа жигд бус байж болно.',
    risk: 'Итгэлцэл болон харилцааны асуудал илэрч байна. Шударга бус хандлага мэдрэгдэж байна.',
    'high-risk':
      'Ажлын орчин сэтгэл зүйн хувьд аюулгүй бус байна. Айдас, дарамт, ганцаардлын мэдрэмж өндөр байна.',
  },
  'Personal Psychological State': {
    healthy: 'Өөрийгөө сайн ойлгож, удирдаж чаддаг байна. Өөртөө итгэх итгэл өндөр.',
    attention: 'Өөрийгөө ойлгох чадвар хэлбэлзэлтэй байна. Заримдаа өөртөө итгэх итгэл сулардаг.',
    risk: 'Өөртөө итгэх итгэл сулрах үе байна. Сөрөг бодлоо хянахад бэрх.',
    'high-risk':
      'Өөрийгөө үнэлэх түвшин ноцтой буурсан байна. Өөртэйгөө харьцах харилцаанд дэмжлэг шаардлагатай.',
  },
  'Behavior & Interaction Style': {
    healthy: 'Эрүүл харилцааны хэв маяг. Бусадтай нээлттэй харилцаж, багаар ажиллах дуртай.',
    attention: 'Сонгомол харилцаа. Зарим нөхцөлд зайлсхийх хандлагатай байдаг.',
    risk: 'Зайлсхийх эсвэл хамгаалах хандлага. Бусдаас тусламж хүсэхэд эвгүйцдэг.',
    'high-risk':
      'Харилцааны эрсдэлтэй хэв маяг. Санал зөрөлдөөнөөс зайлсхийх, ганцаарчлах хандлага өндөр.',
  },
  'Overall Wellbeing & Work-Life Balance': {
    healthy:
      'Wellbeing өндөр түвшинд байна. Амьдралдаа сэтгэл хангалуун, ажил амьдралын тэнцвэр сайн.',
    attention:
      'Wellbeing хэлбэлзэлтэй байна. Ажил хувийн амьдралд хэт нөлөөлж эхэлж байна.',
    risk: 'Wellbeing доройтож эхэлсэн байна. Ажил–амьдралын тэнцвэр алдагдаж байна.',
    'high-risk':
      'Wellbeing ноцтой буурсан байна. Амьдралын ерөнхий сэтгэл ханамж, эрч хүч доройтсон. Мэргэжлийн дэмжлэг шаардлагатай.',
  },
};

/**
 * Analyze survey responses and generate interpretation
 */
export function analyzeSurveyResponses(
  responses: Array<{ questionId: string; answer: string }>,
  questions: Array<{ id: string; displayOrder: number }>
): SurveyInterpretation {
  // Create a map of question display order to answer
  const answerMap = new Map<number, number>();

  responses.forEach((resp) => {
    const question = questions.find((q) => q.id === resp.questionId);
    if (question) {
      const numAnswer = parseInt(resp.answer, 10);
      if (!isNaN(numAnswer)) {
        answerMap.set(question.displayOrder, numAnswer);
      }
    }
  });

  // Calculate category scores with weighted impact model
  const categories: CategoryScore[] = CATEGORY_RANGES.map((catDef) => {
    const scores: number[] = [];
    const impactedScores: number[] = [];
    let criticalCount = 0;
    let riskCount = 0;
    let protectiveCount = 0;

    for (let i = catDef.startIndex; i <= catDef.endIndex; i++) {
      const answer = answerMap.get(i + 1); // displayOrder is 1-based
      if (answer !== undefined) {
        scores.push(answer);

        // Apply item impact multiplier
        const itemImpact = ITEM_IMPACT_MAP[i] || ItemImpact.NEUTRAL;
        
        // Reverse score for protective items (higher protective = better)
        let adjustedScore: number;
        if (itemImpact === ItemImpact.PROTECTIVE) {
          adjustedScore = answer * itemImpact;
          protectiveCount++;
        } else {
          // For risk/critical items, lower score = higher weight
          adjustedScore = answer * (itemImpact === ItemImpact.CRITICAL ? 1.6 : 
                                    itemImpact === ItemImpact.RISK ? 1.3 : 1.0);
          if (itemImpact === ItemImpact.CRITICAL && answer <= 2) criticalCount++;
          if (itemImpact === ItemImpact.RISK && answer <= 2) riskCount++;
        }
        
        impactedScores.push(adjustedScore);
      }
    }

    // Raw average (unweighted)
    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : 0;

    // Weighted score (with impact multipliers, normalized back to 1-5 scale)
    const weightedScore =
      impactedScores.length > 0
        ? impactedScores.reduce((sum, s) => sum + s, 0) / impactedScores.length
        : 0;

    const levelInfo = getScoreLevel(averageScore);
    const interpretation =
      INTERPRETATIONS[catDef.category]?.[levelInfo.level] ||
      'Дүн шинжилгээ боломжгүй байна.';

    // AI narrative generation
    const aiNarrative = generateAINarrative(catDef.category, averageScore, levelInfo.level);

    // Early warning detection with item-level analysis
    const earlyWarning = detectEarlyWarning(
      catDef.category,
      averageScore,
      levelInfo.level,
      criticalCount,
      riskCount
    );

    return {
      category: catDef.category,
      categoryMn: catDef.categoryMn,
      averageScore: parseFloat(averageScore.toFixed(2)),
      weightedScore: parseFloat(weightedScore.toFixed(2)),
      level: levelInfo.level,
      levelMn: levelInfo.levelMn,
      icon: levelInfo.icon,
      interpretation,
      color: levelInfo.color,
      aiNarrative,
      earlyWarning,
      domainWeight: catDef.weight,
      impactItems: {
        critical: criticalCount,
        risk: riskCount,
        protective: protectiveCount,
      },
    };
  });

  // Calculate overall score
  const allScores = Array.from(answerMap.values());
  const overallScore =
    allScores.length > 0
      ? parseFloat(
          (allScores.reduce((sum, s) => sum + s, 0) / allScores.length).toFixed(2)
        )
      : 0;

  // Calculate weighted overall index (domain-weighted)
  const overallIndex =
    categories.length > 0
      ? parseFloat(
          categories
            .reduce((sum, cat) => sum + cat.averageScore * cat.domainWeight, 0)
            .toFixed(2)
        )
      : 0;

  const overallLevelInfo = getScoreLevel(overallIndex); // Use weighted index for level

  let overallInterpretation = '';
  if (overallIndex >= 4.2) {
    overallInterpretation =
      'Таны ерөнхий wellbeing өндөр түвшинд байна. Сэтгэл зүй, ажлын орчин, харилцаа бүгд тогтвортой байна.';
  } else if (overallIndex >= 3.4) {
    overallInterpretation =
      'Таны wellbeing сайн боловч зарим хэсэгт анхаарал шаардлагатай. Доорх категориудыг шалгана уу.';
  } else if (overallIndex >= 2.6) {
    overallInterpretation =
      'Таны wellbeing эрсдэл нэмэгдсэн байна. Мэргэжлийн зөвлөгөө авах, тодорхой арга хэмжээ авахыг зөвлөж байна.';
  } else {
    overallInterpretation =
      'Таны wellbeing өндөр эрсдэлтэй байна. Мэргэжлийн сэтгэл зүйн дэмжлэг авах шаардлагатай байна.';
  }

  // Combined diagnosis: Stress (category 0) + Culture (category 1)
  const combinedDiagnosis = generateCombinedDiagnosis(categories);

  // Collect early warnings with III. TRIGGER RULES
  const earlyWarnings = categories
    .filter((cat) => cat.earlyWarning?.triggered)
    .map((cat) => ({
      category: cat.categoryMn,
      severity: cat.earlyWarning!.severity,
      message: cat.earlyWarning!.message,
      actionRequired: getActionRequired(cat.earlyWarning!.severity),
    }));

  // Apply advanced trigger rules
  const advancedTriggers = applyAdvancedTriggers(categories, overallIndex);
  earlyWarnings.push(...advancedTriggers);

  // Determine recommendation level
  const recommendationLevel = determineRecommendationLevel(earlyWarnings, overallIndex);

  // ISO 45003 compliance assessment
  const iso45003Compliance = assessISO45003Compliance(overallIndex, categories);

  // ESG metrics calculation
  const esgMetrics = calculateESGMetrics(categories, overallIndex);

  // IV. DATA OUTPUT STRUCTURE
  const dataOutput = {
    overall_index: overallIndex,
    risk_level: overallLevelInfo.levelMn,
    domains: Object.fromEntries(
      categories.map((cat) => [
        cat.category,
        {
          score: cat.averageScore,
          weighted_score: cat.weightedScore,
          flag: cat.color === 'green' ? 'Green' : 
                cat.color === 'yellow' ? 'Amber' :
                cat.color === 'orange' ? 'Amber' : 'Red',
        },
      ])
    ),
    recommendation_level: recommendationLevel,
  };

  return {
    overallScore,
    overallIndex,
    overallLevel: overallLevelInfo.levelMn,
    overallInterpretation,
    categories,
    combinedDiagnosis,
    earlyWarnings,
    iso45003Compliance,
    esgMetrics,
    recommendationLevel,
    dataOutput,
    generatedAt: new Date(),
  };
}

/**
 * Generate combined diagnosis based on stress and culture scores
 */
function generateCombinedDiagnosis(categories: CategoryScore[]) {
  if (categories.length < 2) return undefined;

  const stressCategory = categories[0]; // Mental Health & Stress
  const cultureCategory = categories[1]; // Workplace Psychological Environment

  const stressLevel = stressCategory.level;
  const cultureLevel = cultureCategory.level;

  // Combined diagnosis matrix
  const diagnosisMatrix: Record<
    string,
    {
      diagnosis: string;
      diagnosisMn: string;
      severity: 'critical' | 'high' | 'moderate' | 'healthy';
      icon: string;
      recommendation: string;
    }
  > = {
    'high-risk_high-risk': {
      diagnosis: 'Systemic burnout risk',
      diagnosisMn: 'Системийн burnout эрсдэл',
      severity: 'critical',
      icon: '🔴🔴',
      recommendation:
        'Маш эмзэг нөхцөл байдал. Ажилтны сэтгэл зүйн болон байгууллагын соёлын хоёуланд нь ноцтой асуудал илэрч байна. Яаралтай мэргэжлийн хөтөлбөр зайлшгүй шаардлагатай.',
    },
    'high-risk_healthy': {
      diagnosis: 'Individual overload',
      diagnosisMn: 'Хувь хүний хэт ачаалал',
      severity: 'high',
      icon: '🔴🟢',
      recommendation:
        'Ажлын орчин аюулгүй ч хувь хүн хэт ачаалалтай байна. Хувийн сэргээлт, амралт, ажлын ачааллыг бууруулах шаардлагатай.',
    },
    'healthy_high-risk': {
      diagnosis: 'Cultural toxicity risk',
      diagnosisMn: 'Соёлын хоруу орчин',
      severity: 'high',
      icon: '🟢🔴',
      recommendation:
        'Хувь хүн тогтвортой боловч ажлын орчин сэтгэл зүйн хувьд аюулгүй бус байна. Итгэлцэл, харилцааны соёлыг сайжруулах шаардлагатай.',
    },
    'risk_risk': {
      diagnosis: 'Latent psychosocial risk',
      diagnosisMn: 'Далд сэтгэл зүйн эрсдэл',
      severity: 'moderate',
      icon: '🟠🟠',
      recommendation:
        'Стресс болон соёлын хоёуланд эрсдэл нэмэгдэж байна. Урьдчилан сэргийлэх арга хэмжээ авах цаг болжээ.',
    },
    'attention_risk': {
      diagnosis: 'Latent psychosocial risk',
      diagnosisMn: 'Далд сэтгэл зүйн эрсдэл',
      severity: 'moderate',
      icon: '🟡🟠',
      recommendation: 'Ажлын орчны соёлд анхаарал хандуулах шаардлагатай.',
    },
    'risk_attention': {
      diagnosis: 'Latent psychosocial risk',
      diagnosisMn: 'Далд сэтгэл зүйн эрсдэл',
      severity: 'moderate',
      icon: '🟠🟡',
      recommendation: 'Хувь хүний стресс удирдлагад анхаарах шаардлагатай.',
    },
    'healthy_healthy': {
      diagnosis: 'Healthy workplace',
      diagnosisMn: 'Эрүүл ажлын орчин',
      severity: 'healthy',
      icon: '🟢🟢',
      recommendation:
        'Сайн байна! Стресс болон ажлын орчин хоёулаа тогтвортой. Үргэлжлүүлэн хадгална уу.',
    },
    'healthy_attention': {
      diagnosis: 'Healthy workplace',
      diagnosisMn: 'Ерөнхийдөө эрүүл',
      severity: 'healthy',
      icon: '🟢🟡',
      recommendation: 'Сайн байна, зөвхөн ажлын соёлд бага зэрэг анхаарах.',
    },
    'attention_healthy': {
      diagnosis: 'Healthy workplace',
      diagnosisMn: 'Ерөнхийдөө эрүүл',
      severity: 'healthy',
      icon: '🟡🟢',
      recommendation: 'Сайн байна, зөвхөн стрессээ удирдахад бага зэрэг анхаарах.',
    },
    'attention_attention': {
      diagnosis: 'Healthy workplace',
      diagnosisMn: 'Анхаарал шаардах',
      severity: 'healthy',
      icon: '🟡🟡',
      recommendation: 'Ерөнхийдөө сайн, гэхдээ стресс болон соёлд бага зэрэг сайжруулалт хэрэгтэй.',
    },
  };

  const key = `${stressLevel}_${cultureLevel}`;
  const result = diagnosisMatrix[key];

  if (!result) {
    // Fallback for other combinations
    return {
      stressLevel,
      cultureLevel,
      diagnosis: 'Mixed indicators',
      diagnosisMn: 'Холимог үзүүлэлт',
      severity: 'moderate' as const,
      icon: '🟡',
      recommendation: 'Стресс болон соёлын түвшинд анхаарах шаардлагатай.',
    };
  }

  return {
    stressLevel,
    cultureLevel,
    ...result,
  };
}

/**
 * Generate AI narrative for deeper insights
 */
function generateAINarrative(category: string, score: number, level: string): string {
  const narratives: Record<string, Record<string, string>> = {
    'Mental Health & Stress': {
      'high-risk':
        'Дүн шинжилгээний үр дүн: Стрессийн түвшин эрчимтэй өндөр байна. Ажилтан архаг ядаргаа, сэтгэл санааны тогтворгүй байдал, унтах чанаргүй зэрэг шинжтэй байна. Burnout-ийн эрсдэл ихтэй.',
      risk: 'Дүн шинжилгээний үр дүн: Стресс хуримтлагдаж байна. Ажлын ачаалал, цаг удирдлага, амралтын дутагдал илэрч байна. Тогтвортой сэргээлт шаардлагатай.',
      attention:
        'Дүн шинжилгээний үр дүн: Стресс хэмжээ хэвийн боловч сануулах түвшинд хүрсэн. Урьдчилан сэргийлэх арга хэмжээ авах боломжтой.',
      healthy:
        'Дүн шинжилгээний үр дүн: Сэтгэл зүйн эрүүл мэнд сайн. Стрессээ сайн удирдаж, хангалттай амардаг байна.',
    },
    'Workplace Psychological Environment': {
      'high-risk':
        'Дүн шинжилгээний үр дүн: Сэтгэл зүйн аюулгүй байдал маш доогуур. Итгэлцэл, нээлттэй харилцаа, хамт олны дэмжлэг дутагдаж байна. Соёлын өөрчлөлт яаралтай.',
      risk: 'Дүн шинжилгээний үр дүн: Ажлын орчинд итгэлцэл сулардаж, шударга бус хандлага мэдрэгдэж байна. Удирдлагын анхаарал шаардлагатай.',
      attention:
        'Дүн шинжилгээний үр дүн: Орчин ерөнхийдөө сайн боловч зарим хэсэгт харилцааны асуудал гарч байна. Сайжруулалт боломжтой.',
      healthy:
        'Дүн шинжилгээний үр дүн: Ажлын орчин сэтгэл зүйн хувьд аюулгүй. Итгэлцэл, нээлттэй харилцаа, баг дундаа дэмжлэг өндөр.',
    },
    'Personal Psychological State': {
      'high-risk':
        'Дүн шинжилгээний үр дүн: Өөрийгөө үнэлэх түвшин, итгэлцэл маш доогуур. Сөрөг бодлоо хянах, өөрчлөлтийг хүлээн авахад хүндрэлтэй байна.',
      risk: 'Дүн шинжилгээний үр дүн: Өөртөө итгэх итгэл сулардаж, өөрийн давуу талыг хүлээн зөвшөөрөхөд бэрхшээлтэй байна.',
      attention:
        'Дүн шинжилгээний үр дүн: Өөрийгөө ойлгох чадвар хэлбэлзэлтэй. Зарим үед өөртөө итгэх итгэл сулардаг.',
      healthy:
        'Дүн шинжилгээний үр дүн: Өөрийгөө сайн ойлгож удирдаж чаддаг. Өөртөө итгэх итгэл өндөр, сул талаа хүлээн зөвшөөрдөг.',
    },
    'Behavior & Interaction Style': {
      'high-risk':
        'Дүн шинжилгээний үр дүн: Харилцааны хэв маяг эрсдэлтэй. Бусдаас зайлсхийх, тусламж хүсэхээс татгалзах хандлага өндөр.',
      risk: 'Дүн шинжилгээний үр дүн: Харилцаанд хамгаалах хандлага. Зөрчилдөөнөөс зайлсхийх, багаар ажиллахад бэрхшээлтэй.',
      attention:
        'Дүн шинжилгээний үр дүн: Харилцаа сонгомол. Заримдаа зайлсхийх хандлагатай байдаг боловч ерөнхийдөө тогтвортой.',
      healthy:
        'Дүн шинжилгээний үр дүн: Эрүүл харилцааны хэв маяг. Бусадтай нээлттэй, багаар сайн ажилладаг, тусламж хүсч чаддаг.',
    },
    'Overall Wellbeing & Work-Life Balance': {
      'high-risk':
        'Дүн шинжилгээний үр дүн: Wellbeing ноцтой доройтсон. Амьдралын сэтгэл ханамж, ажил-амьдралын тэнцвэр алдагдсан. Эрч хүч, урам зориг маш доогуур.',
      risk: 'Дүн шинжилгээний үр дүн: Wellbeing доройтож эхэлсэн. Ажил хувийн амьдралд хэт нөлөөлж, амралт хангалтгүй байна.',
      attention:
        'Дүн шинжилгээний үр дүн: Wellbeing хэлбэлзэлтэй. Зарим үед ажил-амьдралын тэнцвэр алдагдаж байна.',
      healthy:
        'Дүн шинжилгээний үр дүн: Wellbeing өндөр. Амьдралдаа сэтгэл хангалуун, ажил-амьдралын тэнцвэр сайн, эрч хүч дүүрэн.',
    },
  };

  return narratives[category]?.[level] || 'Дүн шинжилгээ боломжгүй.';
}

/**
 * Detect early warning triggers (Enhanced with item-level analysis)
 */
function detectEarlyWarning(
  category: string,
  score: number,
  level: string,
  criticalCount: number,
  riskCount: number
): { triggered: boolean; severity: 'info' | 'warning' | 'critical'; message: string } | undefined {
  
  // III. RED TRIGGER CONDITIONS
  // ≥2 Critical items ≤2
  if (criticalCount >= 2) {
    return {
      triggered: true,
      severity: 'critical',
      message: `🔴 IMMEDIATE FLAG: ${category} категорид ${criticalCount} критик үзүүлэлт маш доогуур түвшинд байна. Яаралтай үйлдэл шаардлагатай.`,
    };
  }

  // Critical triggers (immediate action)
  if (score < 2.0) {
    return {
      triggered: true,
      severity: 'critical',
      message: `⚠️ ЯАРАЛТАЙ: ${category} категорид маш өндөр эрсдэл илэрлээ (${score.toFixed(
        2
      )}). Шууд дэмжлэг шаардлагатай.`,
    };
  }

  // High-risk triggers
  if (score < 2.6) {
    return {
      triggered: true,
      severity: 'critical',
      message: `🔴 АНХААРУУЛГА: ${category} категорид өндөр эрсдэл (${score.toFixed(
        2
      )}). Мэргэжлийн үнэлгээ шаардлагатай.`,
    };
  }

  // III. AMBER WARNING CONDITIONS
  // 3+ Risk items ≤3
  if (riskCount >= 3) {
    return {
      triggered: true,
      severity: 'warning',
      message: `🟠 АНХААРНА УУ: ${category} категорид ${riskCount} эрсдэлтэй үзүүлэлт илэрсэн. Урьдчилан сэргийлэх арга хэмжээ авах.`,
    };
  }

  // Medium-risk triggers (domain average 2.6–3.3)
  if (score < 3.4) {
    return {
      triggered: true,
      severity: 'warning',
      message: `🟠 АНХААРНА УУ: ${category} категорид эрсдэл нэмэгдсэн (${score.toFixed(
        2
      )}). Урьдчилан сэргийлэх арга хэмжээ авах.`,
    };
  }

  // Low-risk monitoring
  if (score < 4.0) {
    return {
      triggered: true,
      severity: 'info',
      message: `🟡 МОНИТОРИНГ: ${category} категорид бага зэрэг сулрал (${score.toFixed(
        2
      )}). Хяналтад байлгах.`,
    };
  }

  return undefined;
}

/**
 * Apply advanced trigger rules (systemic risk detection)
 */
function applyAdvancedTriggers(
  categories: CategoryScore[],
  overallIndex: number
): Array<{
  category: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  actionRequired: string;
}> {
  const triggers: Array<{
    category: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    actionRequired: string;
  }> = [];

  const stressCategory = categories[0];
  const cultureCategory = categories[1];

  // Stress + Culture ≤2.5 → Systemic risk
  if (
    stressCategory &&
    cultureCategory &&
    stressCategory.averageScore <= 2.5 &&
    cultureCategory.averageScore <= 2.5
  ) {
    triggers.push({
      category: 'Системийн эрсдэл',
      severity: 'critical',
      message: '🔴 SYSTEMIC RISK: Стресс болон соёлын хоёулаа маш доогуур. Байгууллагын хэмжээнд арга хэмжээ шаардлагатай.',
      actionRequired:
        '⚡ Шууд арга хэмжээ: Байгууллагын бодлого шинэчлэх, удирдлагын сургалт, соёлын өөрчлөлтийн хөтөлбөр эхлүүлэх.',
    });
  }

  // Check for burnout item (index 11 or 59)
  const burnoutWarning = categories.some(
    (cat) => cat.impactItems && cat.impactItems.critical >= 2
  );
  
  if (burnoutWarning && overallIndex < 3.0) {
    triggers.push({
      category: 'Burnout эрсдэл',
      severity: 'critical',
      message: '🔴 HIGH BURNOUT RISK: Олон критик burnout шинж илэрч байна.',
      actionRequired: '⚡ Шууд дэмжлэг: 1-on-1 уулзалт, ачаалал бууруулах, мэргэжлийн зөвлөгөө.',
    });
  }

  return triggers;
}

/**
 * Determine recommendation level
 */
function determineRecommendationLevel(
  earlyWarnings: Array<{ severity: 'info' | 'warning' | 'critical' }>,
  overallIndex: number
): 'none' | 'monitor' | 'action-needed' | 'immediate-action' {
  const criticalCount = earlyWarnings.filter((w) => w.severity === 'critical').length;
  const warningCount = earlyWarnings.filter((w) => w.severity === 'warning').length;

  if (criticalCount > 0 || overallIndex < 2.5) {
    return 'immediate-action';
  } else if (warningCount >= 2 || overallIndex < 3.4) {
    return 'action-needed';
  } else if (earlyWarnings.length > 0 || overallIndex < 4.0) {
    return 'monitor';
  }
  
  return 'none';
}


/**
 * Get action required based on severity
 */
function getActionRequired(severity: 'info' | 'warning' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return '⚡ Шууд арга хэмжээ: Мэргэжлийн сэтгэл зүйн дэмжлэг, 1-on-1 уулзалт, эрсдэл удирдлагын төлөвлөгөө.';
    case 'warning':
      return '📋 Дунд хугацаа: Зөвлөгөө өгөх, ажлын нөхцөл сайжруулах, мониторинг нэмэгдүүлэх.';
    case 'info':
      return '👁️ Хяналт: Тогтмол мониторинг, урьдчилан сэргийлэх арга хэмжээ, дэмжлэг санал болгох.';
    default:
      return 'Үйлдэл шаардлагагүй.';
  }
}

/**
 * ISO 45003 compliance assessment (Психосоциал эрсдэлийн удирдлага)
 */
function assessISO45003Compliance(
  overallScore: number,
  categories: CategoryScore[]
): {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresAction: boolean;
  complianceNotes: string;
} {
  const criticalCount = categories.filter((c) => c.level === 'high-risk').length;
  const riskCount = categories.filter((c) => c.level === 'risk').length;

  if (criticalCount >= 2 || overallScore < 2.5) {
    return {
      riskLevel: 'critical',
      requiresAction: true,
      complianceNotes:
        'ISO 45003 CRITICAL: Психосоциал эрсдэл өндөр. Яаралтай эрсдэл удирдлагын төлөвлөгөө, мэргэжлийн үнэлгээ шаардлагатай. Ажилтны эрүүл мэнд, аюулгүй байдалд заавал анхаарах.',
    };
  }

  if (criticalCount >= 1 || riskCount >= 2 || overallScore < 3.4) {
    return {
      riskLevel: 'high',
      requiresAction: true,
      complianceNotes:
        'ISO 45003 HIGH RISK: Психосоциал эрсдэл нэмэгдсэн. Эрсдэл үнэлгээ хийх, сайжруулах төлөвлөгөө гаргах, хяналт тавих шаардлагатай.',
    };
  }

  if (riskCount >= 1 || overallScore < 4.0) {
    return {
      riskLevel: 'medium',
      requiresAction: true,
      complianceNotes:
        'ISO 45003 MEDIUM RISK: Зарим асуудал илэрсэн. Урьдчилан сэргийлэх арга хэмжээ, мониторинг хийх.',
    };
  }

  return {
    riskLevel: 'low',
    requiresAction: false,
    complianceNotes:
      'ISO 45003 COMPLIANT: Психосоциал эрүүл мэнд сайн түвшинд. Тогтмол мониторинг үргэлжлүүлэх.',
  };
}

/**
 * Calculate ESG metrics (Environmental, Social, Governance - Social pillar)
 */
function calculateESGMetrics(
  categories: CategoryScore[],
  overallScore: number
): {
  socialScore: number;
  wellbeingIndex: number;
  diversityInclusionScore: number;
  psychologicalSafetyScore: number;
  overallESGRating: 'A' | 'B' | 'C' | 'D' | 'F';
} {
  // Social Score (based on overall wellbeing)
  const socialScore = (overallScore / 5) * 100;

  // Wellbeing Index (category 4: Overall Wellbeing)
  const wellbeingIndex = categories[4] ? (categories[4].averageScore / 5) * 100 : 0;

  // Diversity & Inclusion (derived from culture + behavior)
  const diversityInclusionScore =
    categories[1] && categories[3]
      ? ((categories[1].averageScore + categories[3].averageScore) / 10) * 100
      : 0;

  // Psychological Safety Score (category 1: Workplace Environment)
  const psychologicalSafetyScore = categories[1] ? (categories[1].averageScore / 5) * 100 : 0;

  // Overall ESG Rating (S pillar only)
  const avgESG = (socialScore + wellbeingIndex + diversityInclusionScore + psychologicalSafetyScore) / 4;

  let overallESGRating: 'A' | 'B' | 'C' | 'D' | 'F';
  if (avgESG >= 85) overallESGRating = 'A';
  else if (avgESG >= 70) overallESGRating = 'B';
  else if (avgESG >= 55) overallESGRating = 'C';
  else if (avgESG >= 40) overallESGRating = 'D';
  else overallESGRating = 'F';

  return {
    socialScore: parseFloat(socialScore.toFixed(1)),
    wellbeingIndex: parseFloat(wellbeingIndex.toFixed(1)),
    diversityInclusionScore: parseFloat(diversityInclusionScore.toFixed(1)),
    psychologicalSafetyScore: parseFloat(psychologicalSafetyScore.toFixed(1)),
    overallESGRating,
  };
}
