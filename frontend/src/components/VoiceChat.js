import React, { useState, useRef, useEffect } from 'react';
import { Home, Clock, BarChart, MessageCircle as MessageIcon, Mic, Volume2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ChatInterface.css';

function VoiceChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "hey there! how's it going today? what's on your mind?",
      timestamp: new Date()
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = handleStopRecording;
      mediaRecorderRef.current.start();
      setIsRecording(true);
      console.log('🎤 Recording started');

    } catch (error) {
      console.error('Microphone error:', error);
      alert('Please allow microphone access to use voice mode.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      console.log('🛑 Recording stopped');
    }
  };

  const handleStopRecording = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    console.log('📦 Audio blob size:', audioBlob.size);

    // Add "Transcribing..." message  
    const userMsgIndex = messages.length;
    setMessages(prev => [...prev, {
      type: 'user',
      text: '🎤 Transcribing...',
      isTranscribing: true,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('session_id', localStorage.getItem('session_id') || `session_${Date.now()}`);

      console.log('📤 Sending audio...');

      const response = await fetch('http://localhost:8000/voice-chat-complete', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('✅ Response:', data);

      if (data.session_id) {
        localStorage.setItem('session_id', data.session_id);
      }

      // Update with actual transcription
      setMessages(prev => {
        const updated = [...prev];
        updated[userMsgIndex] = {
          type: 'user',
          text: data.transcribed_text || 'Could not transcribe',
          isTranscribing: false,
          timestamp: new Date()
        };
        return updated;
      });

      // Add bot response
      setMessages(prev => [...prev, {
        type: 'bot',
        text: data.reply,
        audioUrl: data.audio_url ? `http://localhost:8000${data.audio_url}` : null,
        timestamp: new Date()
      }]);

      // Auto-play response
      if (data.audio_url) {
        const audio = new Audio(`http://localhost:8000${data.audio_url}`);
        audio.play().catch(e => console.log('Autoplay blocked'));
      }

    } catch (error) {
      console.error('❌ Error:', error);
      
      // Update failed transcription
      setMessages(prev => {
        const updated = [...prev];
        updated[userMsgIndex] = {
          type: 'user',
          text: '❌ Transcription failed',
          timestamp: new Date()
        };
        return updated;
      });

      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date()
      }]);
    }

    setIsLoading(false);
  };

  const playAudio = (url) => {
    const audio = new Audio(url);
    audio.play();
  };

  return (
    <div className="chat-container">
      
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <img src="/logo.jpg" alt="NEO" />
        </div>
        
        <div className="sidebar-icons">
          <button className="icon-btn" onClick={() => navigate('/')}><Home size={20} /></button>
          <button className="icon-btn" onClick={() => navigate('/history')}><Clock size={20} /></button>
          <button className="icon-btn" onClick={() => navigate('/insights')}><BarChart size={20} /></button>
          <button className="icon-btn" onClick={() => navigate('/feedback')}><MessageIcon size={20} /></button>
        </div>
        
        <div className="sidebar-chat">
          <button className="chat-btn"><Info size={20} /></button>
        </div>
      </div>

      {/* Main Chat */}
      <div className="chat-main">
        
        <div className="status-bar">
          <div className="status"><span className="dot green"></span>System Online</div>
          <div className="status"><span className="dot orange"></span>AI Learning</div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              {msg.type === 'bot' && <div className="avatar"></div>}
              <div className={`bubble ${msg.isTranscribing ? 'transcribing' : ''}`}>
                {msg.text}
                {msg.audioUrl && (
                  <button className="audio-play" onClick={() => playAudio(msg.audioUrl)}>
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
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

        {/* Voice Input */}
        <div className="voice-input-area">
          <button 
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={() => isRecording && stopRecording()}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isLoading}
          >
            <Mic size={20} />
            <span>{isRecording ? 'Release to send' : 'Hold to record'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default VoiceChat;
