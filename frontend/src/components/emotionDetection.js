// emotionDetection.js
import { pipeline } from '@huggingface/transformers';

let emotionClassifier = null;

const EMOTION_KEYWORDS = {
  joy: ['happy', 'joy', 'excited', 'grateful', 'proud', 'wonderful', 'excellent', 'amazing', 'love', 'success', 'achievement', 'celebrate', 'thrilled'],
  sadness: ['sad', 'unhappy', 'depressed', 'down', 'lonely', 'miserable', 'devastated', 'grief', 'loss', 'disappointed', 'failed', 'upset'],
  anger: ['angry', 'furious', 'rage', 'mad', 'frustrated', 'irritated', 'annoyed', 'hateful', 'disgusted', 'hostile', 'aggressive'],
  fear: ['fear', 'afraid', 'terrified', 'anxious', 'nervous', 'worried', 'scared', 'panic', 'dread', 'phobia', 'threatened'],
  anxiety: ['anxiety', 'anxious', 'stress', 'stressed', 'tension', 'worry', 'uneasy', 'restless', 'overwhelmed', 'nervous', 'pressured'],
  surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected', 'wow', 'wow', 'incredible', 'stunning'],
  neutral: ['okay', 'fine', 'alright', 'normal', 'nothing', 'whatever', 'sure']
};

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'i', 'me', 'my', 
  'you', 'your', 'it', 'this', 'that', 'to', 'in', 'on', 'for', 'with', 'as', 'be', 
  'have', 'has', 'had', 'do', 'does', 'did', 'of', 'at', 'by', 'from', 'about', 'can', 
  'could', 'would', 'should', 'been', 'being', 'will', 'shall', 'may', 'might', 'must',
  'very', 'just', 'only', 'also', 'not', 'no', 'yes', 'what', 'which', 'who', 'when', 'where'
]);

/**
 * Initialize emotion classification model
 */
const initializeModel = async () => {
  if (!emotionClassifier) {
    try {
      console.log('Loading emotion detection model...');
      emotionClassifier = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { quantized: true }
      );
      console.log('Emotion detection model loaded successfully!');
    } catch (error) {
      console.error('Error loading emotion model:', error);
      throw error;
    }
  }
  return emotionClassifier;
};

/**
 * Keyword-based emotion detection (faster fallback)
 */
const detectEmotionsByKeywords = (text) => {
  const lowerText = text.toLowerCase();
  const emotionScores = {};

  // Score each emotion based on keyword matches
  Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > 0) {
      emotionScores[emotion] = matches;
    }
  });

  // Normalize scores
  const total = Object.values(emotionScores).reduce((a, b) => a + b, 0);
  
  if (total === 0) {
    return [{ label: 'neutral', score: 1.0 }];
  }

  return Object.entries(emotionScores)
    .map(([emotion, score]) => ({
      label: emotion,
      score: score / total
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

/**
 * Sentiment to emotion mapping
 */
const mapSentimentToEmotions = (sentimentResult) => {
  const label = sentimentResult.label?.toLowerCase() || '';
  const score = sentimentResult.score || 0;

  if (label.includes('positive')) {
    return [
      { label: 'joy', score: score * 0.7 },
      { label: 'surprise', score: score * 0.3 }
    ];
  } else {
    return [
      { label: 'sadness', score: score * 0.4 },
      { label: 'anxiety', score: score * 0.3 },
      { label: 'anger', score: score * 0.2 },
      { label: 'fear', score: score * 0.1 }
    ];
  }
};

/**
 * Main emotion analysis function - combines multiple methods
 */
export const analyzeEmotions = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      return [{ label: 'neutral', score: 1.0 }];
    }

    // Method 1: Keyword-based (fast, always available)
    const keywordEmotions = detectEmotionsByKeywords(text);
    
    // Method 2: Try model-based sentiment analysis
    let modelEmotions = [];
    try {
      const classifier = await initializeModel();
      const chunks = splitTextIntoChunks(text, 400);
      
      for (const chunk of chunks) {
        const result = await classifier(chunk, { topk: 1 });
        if (result && result[0]) {
          const mapped = mapSentimentToEmotions(result[0]);
          modelEmotions.push(...mapped);
        }
      }
    } catch (modelError) {
      console.warn('Model inference failed, using keywords only:', modelError);
    }

    // Combine results: keyword detection is more reliable for specific emotions
    const combined = [...keywordEmotions];
    
    // Normalize final scores
    const total = combined.reduce((sum, e) => sum + e.score, 0);
    const normalized = combined
      .map(e => ({
        label: e.label,
        score: total > 0 ? e.score / total : 0
      }))
      .filter(e => e.score > 0.05)
      .sort((a, b) => b.score - a.score);

    return normalized.length > 0 ? normalized : [{ label: 'neutral', score: 1.0 }];
  } catch (error) {
    console.error('Error analyzing emotions:', error);
    return [{ label: 'neutral', score: 0.5 }];
  }
};

/**
 * Split text into chunks
 */
const splitTextIntoChunks = (text, maxWords = 400) => {
  const words = text.split(/\s+/);
  const chunks = [];
  
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  
  return chunks.length > 0 ? chunks : [text];
};

/**
 * Batch analyze multiple texts
 */
export const batchAnalyzeEmotions = async (textArray) => {
  const results = [];
  for (const text of textArray) {
    const emotions = await analyzeEmotions(text);
    results.push(emotions);
  }
  return results;
};

/**
 * Get dominant emotion from analysis
 */
export const getDominantEmotion = (emotions) => {
  if (!emotions || emotions.length === 0) {
    return { label: 'neutral', score: 0 };
  }
  return emotions[0];
};

/**
 * Extract and score words from text
 */
export const extractEmotionalWords = (text) => {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/);

  const emotionalWords = [];
  
  Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
    keywords.forEach(keyword => {
      const matches = words.filter(w => w === keyword);
      matches.forEach(() => {
        emotionalWords.push({ word: keyword, emotion });
      });
    });
  });

  return emotionalWords;
};

/**
 * Generate emotion summary
 */
export const generateEmotionSummary = (emotions) => {
  if (!emotions || emotions.length === 0) {
    return 'Neutral';
  }

  const dominant = emotions[0];
  const percentage = Math.round(dominant.score * 100);
  
  const summaries = {
    joy: `Feeling joyful (${percentage}%)`,
    sadness: `Feeling sad (${percentage}%)`,
    anger: `Feeling angry (${percentage}%)`,
    fear: `Feeling fearful (${percentage}%)`,
    anxiety: `Feeling anxious (${percentage}%)`,
    surprise: `Feeling surprised (${percentage}%)`,
    neutral: `Feeling neutral (${percentage}%)`
  };

  return summaries[dominant.label] || `Feeling ${dominant.label}`;
};

export const preloadModel = initializeModel;

export default {
  analyzeEmotions,
  batchAnalyzeEmotions,
  getDominantEmotion,
  extractEmotionalWords,
  generateEmotionSummary,
  preloadModel
};