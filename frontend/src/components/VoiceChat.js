import React, { useState, useRef } from 'react';

function VoiceChat() {
  // State variables
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Start recording function
  const startRecording = async () => {
    try {
      console.log('Starting to record...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.addEventListener('dataavailable', (event) => {
        console.log('Got audio data:', event.data.size);
        audioChunksRef.current.push(event.data);
      });

      mediaRecorder.addEventListener('stop', sendToBackend);

      mediaRecorder.start();
      setIsRecording(true);
      setErrorMessage('');
      console.log('Recording started!');

    } catch (error) {
      console.error('Error starting recording:', error);
      setErrorMessage('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording function
  const stopRecording = () => {
    console.log('Stopping recording...');
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        track.stop();
      });
      
      setIsRecording(false);
      setIsLoading(true);
      console.log('Recording stopped, sending to AI...');
    }
  };

  // Send to backend function
  const sendToBackend = async () => {
    try {
      console.log('Preparing to send audio to backend...');
      
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: 'audio/wav' 
      });
      
      console.log('Audio blob size:', audioBlob.size);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('session_id', 'user_session_' + Date.now());

      const response = await fetch('http://localhost:8000/voice-chat-complete', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Got response from AI:', result);

        setConversation(prev => [
          ...prev,
          {
            type: 'user',
            text: result.transcribed_text || 'Audio transcription failed',
            timestamp: new Date().toLocaleTimeString()
          },
          {
            type: 'ai',
            text: result.reply || 'AI response unavailable',
            audioUrl: result.audio_url ? `http://localhost:8000${result.audio_url}` : null,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);

        console.log('Conversation updated successfully!');

        // FIXED: Proper audio playback
        if (result.audio_url) {
          const audioUrl = `http://localhost:8000${result.audio_url}`;
          console.log('Playing audio from:', audioUrl);
          
          const audio = new Audio(audioUrl);
          
          // Play when audio is ready
          audio.addEventListener('canplaythrough', () => {
            console.log('✅ Audio ready to play');
            audio.play().catch(error => {
              console.error('❌ Audio playback error:', error);
              setErrorMessage('Could not play audio response');
            });
          });
          
          // Handle errors
          audio.addEventListener('error', (error) => {
            console.error('❌ Audio loading error:', error);
            setErrorMessage('Audio file could not be loaded');
          });
          
          // Load the audio
          audio.load();
        }

      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }

    } catch (error) {
      console.error('Error sending to backend:', error);
      setErrorMessage('Failed to connect to AI. Make sure your backend is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  // Component UI
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-sora font-semibold text-deep-charcoal mb-4">
          Voice Chat with Zenith
        </h2>
        <p className="text-deep-charcoal/70 font-inter">
          Click the microphone to start talking. I'll listen and respond with my voice.
        </p>
      </div>

      {/* Recording Button */}
      <div className="text-center mb-8">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className={`w-24 h-24 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center text-4xl ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : isLoading 
              ? 'bg-sage-green/50 text-soft-white cursor-not-allowed'
              : 'bg-sage-green hover:bg-sage-green/90 text-white hover:scale-105'
          }`}
        >
          {isLoading ? '' : isRecording ? '⏹️' : '🎙️'}
        </button>
        
        <p className="mt-4 text-sm font-inter text-deep-charcoal/60">
          {isLoading ? 'AI is thinking...' : isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 font-inter">
          <p className="text-sm"><strong>Error:</strong> {errorMessage}</p>
        </div>
      )}

      {/* Conversation History */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {conversation.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl font-quicksand ${
              message.type === 'user' 
                ? 'bg-sage-green text-white' 
                : 'bg-pastel-green/30 text-deep-charcoal'
            }`}>
              <p className="text-sm mb-1">{message.text}</p>
              <p className="text-xs opacity-70">{message.timestamp}</p>
              
              {/* FIXED: Enhanced Audio player for AI responses */}
              {message.type === 'ai' && message.audioUrl && (
                <div className="mt-2">
                  <audio 
                    controls 
                    className="w-full h-8"
                    style={{ maxWidth: '200px' }}
                    preload="auto"
                  >
                    <source src={message.audioUrl} type="audio/mpeg" />
                    <source src={message.audioUrl} type="audio/wav" />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Welcome message if no conversation yet */}
        {conversation.length === 0 && (
          <div className="text-center py-12 text-deep-charcoal/50 font-inter">
            <p>👋 Start a conversation by clicking the microphone above!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceChat;
