import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Clock, BarChart2, MessageCircle, Mic, ArrowRight } from 'lucide-react';
import './Welcome.css';

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-layout-with-sidebar">

      {/* Minimal Left Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.jpg" alt="NEO" />
        </div>

        <div className="sidebar-icons">
          <button className="icon-btn active">
            <Home size={22} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/history')}>
            <Clock size={22} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/insights')}>
            <BarChart2 size={22} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/feedback')}>
            <MessageCircle size={22} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="welcome-main-area">

        {/* Top Status Bar */}
        <div className="status-bar-top">
          <div className="status-item">
            <span className="status-dot green"></span>
            <span>Online</span>
          </div>
          <div className="status-item">
            <span className="status-dot orange"></span>
            <span>Active</span>
          </div>
        </div>

        {/* Centered Content */}
        <div className="centered-content">

          {/* Heading */}
          <div className="heading-section">
            <h1  align=" left" >Welcome to NEO</h1>
            <p  align="left">
              The ultimate AI assistant platform tailored for all your needs. 
              Choose your preferred mode of interaction below to begin your personalized experience.
            </p>
          </div>

          {/* Two Cards Side-by-Side */}
          <div className="cards-row">

            {/* Voice Mode */}
            <div className="mode-card-noa" onClick={() => navigate('/voice')}>
              <div className="card-badge-green"></div>
              <div className="card-icon-box">
                <Mic size={28} strokeWidth={2} />
              </div>
              <h3 className="card-title-noa"  align="center" >Voice Mode</h3>
              <p className="card-desc-noa" align="center">
                Engage in natural voice conversations with NEO. Experience seamless, 
                hands-free interaction optimized for multitasking and accessibility.
              </p>
              <button className="arrow-button-noa">
                <ArrowRight size={22} strokeWidth={2.5} />
              </button>
            </div>

            {/* Text Mode */}
            <div className="mode-card-noa" onClick={() => navigate('/chat')}>
              <div className="card-badge-blue"></div>
              <div className="card-icon-box">
                <MessageCircle size={28} strokeWidth={2} />
              </div>
              <h3 className="card-title-noa"  align="center" >Text Mode</h3>
              <p className="card-desc-noa"  align="center">
                Communicate through text for a more focused and precise experience. 
                Perfect for detailed queries and maintaining conversation history.
              </p>
              <button className="arrow-button-noa">
                <ArrowRight size={26} strokeWidth={2.5} />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Welcome;