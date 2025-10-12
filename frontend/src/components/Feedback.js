import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Clock, BarChart, MessageCircle, Info } from 'lucide-react';
import './Welcome.css';

function Feedback() {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <img src="/logo.jpg" alt="NEO" style={{width: '40px', height: '40px', objectFit: 'contain'}} />
        </div>
        
        <div className="sidebar-icons">
          <button className="icon-btn" onClick={() => navigate('/')}><Home size={20} /></button>
          <button className="icon-btn" onClick={() => navigate('/history')}><Clock size={20} /></button>
          <button className="icon-btn" onClick={() => navigate('/insights')}><BarChart size={20} /></button>
          <button className="icon-btn active" onClick={() => navigate('/feedback')}><MessageCircle size={20} /></button>
        </div>
        
        <div className="sidebar-chat">
          <button className="chat-btn"><Info size={20} /></button>
        </div>
      </div>

      <div className="main-content">
        <div className="status-bar">
          <div className="status"><span className="dot green"></span>System Online</div>
          <div className="status"><span className="dot orange"></span>AI Learning</div>
        </div>

        <div className="welcome-text centered">
          <h1>Feedback</h1>
          <p>Share your thoughts and help us improve NEO.</p>
          <div style={{marginTop: '40px', color: '#64748b'}}>Coming soon...</div>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
