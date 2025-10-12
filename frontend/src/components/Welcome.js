import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Clock, BarChart, MessageSquare as MessageIcon, Mic, ArrowRight, Info } from 'lucide-react';
import './Welcome.css';

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-layout-with-sidebar">
      
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.jpg" alt="NEO" />
        </div>
        
        <div className="sidebar-icons">
          <button className="icon-btn active"><Home size={20} /></button>
          <button className="icon-btn" onClick={() => navigate('/history')}><Clock size={20} /></button>
          <button className="icon-btn" onClick={() => navigate('/insights')}><BarChart size={20} /></button>
          <button className="icon-btn" onClick={() => navigate('/feedback')}><MessageIcon size={20} /></button>
        </div>
        
        <div className="sidebar-chat">
          <button className="chat-btn"><Info size={20} /></button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="welcome-main-area">
        
        {/* Top Status Bar */}
        <div className="status-bar-top">
          <div className="status-item">
            <span className="status-dot green"></span>
            <span>System Online</span>
          </div>
          <div className="status-item">
            <span className="status-dot orange"></span>
            <span>AI Learning</span>
          </div>
        </div>

        {/* Centered Content */}
        <div className="centered-content">
          
          {/* Heading */}
          <div className="heading-section">
            <h1>Welcome to NEO</h1>
            <p>Your personal AI therapist designed to provide support, guidance, and a listening ear whenever you need it. Choose your preferred mode of communication below to begin your session.</p>
          </div>

          {/* Two Cards SIDE-BY-SIDE */}
          <div className="cards-row">
            
            {/* Voice Mode */}
            <div className="mode-card-noa" onClick={() => navigate('/voice')}>
              <div className="card-badge-green">🎙 Recommended</div>
              <div className="card-icon-box">
                <Mic size={32} />
              </div>
              <h3 className="card-title-noa">Voice Mode</h3>
              <p className="card-desc-noa">
                Speak naturally with NEO through voice conversation. Our advanced AI understands tone, emotion, and context to provide personalized support.
              </p>
              <button className="arrow-button-noa">
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Text Mode */}
            <div className="mode-card-noa" onClick={() => navigate('/chat')}>
              <div className="card-badge-blue">🔒 Private</div>
              <div className="card-icon-box">
                <MessageIcon size={32} />
              </div>
              <h3 className="card-title-noa">Text Mode</h3>
              <p className="card-desc-noa">
                Communicate through text messages if you prefer typing. Perfect for quiet environments or when you want to express yourself in writing.
              </p>
              <button className="arrow-button-noa">
                <ArrowRight size={20} />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Welcome;
