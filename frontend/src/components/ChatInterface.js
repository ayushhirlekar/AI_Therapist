import React, { useState, useRef, useEffect } from 'react';
import { Home, Info, Grid, Video, User, HelpCircle, MessageSquare, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ChatInterface.css';

function ChatInterface() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "hey there! how's it going today? what's on your mind?",
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
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/')}>NEO</div>
        
        <div className="sidebar-icons">
          <button className="icon-btn" onClick={() => navigate('/')}><Home size={20} /></button>
          <button className="icon-btn"><Info size={20} /></button>
          <button className="icon-btn"><Grid size={20} /></button>
          <button className="icon-btn"><Video size={20} /></button>
          <button className="icon-btn"><User size={20} /></button>
          <button className="icon-btn"><HelpCircle size={20} /></button>
        </div>
        
        <div className="sidebar-chat">
          <button className="chat-btn active"><MessageSquare size={20} /></button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        
        {/* Top Status */}
        <div className="status-bar">
          <div className="status"><span className="dot green"></span>System Online</div>
          <div className="status"><span className="dot orange"></span>AI Learning</div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              {msg.type === 'bot' && <div className="avatar"></div>}
              <div className="bubble">{msg.text}</div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot">
              <div className="avatar"></div>
              <div className="bubble">
                <div className="typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          {inputText && (
            <button className="input-icon" onClick={() => setInputText('')}>
              <X size={18} />
            </button>
          )}
          <input
            type="text"
            placeholder="type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button 
            className="send-button" 
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}

export default ChatInterface;
