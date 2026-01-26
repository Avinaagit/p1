import Sentiment from 'sentiment';

const sentiment = new Sentiment();

/**
 * Analyze sentiment of text using AFINN wordlist
 * Returns a score between -1 (negative) and 1 (positive)
 */
export function analyzeSentimentRealtime(text: string) {
  try {
    const result = sentiment.analyze(text);

    // Normalize score to -1 to 1 range
    // AFINN returns comparative scores; normalize to standard range
    const normalizedScore = Math.max(-1, Math.min(1, result.comparative));

    return {
      score: normalizedScore,
      label: getLabel(normalizedScore),
      confidence: Math.abs(normalizedScore),
      rawScore: result.score,
      comparative: result.comparative,
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return {
      score: 0,
      label: 'neutral',
      confidence: 0,
      rawScore: 0,
      comparative: 0,
    };
  }
}

/**
 * Get sentiment label from score
 */
function getLabel(score: number): 'positive' | 'neutral' | 'negative' {
  if (score > 0.1) return 'positive';
  if (score < -0.1) return 'negative';
  return 'neutral';
}

/**
 * Extract basic keywords/topics from text
 * This is a simple implementation; can be enhanced with NLP library
 */
export function extractKeywords(text: string, limit: number = 5): string[] {
  // Common words to filter out
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'is',
    'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
  ]);

  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2 && !stopwords.has(word));

  // Count word frequency
  const frequency: Record<string, number> = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and return top N
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Calculate emotion analysis (simple rule-based)
 * Returns estimated emotion scores
 */
export function analyzeEmotions(text: string) {
  const lowerText = text.toLowerCase();

  const emotions = {
    joy: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    trust: 0,
    disgust: 0,
  };

  // Simple keyword-based emotion detection
  const emotionKeywords = {
    joy: ['happy', 'glad', 'great', 'excellent', 'wonderful', 'love', 'amazing', 'awesome'],
    sadness: ['sad', 'unhappy', 'disappointed', 'terrible', 'bad', 'awful', 'worse'],
    anger: ['angry', 'furious', 'frustrated', 'annoyed', 'irritated', 'mad'],
    fear: ['worried', 'anxious', 'scared', 'afraid', 'concerned', 'nervous'],
    trust: ['trust', 'confident', 'reliable', 'good', 'positive', 'support'],
    disgust: ['disgusting', 'gross', 'yuck', 'horrible', 'pathetic'],
  };

  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    keywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        emotions[emotion as keyof typeof emotions] += 1;
      }
    });
  });

  // Normalize to 0-1 range
  const maxScore = Math.max(...Object.values(emotions), 1);
  Object.keys(emotions).forEach((emotion) => {
    emotions[emotion as keyof typeof emotions] /= maxScore;
  });

  return emotions;
}

/**
 * Batch process multiple responses for sentiment analysis
 * Used for batch NLP jobs
 */
export async function batchAnalyzeSentiment(texts: string[]) {
  return texts.map((text) => ({
    text,
    sentiment: analyzeSentimentRealtime(text),
    keywords: extractKeywords(text),
    emotions: analyzeEmotions(text),
  }));
}

/**
 * Calculate aggregate sentiment statistics
 */
export function calculateAggregateStats(sentiments: number[]) {
  if (sentiments.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
    };
  }

  const average = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  const positiveCount = sentiments.filter((s) => s > 0.1).length;
  const negativeCount = sentiments.filter((s) => s < -0.1).length;
  const neutralCount = sentiments.length - positiveCount - negativeCount;

  // Calculate standard deviation
  const variance =
    sentiments.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / sentiments.length;
  const stdDev = Math.sqrt(variance);

  return {
    average,
    min: Math.min(...sentiments),
    max: Math.max(...sentiments),
    stdDev,
    positive: positiveCount,
    neutral: neutralCount,
    negative: negativeCount,
  };
}
