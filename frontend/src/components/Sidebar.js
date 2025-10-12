import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Clock, ThumbsUp, User } from 'lucide-react';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-sidebar">
      
      {/* Logo - Always navigates home */}
      <div className="sidebar-icons">
        <div 
          className="sidebar-icon logo-icon" 
          onClick={() => navigate('/')}
          title="Home"
        >
          <img src="/logo.jpg" alt="NEO" className="sidebar-logo" />
        </div>
        
        {/* New Session */}
        <div 
          className={`sidebar-icon ${location.pathname === '/chat' ? 'active' : ''}`}
          onClick={() => navigate('/chat')}
          title="New Session"
        >
          <Sparkles size={20} />
        </div>
        
        {/* History */}
        <div 
          className="sidebar-icon"
          onClick={() => console.log('History clicked')}
          title="Session History"
        >
          <Clock size={20} />
        </div>
        
        {/* Insights */}
        <div 
          className="sidebar-icon"
          onClick={() => console.log('Insights clicked')}
          title="Wellness Insights"
        >
          <ThumbsUp size={20} />
        </div>
      </div>

      {/* User Profile - Bottom */}
      <div className="sidebar-bottom">
        <div 
          className="sidebar-icon"
          onClick={() => console.log('Profile clicked')}
          title="Profile"
        >
          <User size={20} />
        </div>
      </div>

    </div>
  );
}

export default Sidebar;
