import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, ArrowLeft, Home, Clock, BarChart3, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Insights.css';

const Insights = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const EMOTION_COLORS = {
    joy: '#4CAF50',
    sadness: '#2196F3',
    anger: '#F44336',
    fear: '#9C27B0',
    surprise: '#FF9800',
    neutral: '#607D8B',
    anxiety: '#E91E63'
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    try {
      setLoading(true);
      const saved = localStorage.getItem('therapy_sessions');
      const parsed = saved ? JSON.parse(saved) : [];
      
      const analyzedSessions = parsed.map(session => {
        if (!session.emotions || session.emotions.length === 0) {
          session.emotions = detectEmotionsFromMessages(session.messages || []);
        }
        return session;
      });

      setSessions(analyzedSessions);
      setFilteredSessions(analyzedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectEmotionsFromMessages = (messages) => {
    const emotionKeywords = {
      joy: ['happy', 'great', 'good', 'excellent', 'wonderful', 'amazing', 'love', 'awesome', 'fantastic', 'perfect'],
      sadness: ['sad', 'depressed', 'down', 'lonely', 'miserable', 'disappointed', 'upset', 'blue'],
      anxiety: ['anxious', 'worried', 'stressed', 'nervous', 'overwhelmed', 'panic', 'tense'],
      anger: ['angry', 'furious', 'mad', 'frustrated', 'irritated', 'rage', 'hostile'],
      fear: ['afraid', 'scared', 'terrified', 'fearful', 'dread'],
      surprise: ['surprised', 'shocked', 'amazed', 'wow', 'unexpected'],
      neutral: ['okay', 'fine', 'alright', 'normal']
    };

    const emotionScores = {};
    const userMessages = messages.filter(m => m.type === 'user').map(m => m.text.toLowerCase()).join(' ');

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      const matches = keywords.filter(keyword => userMessages.includes(keyword)).length;
      if (matches > 0) {
        emotionScores[emotion] = matches;
      }
    });

    const total = Object.values(emotionScores).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
      return [{ label: 'neutral', score: 1.0 }];
    }

    return Object.entries(emotionScores)
      .map(([emotion, score]) => ({
        label: emotion,
        score: score / total
      }))
      .sort((a, b) => b.score - a.score);
  };

  const emotionDistribution = filteredSessions.reduce((acc, session) => {
    session.emotions?.forEach(emotion => {
      const existing = acc.find(e => e.label === emotion.label);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({
          name: emotion.label.charAt(0).toUpperCase() + emotion.label.slice(1),
          label: emotion.label,
          count: 1,
          value: 1
        });
      }
    });
    return acc;
  }, []);

  const totalEmotions = emotionDistribution.reduce((sum, e) => sum + e.count, 0);
  const emotionDistributionWithPercentage = emotionDistribution.map(e => ({
    ...e,
    value: e.count,
    percentage: ((e.count / totalEmotions) * 100).toFixed(1)
  }));

  const sentimentTrends = filteredSessions
    .sort((a, b) => new Date(a.endTime || a.timestamp) - new Date(b.endTime || b.timestamp))
    .map((session, idx) => {
      const positiveEmotions = session.emotions?.filter(e => 
        ['joy', 'surprise'].includes(e.label)
      ).length || 0;
      
      const negativeEmotions = session.emotions?.filter(e => 
        ['sadness', 'anger', 'fear', 'anxiety'].includes(e.label)
      ).length || 0;

      return {
        date: `Session ${idx + 1}`,
        sentiment: positiveEmotions - negativeEmotions,
        positive: positiveEmotions,
        negative: negativeEmotions
      };
    });

  const topEmotions = [...emotionDistribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const calculateWordCloud = () => {
    const wordMap = {};
    filteredSessions.forEach(session => {
      const userMessages = session.messages?.filter(m => m.type === 'user') || [];
      userMessages.forEach(msg => {
        const words = msg.text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
        words.forEach(word => {
          if (word.length > 4) {
            wordMap[word] = (wordMap[word] || 0) + 1;
          }
        });
      });
    });

    return Object.entries(wordMap)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30);
  };

  const calculateMilestones = () => {
    const milestones = [];

    if (sessions.length > 0) {
      milestones.push({
        icon: '💬',
        title: 'Total Sessions',
        value: sessions.length,
        description: 'Therapy sessions completed'
      });
    }

    if (emotionDistribution.length > 0) {
      const topEmotion = emotionDistribution.reduce((a, b) => a.count > b.count ? a : b);
      milestones.push({
        icon: '💙',
        title: 'Dominant Emotion',
        value: topEmotion.name,
        description: 'Most frequently experienced'
      });
    }

    const totalMessages = sessions.reduce((sum, s) => sum + (s.messages?.length || 0), 0);
    if (totalMessages > 0) {
      milestones.push({
        icon: '📝',
        title: 'Total Messages',
        value: totalMessages,
        description: 'Messages exchanged'
      });
    }

    const joyEmotions = emotionDistribution.find(e => e.label === 'joy');
    const joyCount = joyEmotions?.count || 0;
    milestones.push({
      icon: '✨',
      title: 'Joy Moments',
      value: joyCount,
      description: 'Times you felt joyful'
    });

    return milestones;
  };

  const generateRecommendations = () => {
    const recommendations = [];

    if (sessions.length === 0) {
      return ['Start your first therapy session to generate insights'];
    }

    const topEmotion = emotionDistribution[0];
    
    if (topEmotion?.label === 'sadness') {
      recommendations.push('Consider practicing gratitude journaling to shift focus toward positive experiences');
      recommendations.push('Try the 5-4-3-2-1 grounding technique when feeling overwhelmed');
    }

    if (topEmotion?.label === 'anxiety') {
      recommendations.push('Practice deep breathing exercises like 4-7-8 breathing daily');
      recommendations.push('Try progressive muscle relaxation before bedtime');
    }

    if (topEmotion?.label === 'joy') {
      recommendations.push('Celebrate your progress and acknowledge positive moments daily');
      recommendations.push('Share your happiness with others to amplify the positive effect');
    }

    const avgMessages = Math.round(sessions.reduce((sum, s) => sum + (s.messages?.length || 0), 0) / sessions.length);
    if (avgMessages < 10) {
      recommendations.push('Try to have longer conversations to explore your feelings more deeply');
    }

    recommendations.push('Continue regular sessions for sustained emotional growth');

    return recommendations.slice(0, 4);
  };

  const wordCloud = calculateWordCloud();
  const milestones = calculateMilestones();
  const recommendations = generateRecommendations();

  if (loading) {
    return (
      <div className="insights-wrapper">
        <div className="sidebar">
          <div className="logo-circle">NEO</div>
        </div>
        <div className="insights-page">
          <div className="loading-state">Loading insights...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-wrapper">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <div className="logo-circle">NEO</div>
        </div>
        <div className="sidebar-icons">
          <button className="icon-btn" onClick={() => navigate('/')} title="Home">
            <Home size={20} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/history')} title="History">
            <Clock size={20} />
          </button>
          <button className="icon-btn active" title="Insights">
            <BarChart3 size={20} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/feedback')} title="Feedback">
            <MessageCircle size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="insights-page">
        <div className="insights-container">
          {/* Header */}
          <div className="insights-header">
            <button className="back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={18} /> Back
            </button>
            <h1 align ="center">Your Insights</h1>
          </div>

          {/* Status */}
          <div className="status-row">
            <div className="status-badge"></div>
            <div className="status-badge"></div>
          </div>

          {/* Summary Cards */}
          <div className="summary-section">
            <div className="summary-item">
              <div className="summary-number">{sessions.length}</div>
              <div className="summary-label">Sessions</div>
            </div>
            <div className="summary-item">
              <div className="summary-number">{emotionDistribution.length}</div>
              <div className="summary-label">Emotions Tracked</div>
            </div>
            <div className="summary-item">
              <div className="summary-number">{sessions.reduce((sum, s) => sum + (s.messages?.length || 0), 0)}</div>
              <div className="summary-label">Total Messages</div>
            </div>
          </div>

          {/* Emotion Distribution */}
          {emotionDistributionWithPercentage.length > 0 && (
            <div className="card large">
              <h2>Emotion Distribution</h2>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={emotionDistributionWithPercentage}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {emotionDistributionWithPercentage.map((entry, idx) => (
                        <Cell key={idx} fill={EMOTION_COLORS[entry.label]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="legend">
                  {emotionDistributionWithPercentage.map((item, idx) => (
                    <div key={idx} className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: EMOTION_COLORS[item.label] }}></span>
                      <span>{item.name}: {item.percentage}% ({item.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sentiment Trends */}
          {sentimentTrends.length > 0 && (
            <div className="card large">
              <h2>Sentiment Trends Over Time</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={sentimentTrends} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="sentiment" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} name="Sentiment" />
                  <Line type="monotone" dataKey="positive" stroke="#4CAF50" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Positive" />
                  <Line type="monotone" dataKey="negative" stroke="#F44336" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Negative" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Emotions */}
          {topEmotions.length > 0 && (
            <div className="card large">
              <h2>Top Emotions Breakdown</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topEmotions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#3B82F6">
                    {topEmotions.map((entry, idx) => (
                      <Cell key={idx} fill={EMOTION_COLORS[entry.label]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="card" align="center">
              <h2>Your Milestones</h2>
              <div className="milestones-grid">
                {milestones.map((milestone, idx) => (
                  <div key={idx} className="milestone-card">
                    <div className="milestone-icon">{milestone.icon}</div>
                    <div className="milestone-content">
                      <div className="milestone-title">{milestone.title}</div>
                      <div className="milestone-value">{milestone.value}</div>
                      <div className="milestone-desc">{milestone.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Word Cloud */}
          {wordCloud.length > 0 && (
            <div className="card" align="center">
              <h2>Frequently Mentioned Words</h2>
              <div className="word-cloud">
                {wordCloud.slice(0, 25).map((item, idx) => {
                  const maxValue = Math.max(...wordCloud.map(w => w.value));
                  const size = 12 + (item.value / maxValue) * 28;
                  const colors = ['#3B82F6', '#2196F3', '#4CAF50', '#F44336', '#FF9800', '#9C27B0'];
                  return (
                    <span key={idx} className="word-tag" style={{ fontSize: `${size}px`, color: colors[idx % colors.length] }}>
                      {item.text}
                    </span>
                  );
                })}
              </div>
              <div className="word-list">
                <h3>Top Words</h3>
                {wordCloud.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="word-item">
                    <span className="word-rank">{idx + 1}.</span>
                    <span className="word-text">{item.text}</span>
                    <span className="word-count">{item.value}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="card" align ="center">
            <h2>Personalized Recommendations</h2>
            <div className="recommendations">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="rec-item">
                  <span className="rec-num">{idx + 1}</span>
                  <span className="rec-text">{rec}</span>
                  
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <div className="export-section">
            <button className="export-btn">
              <Download size={18} /> Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;