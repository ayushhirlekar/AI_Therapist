import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Clock, BarChart2, MessageCircle, User } from 'lucide-react';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo" onClick={() => navigate('/')}>
        <img src="/logo.jpg" alt="NEO" />
      </div>

      {/* Icons */}
      <div className="sidebar-icons">
        <button
          className={`icon-btn ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <Home size={22} />
        </button>
        <button
          className={`icon-btn ${location.pathname === '/history' ? 'active' : ''}`}
          onClick={() => navigate('/history')}
        >
          <Clock size={22} />
        </button>
        <button
          className={`icon-btn ${location.pathname === '/insights' ? 'active' : ''}`}
          onClick={() => navigate('/insights')}
        >
          <BarChart2 size={22} />
        </button>
        <button
          className={`icon-btn ${location.pathname === '/feedback' ? 'active' : ''}`}
          onClick={() => navigate('/feedback')}
        >
          <MessageCircle size={22} />
        </button>
      </div>

      {/* Bottom User Icon */}
      <div className="sidebar-icons bottom">
        <button
          className={`icon-btn ${location.pathname === '/profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <User size={22} />
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
