// sessionManager.js
// Utility functions for managing therapy sessions in localStorage

const STORAGE_KEY = 'therapy_sessions';
const ARCHIVE_KEY = 'therapy_sessions_archive';

/**
 * Get all therapy sessions from localStorage
 * @returns {Array} Array of session objects
 */
export const getAllSessions = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading sessions:', error);
    return [];
  }
};

/**
 * Save a new therapy session
 * @param {Array} messages - Array of message objects
 * @param {Object} metadata - Additional session metadata
 * @returns {Object} The saved session object
 */
export const saveSession = (messages, metadata = {}) => {
  try {
    const sessions = getAllSessions();
    
    const newSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      messages: messages,
      duration: metadata.duration || calculateSessionDuration(messages),
      emotions: metadata.emotions || [],
      tags: metadata.tags || [],
      notes: metadata.notes || '',
      analyzed: true,
      ...metadata
    };
    
    sessions.push(newSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    
    return newSession;
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

/**
 * Update an existing session
 * @param {string} sessionId - ID of session to update
 * @param {Object} updates - Object with fields to update
 * @returns {Object} Updated session
 */
export const updateSession = (sessionId, updates) => {
  try {
    const sessions = getAllSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    
    if (index === -1) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    sessions[index] = {
      ...sessions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return sessions[index];
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

/**
 * Delete a session by ID
 * @param {string} sessionId - ID of session to delete
 * @returns {boolean} Success status
 */
export const deleteSession = (sessionId) => {
  try {
    const sessions = getAllSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
};

/**
 * Get a single session by ID
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Session object or null
 */
export const getSessionById = (sessionId) => {
  const sessions = getAllSessions();
  return sessions.find(s => s.id === sessionId) || null;
};

/**
 * Get sessions within a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered sessions
 */
export const getSessionsByDateRange = (startDate, endDate) => {
  const sessions = getAllSessions();
  return sessions.filter(session => {
    const sessionDate = new Date(session.date);
    return sessionDate >= startDate && sessionDate <= endDate;
  });
};

/**
 * Get sessions by emotion
 * @param {string} emotion - Emotion label to filter by
 * @returns {Array} Sessions containing the emotion
 */
export const getSessionsByEmotion = (emotion) => {
  const sessions = getAllSessions();
  return sessions.filter(session => 
    session.emotions && session.emotions.some(e => e.label === emotion)
  );
};

/**
 * Get sessions by minimum duration
 * @param {number} minSeconds - Minimum duration in seconds
 * @returns {Array} Filtered sessions
 */
export const getSessionsByDuration = (minSeconds) => {
  const sessions = getAllSessions();
  return sessions.filter(session => (session.duration || 0) >= minSeconds);
};

/**
 * Calculate session duration from messages
 * @param {Array} messages - Array of messages
 * @returns {number} Duration in seconds
 */
const calculateSessionDuration = (messages) => {
  if (!messages || messages.length === 0) return 0;
  return messages.length * 30; // ~30 seconds per message
};

/**
 * Export all sessions as JSON
 * @returns {string} JSON string of all sessions
 */
export const exportSessionsAsJSON = () => {
  const sessions = getAllSessions();
  return JSON.stringify(sessions, null, 2);
};

/**
 * Import sessions from JSON
 * @param {string} jsonString - JSON string of sessions
 * @param {boolean} merge - Whether to merge with existing or replace
 * @returns {boolean} Success status
 */
export const importSessionsFromJSON = (jsonString, merge = true) => {
  try {
    const importedSessions = JSON.parse(jsonString);
    
    if (!Array.isArray(importedSessions)) {
      throw new Error('Invalid format: expected array of sessions');
    }
    
    if (merge) {
      const existing = getAllSessions();
      const merged = [...existing, ...importedSessions];
      const unique = Array.from(
        new Map(merged.map(s => [s.id, s])).values()
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(importedSessions));
    }
    
    return true;
  } catch (error) {
    console.error('Error importing sessions:', error);
    return false;
  }
};

/**
 * Clear all sessions (use with caution!)
 * @returns {boolean} Success status
 */
export const clearAllSessions = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return false;
  }
};

/**
 * Get session statistics
 * @returns {Object} Statistics object
 */
export const getSessionStats = () => {
  const sessions = getAllSessions();
  
  if (sessions.length === 0) {
    return {
      total: 0,
      totalDuration: 0,
      avgDuration: 0,
      firstSession: null,
      lastSession: null,
      totalMessages: 0,
      avgMessagesPerSession: 0
    };
  }
  
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalMessages = sessions.reduce((sum, s) => sum + (s.messages?.length || 0), 0);
  
  const dates = sessions.map(s => new Date(s.date)).sort((a, b) => a - b);
  
  return {
    total: sessions.length,
    totalDuration,
    avgDuration: Math.round(totalDuration / sessions.length),
    firstSession: dates[0],
    lastSession: dates[dates.length - 1],
    totalMessages,
    avgMessagesPerSession: Math.round(totalMessages / sessions.length)
  };
};

/**
 * Search sessions by keyword in messages
 * @param {string} keyword - Keyword to search for
 * @returns {Array} Matching sessions
 */
export const searchSessions = (keyword) => {
  if (!keyword || keyword.trim() === '') {
    return getAllSessions();
  }
  
  const sessions = getAllSessions();
  const lowerKeyword = keyword.toLowerCase();
  
  return sessions.filter(session => 
    session.messages.some(msg => 
      msg.content.toLowerCase().includes(lowerKeyword)
    )
  );
};

/**
 * Get recent sessions
 * @param {number} limit - Number of recent sessions to return
 * @returns {Array} Recent sessions
 */
export const getRecentSessions = (limit = 10) => {
  const sessions = getAllSessions();
  return sessions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
};

/**
 * Archive old sessions (older than specified days)
 * @param {number} days - Number of days threshold
 * @returns {Object} Result with archived and remaining counts
 */
export const archiveOldSessions = (days = 90) => {
  try {
    const sessions = getAllSessions();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);
    
    const active = sessions.filter(s => new Date(s.date) >= threshold);
    const archived = sessions.filter(s => new Date(s.date) < threshold);
    
    if (archived.length > 0) {
      const existingArchive = JSON.parse(
        localStorage.getItem(ARCHIVE_KEY) || '[]'
      );
      localStorage.setItem(
        ARCHIVE_KEY,
        JSON.stringify([...existingArchive, ...archived])
      );
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    
    return {
      archived: archived.length,
      remaining: active.length,
      success: true
    };
  } catch (error) {
    console.error('Error archiving sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get storage usage information
 * @returns {Object} Storage usage stats
 */
export const getStorageUsage = () => {
  try {
    const sessions = localStorage.getItem(STORAGE_KEY) || '';
    const archive = localStorage.getItem(ARCHIVE_KEY) || '';
    
    const sessionSize = new Blob([sessions]).size;
    const archiveSize = new Blob([archive]).size;
    const totalSize = sessionSize + archiveSize;
    
    return {
      sessions: (sessionSize / 1024).toFixed(2) + ' KB',
      archive: (archiveSize / 1024).toFixed(2) + ' KB',
      total: (totalSize / 1024).toFixed(2) + ' KB'
    };
  } catch (error) {
    console.error('Error calculating storage:', error);
    return { sessions: '0 KB', archive: '0 KB', total: '0 KB' };
  }
};

/**
 * Get emotion distribution across all sessions
 * @returns {Object} Emotion distribution data
 */
export const getEmotionDistribution = () => {
  const sessions = getAllSessions();
  const emotionCounts = {};
  
  sessions.forEach(session => {
    if (session.emotions && Array.isArray(session.emotions)) {
      session.emotions.forEach(emotion => {
        const label = emotion.label;
        emotionCounts[label] = (emotionCounts[label] || 0) + 1;
      });
    }
  });
  
  return emotionCounts;
};

/**
 * Get sentiment trend data
 * @returns {Array} Trend data points sorted by date
 */
export const getSentimentTrendData = () => {
  const sessions = getAllSessions()
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return sessions.map(session => {
    const positiveCount = session.emotions?.filter(e => 
      ['joy', 'surprise', 'neutral'].includes(e.label)
    ).length || 0;
    
    const negativeCount = session.emotions?.filter(e => 
      ['sadness', 'anger', 'fear', 'anxiety'].includes(e.label)
    ).length || 0;
    
    return {
      id: session.id,
      date: new Date(session.date),
      dateString: new Date(session.date).toLocaleDateString('en-US', 
        { month: 'short', day: 'numeric' }
      ),
      positive: positiveCount,
      negative: negativeCount,
      neutral: session.emotions?.filter(e => e.label === 'neutral').length || 0,
      sentiment: positiveCount - negativeCount,
      emotionCount: session.emotions?.length || 0
    };
  });
};

/**
 * Get all unique words from user messages
 * @returns {Array} Array of word objects with frequency
 */
export const getWordFrequency = () => {
  const sessions = getAllSessions();
  const wordMap = {};
  
  sessions.forEach(session => {
    session.messages?.forEach(msg => {
      if (msg.role === 'user' && msg.content) {
        const words = msg.content
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/);
        
        words.forEach(word => {
          if (word.length > 3) {
            wordMap[word] = (wordMap[word] || 0) + 1;
          }
        });
      }
    });
  });
  
  return Object.entries(wordMap)
    .map(([word, freq]) => ({ word, frequency: freq }))
    .sort((a, b) => b.frequency - a.frequency);
};

export default {
  getAllSessions,
  saveSession,
  updateSession,
  deleteSession,
  getSessionById,
  getSessionsByDateRange,
  getSessionsByEmotion,
  getSessionsByDuration,
  exportSessionsAsJSON,
  importSessionsFromJSON,
  clearAllSessions,
  getSessionStats,
  searchSessions,
  getRecentSessions,
  archiveOldSessions,
  getStorageUsage,
  getEmotionDistribution,
  getSentimentTrendData,
  getWordFrequency
};