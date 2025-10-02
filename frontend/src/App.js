import React, { useState } from 'react';
import './App.css';
import { BRAND_CONFIG } from './brandConfig';
import VoiceChat from './components/VoiceChat';


function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('voice-chat');
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const sections = [
    {
      id: 'voice-chat',
      title: 'Voice Conversations',
      subtitle: 'Speak naturally',
      icon: '🎙️',
      description: 'Engage in natural, supportive voice conversations with your AI companion'
    },
    {
      id: 'text-chat',
      title: 'Text Dialogue', 
      subtitle: 'Write your thoughts',
      icon: '💬',
      description: 'Express yourself through thoughtful text conversations'
    },
    {
      id: 'insights',
      title: 'Wellness Insights',
      subtitle: 'Track your journey',
      icon: '📊',
      description: 'Understand your emotional patterns and progress over time'
    },
    {
      id: 'resources',
      title: 'Mindfulness Tools',
      subtitle: 'Guided support',
      icon: '🌱',
      description: 'Access personalized mental wellness exercises and techniques'
    }
  ];

  const enterApp = () => {
    setShowIntro(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const selectSection = (sectionId) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pastel-green/20 flex items-center justify-center p-8 font-inter">
        <div className="max-w-2xl text-center">
          {/* Logo */}
          <div className="w-24 h-24 bg-lavender-gray/50 rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-8 border border-pastel-green/30">
            <span className="text-5xl">{BRAND_CONFIG.logo}</span>
          </div>

          {/* Welcome Content */}
          <h1 className="text-5xl font-sora font-semibold text-deep-charcoal mb-6 leading-tight">
            Welcome to {BRAND_CONFIG.name}
          </h1>
          
          <p className="text-lg text-deep-charcoal/80 mb-10 leading-relaxed font-inter">
            Your mindful AI companion designed to provide empathetic support, personalized guidance, and a safe space for your mental wellness journey.
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex items-center justify-center space-x-4 text-deep-charcoal/70">
              <div className="w-10 h-10 bg-pastel-green/30 rounded-full flex items-center justify-center">
                <span className="text-xl">🤗</span>
              </div>
              <span className="font-inter">Empathetic & non-judgmental conversations</span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-deep-charcoal/70">
              <div className="w-10 h-10 bg-lavender-gray/40 rounded-full flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
              <span className="font-inter">Complete privacy & secure interactions</span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-deep-charcoal/70">
              <div className="w-10 h-10 bg-pastel-green/30 rounded-full flex items-center justify-center">
                <span className="text-xl">🌱</span>
              </div>
              <span className="font-inter">Personalized wellness insights & growth</span>
            </div>
          </div>

          <button
            onClick={enterApp}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            className="bg-sage-green hover:bg-sage-hover text-soft-white px-12 py-4 rounded-2xl text-lg font-sora font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            {isButtonHovered ? "Let's Talk" : "Begin Your Journey"}
          </button>

          <p className="text-sm text-deep-charcoal/50 mt-8 font-inter">
            Take a deep breath. You're in a safe, supportive space.
          </p>
        </div>
      </div>
    );
  }

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-soft-white font-inter">
      {/* Fixed Header with Logo & Name */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-soft-white/95 backdrop-blur-sm border-b border-pastel-green/20">
        <div className="flex items-center justify-between px-8 py-5">
          {/* Logo & Name - Clickable to toggle sidebar */}
          <button
            onClick={toggleSidebar}
            className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200 group"
            aria-label="Toggle navigation menu"
          >
            <div className="w-11 h-11 bg-sage-green rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-xl text-soft-white">{BRAND_CONFIG.logo}</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-sora font-semibold text-deep-charcoal">{BRAND_CONFIG.name}</h1>
              <p className="text-xs text-deep-charcoal/60 font-inter">{BRAND_CONFIG.tagline}</p>
            </div>
          </button>

          {/* Current Section Indicator */}
          <div className="hidden md:flex items-center space-x-3 text-deep-charcoal/70">
            <div className="w-8 h-8 bg-pastel-green/30 rounded-lg flex items-center justify-center">
              <span className="text-sm">{currentSection?.icon}</span>
            </div>
            <span className="font-sora font-medium">{currentSection?.title}</span>
          </div>
        </div>
      </header>

      {/* Left Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-soft-white shadow-xl border-r border-pastel-green/20 transition-transform duration-300 z-40 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ width: '340px' }}>
        
        {/* Sidebar Header */}
        <div className="pt-24 pb-6 px-6 border-b border-pastel-green/20">
          <h2 className="text-lg font-sora font-semibold text-deep-charcoal mb-2">Your Wellness Space</h2>
          <p className="text-sm text-deep-charcoal/60 font-inter">Choose how you'd like to connect today</p>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => selectSection(section.id)}
              className={`w-full text-left p-5 rounded-xl transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-pastel-green/20 border-l-4 border-sage-green shadow-sm'
                  : 'hover:bg-lavender-gray/20'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  activeSection === section.id 
                    ? 'bg-sage-green' 
                    : 'bg-lavender-gray/40'
                }`}>
                  <span className={`text-xl ${
                    activeSection === section.id ? 'text-soft-white' : 'text-deep-charcoal/60'
                  }`}>
                    {section.icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-sora font-medium text-deep-charcoal">{section.title}</h3>
                  <p className="text-sm text-deep-charcoal/60 font-inter">{section.subtitle}</p>
                </div>
              </div>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-pastel-green/20">
          <div className="text-center">
            <p className="text-xs text-deep-charcoal/50 font-inter">
              Your conversations are private and secure
            </p>
            <div className="flex justify-center mt-3 space-x-2">
              <div className="w-2 h-2 bg-sage-green/40 rounded-full"></div>
              <div className="w-2 h-2 bg-pastel-green/40 rounded-full"></div>
              <div className="w-2 h-2 bg-lavender-gray/40 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-deep-charcoal/10 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-28 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Section Header */}
          <div className="mb-12">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-pastel-green/30 rounded-2xl shadow-sm flex items-center justify-center mr-6 border border-pastel-green/30">
                <span className="text-3xl">{currentSection?.icon}</span>
              </div>
              <div>
                <h1 className="text-4xl font-sora font-semibold text-deep-charcoal mb-3 leading-tight">
                  {currentSection?.title}
                </h1>
                <p className="text-lg text-deep-charcoal/70 font-inter">
                  {currentSection?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          {activeSection === 'voice-chat' ? (
            <VoiceChat />
          ) : (
            <div className="bg-lavender-gray/20 rounded-3xl border border-lavender-gray/30 p-12">
              <div className="text-center py-20">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-pastel-green/30 to-lavender-gray/30 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-6xl opacity-60">{currentSection?.icon}</span>
                </div>
                
                <h2 className="text-2xl font-sora font-medium text-deep-charcoal mb-4">
                  Coming Soon
                </h2>
                
                <p className="text-deep-charcoal/60 max-w-md mx-auto mb-10 font-inter leading-relaxed">
                  We're thoughtfully crafting this experience to provide you with the most supportive and intuitive mental wellness companion.
                </p>

                {activeSection === 'text-chat' && (
                  <button className="bg-sage-green hover:bg-sage-hover text-soft-white px-10 py-4 rounded-2xl font-sora font-medium transition-all duration-200 shadow-md hover:shadow-lg">
                    Begin Text Chat
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
