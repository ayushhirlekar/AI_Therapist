import React, { useState, useRef, useEffect } from 'react';
import { Home, Clock, BarChart2, MessageCircle, Mic, Square, Pause, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './VoiceChat.css';

function VoiceChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hey there! How's it going today? What's on your mind?",
      timestamp: new Date()
    }
  ]);
  const [status, setStatus] = useState('Initializing...');
  const [isPaused, setIsPaused] = useState(false);
  
  // All refs persist across renders
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const stateRef = useRef({
    isRecording: false,
    isProcessing: false,
    isPaused: false
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize on mount only
  useEffect(() => {
    initializeVoiceChat();
    return () => {
      cleanup();
    };
  }, []);

  const initializeVoiceChat = async () => {
    try {
      console.log('📱 Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = processAudio;

      setStatus('👂 Listening...');
      detectVoice();
      console.log('✅ Voice chat initialized');
    } catch (error) {
      console.error('❌ Init error:', error);
      setStatus('Microphone access denied');
    }
  };

  const detectVoice = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);

    // Start recording on voice
    if (rms > 25 && !stateRef.current.isRecording && !stateRef.current.isProcessing && !stateRef.current.isPaused) {
      console.log('🎤 Recording...');
      stateRef.current.isRecording = true;
      setStatus('🎤 Speaking...');
      audioChunksRef.current = [];

      if (mediaRecorderRef.current?.state === 'inactive') {
        mediaRecorderRef.current.start();
      }

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    }

    // Stop recording on silence
    if (rms <= 25 && stateRef.current.isRecording) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          console.log('🤫 Silence detected');
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          stateRef.current.isRecording = false;
          silenceTimerRef.current = null;
        }, 1500);
      }
    }

    // Reset timer if still speaking
    if (rms > 25 && silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    animationFrameRef.current = requestAnimationFrame(detectVoice);
  };

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0 || stateRef.current.isProcessing) {
      console.log('Skipping - no audio or already processing');
      return;
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    console.log('📦 Blob size:', audioBlob.size);

    if (audioBlob.size < 800) {
      console.log('Audio too short');
      audioChunksRef.current = [];
      return;
    }

    stateRef.current.isProcessing = true;
    setStatus('🤔 Processing...');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('session_id', localStorage.getItem('session_id') || `session_${Date.now()}`);

      console.log('📤 Sending audio...');
      
      const response = await fetch('http://localhost:8000/voice-chat-complete', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Got response');

      if (data.session_id) {
        localStorage.setItem('session_id', data.session_id);
      }

      // Add messages
      setMessages(prev => [
        ...prev,
        { type: 'user', text: data.transcribed_text || 'Could not transcribe', timestamp: new Date() },
        { type: 'bot', text: data.reply, timestamp: new Date() }
      ]);

      // Play audio
      if (data.audio_url) {
        const audioUrl = data.audio_url.startsWith('http') 
          ? data.audio_url 
          : `http://localhost:8000${data.audio_url}`;

        console.log('🔊 Playing response...');
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          console.log('✅ Done - resuming');
          stateRef.current.isProcessing = false;
          setStatus('👂 Listening...');
        };

        audio.onerror = () => {
          stateRef.current.isProcessing = false;
          setStatus('👂 Listening...');
        };

        audio.play().catch(e => {
          console.log('Playback blocked:', e);
          stateRef.current.isProcessing = false;
          setStatus('👂 Listening...');
        });
      } else {
        stateRef.current.isProcessing = false;
        setStatus('👂 Listening...');
      }

    } catch (error) {
      console.error('❌ Process error:', error);
      setMessages(prev => [...prev, { type: 'bot', text: 'Error processing. Try again.', timestamp: new Date() }]);
      stateRef.current.isProcessing = false;
      setStatus('👂 Listening...');
    }

    audioChunksRef.current = [];
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    stateRef.current.isPaused = !isPaused;
    
    if (!isPaused) {
      // Pausing
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setStatus('⏸️ Paused');
    } else {
      // Resuming
      setStatus('👂 Listening...');
    }
  };

  const handleEnd = () => {
    if (!window.confirm('End session?')) return;

    const sessionData = {
      messages,
      sessionId: localStorage.getItem('session_id'),
      endTime: new Date().toISOString(),
      duration: messages.length
    };

    const allSessions = JSON.parse(localStorage.getItem('therapy_sessions') || '[]');
    allSessions.push(sessionData);
    localStorage.setItem('therapy_sessions', JSON.stringify(allSessions));

    cleanup();
    navigate('/');
  };

  const cleanup = () => {
    console.log('🧹 Cleaning up');
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close?.();
  };

  return (
    <div className="voice-chat-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-circle">NEO</div>
        </div>
        <div className="sidebar-icons">
          <button className="icon-btn"><Home size={22} /></button>
          <button className="icon-btn"><Clock size={22} /></button>
          <button className="icon-btn"><BarChart2 size={22} /></button>
          <button className="icon-btn"><MessageCircle size={22} /></button>
        </div>
      </div>

      <div className="session-main">
        <div className="session-center">
          <div className="ai-orb listening">
            <div className="orb-inner">
              <Mic size={32} color="white" />
            </div>
            <div className="orb-glow"></div>
          </div>

          <div className="session-status">{status}</div>

          <div className="session-controls">
            <button className="control-btn pause-btn" onClick={handlePause}>
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button className="control-btn end-btn" onClick={handleEnd}>
              <Square size={18} />
              End
            </button>
          </div>
        </div>

        <div className="chat-panel">
          <div className="chat-header">
            <h3>Conversation</h3>
            <span className="message-count">{messages.length} messages</span>
          </div>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.type}`}>
                <div className="message-avatar">
                  <div className={msg.type === 'bot' ? 'avatar-bot' : 'avatar-user'}>
                    {msg.type === 'bot' ? 'AI' : 'U'}
                  </div>
                </div>
                <div className="message-content">
                  <div className="message-sender">{msg.type === 'bot' ? 'NEO' : 'You'}</div>
                  <div className="message-bubble">{msg.text}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceChat;