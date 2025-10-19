import React, { useState, useRef, useEffect } from 'react';
import { Home, Clock, BarChart2, MessageCircle, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ChatInterface.css';

function ChatInterface() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hey there! How's it going today? What's on your mind?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');

    setMessages(prev => [...prev, {
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: localStorage.getItem('session_id') || null
        })
      });

      const data = await response.json();
      
      if (data.session_id) {
        localStorage.setItem('session_id', data.session_id);
      }

      setMessages(prev => [...prev, {
        type: 'bot',
        text: data.reply,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-wrapper">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-circle">NEO</div>
        </div>

        <div className="sidebar-icons">
          <button className="icon-btn" onClick={() => navigate('/')} title="Home">
            <Home size={22} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/history')} title="History">
            <Clock size={22} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/insights')} title="Insights">
            <BarChart2 size={22} />
          </button>
          <button className="icon-btn active" title="Chat">
            <MessageCircle size={22} />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        
        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-item">
            <span className="status-dot green"></span>
            <span>System Online</span>
          </div>
          <div className="status-item">
            <span className="status-dot orange"></span>
            <span>AI Learning</span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="messages-container">
          <div className="messages-area">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                <div className="message-avatar">
                  {msg.type === 'bot' ? (
                    <div className="avatar-bot">AI</div>
                  ) : (
                    <div className="avatar-user">U</div>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-sender">
                    {msg.type === 'bot' ? 'NEO' : 'You'}
                  </div>
                  <div className="message-bubble">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message bot">
                <div className="message-avatar">
                  <div className="avatar-bot">AI</div>
                </div>
                <div className="message-content">
                  <div className="message-sender">NEO</div>
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="input-section">
          <div className="input-wrapper">
            {inputText && (
              <button 
                className="input-icon-btn" 
                onClick={() => setInputText('')}
                title="Clear"
              >
                <X size={18} />
              </button>
            )}
            <input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="message-input"
            />
            <button 
              className="send-btn" 
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              title="Send"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ChatInterface;