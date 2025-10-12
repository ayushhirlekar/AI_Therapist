import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './components/Welcome';
import ChatInterface from './components/ChatInterface';
import VoiceChat from './components/VoiceChat';
import History from './components/History';
import Insights from './components/Insights';
import Feedback from './components/Feedback';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/voice" element={<VoiceChat />} />
          <Route path="/history" element={<History />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/feedback" element={<Feedback />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
