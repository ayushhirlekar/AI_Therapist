// insightsDataUtils.js
// Utility functions for processing insights data

/**
 * Calculate emotion distribution from sessions
 */
export const calculateEmotionDistribution = (sessions) => {
  const emotionCounts = {};
  let total = 0;

  sessions.forEach(session => {
    if (session.emotions && Array.isArray(session.emotions)) {
      session.emotions.forEach(emotion => {
        emotionCounts[emotion.label] = (emotionCounts[emotion.label] || 0) + 1;
        total++;
      });
    }
  });

  if (total === 0) {
    return [];
  }

  return Object.entries(emotionCounts).map(([emotion, count]) => ({
    name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    label: emotion,
    value: count,
    percentage: ((count / total) * 100).toFixed(1),
    count
  }));
};

/**
 * Calculate sentiment trends over time
 */
export const calculateSentimentTrends = (sessions) => {
  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));

  return sorted.map(session => {
    const positiveEmotions = session.emotions?.filter(e =>
      ['joy', 'surprise'].includes(e.label)
    ).length || 0;

    const negativeEmotions = session.emotions?.filter(e =>
      ['sadness', 'anger', 'fear', 'anxiety'].includes(e.label)
    ).length || 0;

    const neutralEmotions = session.emotions?.filter(e => e.label === 'neutral').length || 0;

    return {
      date: new Date(session.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      fullDate: new Date(session.date),
      sentiment: positiveEmotions - negativeEmotions,
      positive: positiveEmotions,
      negative: negativeEmotions,
      neutral: neutralEmotions,
      total: positiveEmotions + negativeEmotions + neutralEmotions
    };
  });
};

/**
 * Get top emotions breakdown
 */
export const getTopEmotionsBreakdown = (sessions, limit = 5) => {
  const emotionCounts = {};

  sessions.forEach(session => {
    if (session.emotions && Array.isArray(session.emotions)) {
      session.emotions.forEach(emotion => {
        emotionCounts[emotion.label] = (emotionCounts[emotion.label] || 0) + 1;
      });
    }
  });

  const EMOTION_COLORS = {
    joy: '#4CAF50',
    sadness: '#2196F3',
    anger: '#F44336',
    fear: '#9C27B0',
    surprise: '#FF9800',
    neutral: '#607D8B',
    anxiety: '#E91E63'
  };

  return Object.entries(emotionCounts)
    .map(([emotion, count]) => ({
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      label: emotion,
      count,
      color: EMOTION_COLORS[emotion] || '#999'
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Calculate session milestones
 */
export const calculateSessionMilestones = (sessions) => {
  const milestones = [];
  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sorted.length === 0) {
    return [];
  }

  // Longest positive streak
  let currentStreak = 0;
  let maxStreak = 0;

  sorted.forEach(session => {
    const hasPositive = session.emotions?.some(e =>
      ['joy', 'surprise'].includes(e.label)
    );
    
    if (hasPositive) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  milestones.push({
    icon: '⭐',
    title: 'Positive Streak',
    value: `${maxStreak} sessions`,
    color: '#FFD700',
    description: 'Longest consecutive sessions with positive emotions'
  });

  // Most improved emotion
  if (sorted.length > 6) {
    const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
    const secondHalf = sorted.slice(Math.ceil(sorted.length / 2));

    const firstJoyCount = firstHalf.filter(s =>
      s.emotions?.some(e => e.label === 'joy')
    ).length;

    const secondJoyCount = secondHalf.filter(s =>
      s.emotions?.some(e => e.label === 'joy')
    ).length;

    const improvement = Math.round(
      ((secondJoyCount - firstJoyCount) / firstHalf.length) * 100
    );

    milestones.push({
      icon: '📈',
      title: 'Joy Improvement',
      value: `${improvement > 0 ? '+' : ''}${improvement}%`,
      color: '#4CAF50',
      description: 'Change in joy frequency from early to recent sessions'
    });
  }

  // Most common emotion
  const emotionCounts = {};
  sorted.forEach(session => {
    session.emotions?.forEach(e => {
      emotionCounts[e.label] = (emotionCounts[e.label] || 0) + 1;
    });
  });

  const mostCommon = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
  if (mostCommon) {
    milestones.push({
      icon: '💙',
      title: 'Dominant Emotion',
      value: mostCommon[0].charAt(0).toUpperCase() + mostCommon[0].slice(1),
      color: '#2196F3',
      description: `Most frequently experienced emotion`
    });
  }

  // Total sessions
  milestones.push({
    icon: '💬',
    title: 'Total Sessions',
    value: `${sorted.length} sessions`,
    color: '#2196F3',
    description: 'Number of therapy sessions completed'
  });

  return milestones;
};

/**
 * Generate word cloud data from sessions
 */
export const generateWordCloudData = (sessions, limit = 50) => {
  const wordFreq = {};

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'i', 'me', 'my',
    'you', 'your', 'it', 'this', 'that', 'to', 'in', 'on', 'for', 'with', 'as', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'of', 'at', 'by', 'from', 'about', 'can',
    'could', 'would', 'should', 'been', 'being', 'will', 'shall', 'may', 'might', 'must',
    'very', 'just', 'only', 'also', 'not', 'no', 'yes', 'what', 'which', 'who', 'when',
    'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'than', 'too', 'up', 'out', 'if', 'into', 'through', 'during', 'before'
  ]);

  sessions.forEach(session => {
    session.messages?.forEach(msg => {
      if (msg.role === 'user' && msg.content) {
        const words = msg.content
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 3 && !stopWords.has(word));

        words.forEach(word => {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
      }
    });
  });

  return Object.entries(wordFreq)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

/**
 * Generate personalized recommendations
 */
export const generateRecommendations = (sessions, emotionDistribution) => {
  const recommendations = [];

  if (sessions.length === 0) {
    return [
      'Start your therapy journey by having your first session',
      'Regular sessions help build positive habits and emotional awareness',
      'Be patient with yourself—healing takes time'
    ];
  }

  // Find dominant emotion
  const dominantEmotion = emotionDistribution.length > 0
    ? emotionDistribution[0]
    : null;

  if (dominantEmotion?.label === 'sadness' && dominantEmotion.count > 5) {
    recommendations.push('Consider practicing gratitude journaling to shift focus toward positive experiences');
    recommendations.push('Explore grounding techniques like the 5-4-3-2-1 sensory method when feeling down');
    recommendations.push('Reach out to trusted friends or family for support');
  }

  if (dominantEmotion?.label === 'anxiety' && dominantEmotion.count > 5) {
    recommendations.push('Focus on mindfulness exercises and deep breathing techniques like 4-7-8 breathing');
    recommendations.push('Try progressive muscle relaxation before stressful situations');
    recommendations.push('Limit caffeine intake and maintain consistent sleep schedules');
  }

  if (dominantEmotion?.label === 'anger' && dominantEmotion.count > 5) {
    recommendations.push('Practice the STOP technique when anger arises: Stop, Take a breath, Observe, Proceed');
    recommendations.push('Channel emotions into physical exercise or creative outlets');
    recommendations.push('Consider journaling to express and process angry feelings');
  }

  if (dominantEmotion?.label === 'joy' && dominantEmotion.count > 5) {
    recommendations.push('Celebrate small victories and acknowledge your progress daily');
    recommendations.push('Share your positive experiences with supportive friends or family');
    recommendations.push('Keep a joy journal to capture moments of happiness');
  }

  // Trend-based recommendations
  const trends = calculateSentimentTrends(sessions);
  if (trends.length >= 3) {
    const recentTrend = trends.slice(-3).reduce((sum, t) => sum + t.sentiment, 0) / 3;
    const olderTrend = trends.slice(0, 3).reduce((sum, t) => sum + t.sentiment, 0) / 3;

    if (recentTrend > olderTrend) {
      recommendations.push('Your mood has been improving recently—keep up the great work!');
    } else if (recentTrend < olderTrend) {
      recommendations.push('You might benefit from additional coping strategies—consider exploring new techniques');
    }
  }

  // Session frequency recommendation
  if (sessions.length > 0) {
    const firstDate = new Date(sessions[0].date);
    const lastDate = new Date(sessions[sessions.length - 1].date);
    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    const avgSessionsPerWeek = (sessions.length / daysDiff) * 7;

    if (avgSessionsPerWeek < 2) {
      recommendations.push('Try to schedule therapy sessions at least 2-3 times per week for better continuity');
    }
  }

  // Emotional balance
  const totalEmotions = emotionDistribution.reduce((sum, e) => sum + e.count, 0);
  const positiveEmotions = emotionDistribution
    .filter(e => ['joy', 'surprise'].includes(e.label))
    .reduce((sum, e) => sum + e.count, 0);

  if (totalEmotions > 0 && positiveEmotions / totalEmotions < 0.3) {
    recommendations.push('Focus on activities that bring you joy and peace');
    recommendations.push('Practice self-compassion and remember that healing is not linear');
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Continue your regular therapy sessions',
      'Practice self-compassion and patience with your journey',
      'Maintain healthy sleep and exercise routines',
      'Stay connected with your support network'
    );
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
};

/**
 * Calculate average session insights
 */
export const calculateAverageSessionMetrics = (sessions) => {
  if (sessions.length === 0) {
    return {
      avgEmotions: 0,
      avgDuration: 0,
      avgMessages: 0
    };
  }

  const totalEmotions = sessions.reduce((sum, s) => sum + (s.emotions?.length || 0), 0);
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalMessages = sessions.reduce((sum, s) => sum + (s.messages?.length || 0), 0);

  return {
    avgEmotions: Math.round(totalEmotions / sessions.length),
    avgDuration: Math.round(totalDuration / sessions.length),
    avgMessages: Math.round(totalMessages / sessions.length)
  };
};

/**
 * Get emotion intensity chart data
 */
export const getEmotionIntensityData = (sessions) => {
  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));

  return sorted.map(session => {
    const emotionScores = {};

    session.emotions?.forEach(emotion => {
      emotionScores[emotion.label] = (emotionScores[emotion.label] || 0) + emotion.score;
    });

    return {
      date: new Date(session.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      joy: emotionScores['joy'] || 0,
      sadness: emotionScores['sadness'] || 0,
      anxiety: emotionScores['anxiety'] || 0,
      anger: emotionScores['anger'] || 0,
      fear: emotionScores['fear'] || 0,
      surprise: emotionScores['surprise'] || 0,
      neutral: emotionScores['neutral'] || 0
    };
  });
};

/**
 * Filter sessions by multiple criteria
 */
export const filterSessions = (sessions, filters) => {
  let filtered = [...sessions];

  // Date range filter
  if (filters.dateRange?.start && filters.dateRange?.end) {
    filtered = filtered.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= filters.dateRange.start && sessionDate <= filters.dateRange.end;
    });
  }

  // Emotion filter
  if (filters.emotion && filters.emotion !== 'all') {
    filtered = filtered.filter(session =>
      session.emotions?.some(e => e.label === filters.emotion)
    );
  }

  // Duration filter
  if (filters.minDuration) {
    filtered = filtered.filter(session => (session.duration || 0) >= filters.minDuration);
  }

  // Search filter
  if (filters.searchTerm) {
    const lowerSearch = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(session =>
      session.messages?.some(msg =>
        msg.content.toLowerCase().includes(lowerSearch)
      )
    );
  }

  return filtered;
};

/**
 * Get progress summary
 */
export const getProgressSummary = (sessions) => {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      emotionalRange: 0,
      improvementTrend: 'neutral',
      consistencyScore: 0
    };
  }

  const trends = calculateSentimentTrends(sessions);
  const emotionDistribution = calculateEmotionDistribution(sessions);
  
  const totalSessions = sessions.length;
  const emotionalRange = emotionDistribution.length;
  
  // Calculate improvement trend
  let improvementTrend = 'neutral';
  if (trends.length >= 2) {
    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, t) => sum + t.sentiment, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + t.sentiment, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 0.5) {
      improvementTrend = 'improving';
    } else if (secondAvg < firstAvg - 0.5) {
      improvementTrend = 'declining';
    }
  }

  // Calculate consistency score (0-100)
  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  let consistencyScore = 100;
  
  for (let i = 1; i < sorted.length; i++) {
    const date1 = new Date(sorted[i - 1].date);
    const date2 = new Date(sorted[i].date);
    const daysDiff = (date2 - date1) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      consistencyScore -= 5;
    }
  }
  
  consistencyScore = Math.max(0, Math.min(100, consistencyScore));

  return {
    totalSessions,
    emotionalRange,
    improvementTrend,
    consistencyScore
  };
};

export default {
  calculateEmotionDistribution,
  calculateSentimentTrends,
  getTopEmotionsBreakdown,
  calculateSessionMilestones,
  generateWordCloudData,
  generateRecommendations,
  calculateAverageSessionMetrics,
  getEmotionIntensityData,
  filterSessions,
  getProgressSummary
};