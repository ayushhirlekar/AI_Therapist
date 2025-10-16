import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Home, Clock, BarChart2, MessageCircle, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './History.css';

function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const detailPanelRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Sentiment analysis function
  const analyzeSentiment = useCallback((session) => {
    if (!session.messages || session.messages.length === 0) return 'Neutral';

    const userMessages = session.messages
      .filter(m => m.type === 'user')
      .map(m => m.text.toLowerCase())
      .join(' ');

    const positiveWords = ['happy', 'great', 'good', 'excellent', 'wonderful', 'amazing', 'love', 'better', 'awesome', 'perfect'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'depressed', 'angry', 'frustrated', 'worried', 'stressed'];

    const positiveCount = positiveWords.filter(word => userMessages.includes(word)).length;
    const negativeCount = negativeWords.filter(word => userMessages.includes(word)).length;

    if (positiveCount > negativeCount) return 'Positive';
    if (negativeCount > positiveCount) return 'Negative';
    return 'Neutral';
  }, []);

  // Filter sessions function
  const filterSessions = useCallback(() => {
    let filtered = sessions;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(session =>
        session.messages?.some(msg =>
          msg.text.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sentiment filter
    if (selectedFilter !== 'All') {
      filtered = filtered.filter(session => {
        const sentiment = analyzeSentiment(session);
        return sentiment === selectedFilter;
      });
    }

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, selectedFilter, analyzeSentiment]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('therapy_sessions') || '[]');
    // Sort sessions by date (newest first)
    const sortedSessions = savedSessions.sort((a, b) => {
      const dateA = new Date(a.endTime || 0);
      const dateB = new Date(b.endTime || 0);
      return dateB - dateA;
    });
    setSessions(sortedSessions);
  }, []);

  // Scroll to bottom when detail view opens or messages change
  useEffect(() => {
    if (isDetailOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isDetailOpen, selectedSession]);

  // Filter sessions based on search and filter
  useEffect(() => {
    filterSessions();
  }, [filterSessions]);

  const openDetail = (session) => {
    setSelectedSession(session);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedSession(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().getFullYear();
    try {
      const date = new Date(dateString);
      return date.getFullYear();
    } catch {
      return new Date().getFullYear();
    }
  };

  const formatSessionTime = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="history-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <div className="logo-circle">NEO</div>
        </div>

        <div className="sidebar-icons">
          <button className="icon-btn" onClick={() => navigate('/')} title="Home">
            <Home size={22} />
          </button>
          <button className="icon-btn active" onClick={() => navigate('/history')} title="History">
            <Clock size={22} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/insights')} title="Insights">
            <BarChart2 size={22} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/feedback')} title="Feedback">
            <MessageCircle size={22} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="history-main">
        <div className="history-content">
          <div className="history-header">
            <h1>History</h1>
          </div>

          {/* Search Bar */}
          <div className="search-bar-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="search-bar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Buttons */}
          <div className="filter-buttons">
            {['All', 'Positive', 'Negative', 'Neutral'].map(filter => (
              <button
                key={filter}
                className={`filter-btn ${selectedFilter === filter ? 'active' : ''}`}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Sessions List */}
          <div className="sessions-container">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session, index) => (
                <div
                  key={index}
                  className="session-card"
                  onClick={() => openDetail(session)}
                >
                  <div className="session-content">
                    <span className="session-title">Session {sessions.length - sessions.indexOf(session)}</span>
                    <span className="session-date">{formatSessionTime(session.endTime)}</span>
                  </div>
                  <span className="session-year">{formatDate(session.endTime)}</span>
                </div>
              ))
            ) : (
              <div className="no-sessions">
                <p>No conversations found. Start a new voice session to begin!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel Modal */}
      {isDetailOpen && selectedSession && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()} ref={detailPanelRef}>
            <div className="detail-header">
              <h2>Conversation Details</h2>
              <button className="close-btn" onClick={closeDetail}>
                <X size={24} />
              </button>
            </div>

            <div className="chat-messages-detail">
              {selectedSession.messages && selectedSession.messages.length > 0 ? (
                selectedSession.messages.map((msg, idx) => (
                  <div key={idx} className={`message-detail ${msg.type}`}>
                    <div className="message-avatar-detail">
                      <div className={msg.type === 'bot' ? 'avatar-bot-detail' : 'avatar-user-detail'}>
                        {msg.type === 'bot' ? 'AI' : 'U'}
                      </div>
                    </div>
                    <div className="message-bubble-detail">
                      {msg.text}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-messages">
                  <p>No messages in this conversation.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="detail-stats">
              <div className="stat-item">
                <span className="stat-label">Messages</span>
                <span className="stat-value">{selectedSession.messages?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Date</span>
                <span className="stat-value">{formatSessionTime(selectedSession.endTime)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sentiment</span>
                <span className="stat-value">{analyzeSentiment(selectedSession)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;