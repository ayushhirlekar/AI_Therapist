from app import create_app
from flask import request, jsonify, send_from_directory
import os
from database.database import create_session, save_turn, get_session_turns
from services.ai_service import get_ai_service
from services.voice_service import VoiceService
from services.tts_service import TTSService
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO, emit
import uuid
import asyncio
import threading
import time
import traceback
from flask import send_file

app = create_app()

# Enable CORS for all routes
CORS(app, origins=["http://localhost:3000"])

# Initialize SocketIO with CORS support for real-time sessions
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:3000"], async_mode='threading')

print("🚀 Starting Zenith...", flush=True)

# ============================================================================
# FIXED: Initialize services at module level (singleton pattern)
# Services are loaded ONCE when server starts, not per request
# ============================================================================
print("🧠 Initializing AI Service (this loads the model once)...", flush=True)
ai_service = get_ai_service()  # Singleton - loads model once at startup
print("✅ AI Service ready!", flush=True)

print("🎤 Initializing Voice Service...", flush=True)
voice_service = VoiceService()
print("✅ Voice Service ready!", flush=True)

print("🔊 Initializing TTS Service...", flush=True)
tts_service = TTSService()
print("✅ TTS Service ready!", flush=True)

# Active sessions storage
active_sessions = {}

@app.route('/health')
def health_check():
    return {'status': 'healthy', 'message': 'Zenith Voice Assistant is running!'}

@app.route('/')
def home():
    return {
        'message': 'Mental Health Voice Assistant API', 
        'status': 'ready', 
        'features': ['text_chat', 'voice_chat', 'voice_chat_complete', 'real_time_sessions']
    }

@app.route('/chat', methods=['POST'])
def chat():
    """Text-based chat endpoint"""
    try:
        data = request.json
        user_message = data.get('message')
        session_id = data.get('session_id')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        if not session_id:
            session_id = create_session()
            print(f"✅ Created new session: {session_id}")
        
        # Save user message
        save_turn(session_id, 'user', user_message)
        
        # Get conversation history
        conversation = get_session_turns(session_id)
        
        print(f"💬 Generating AI response for: {user_message[:50]}...", flush=True)
        
        # Generate AI response using singleton service
        assistant_reply = ai_service.generate_response(
            user_message, 
            [dict(row) for row in conversation]
        )
        
        # Save assistant response
        save_turn(session_id, 'assistant', assistant_reply)
        
        # Get updated conversation
        updated_conversation = get_session_turns(session_id)
        
        return jsonify({
            'session_id': session_id,
            'reply': assistant_reply,
            'conversation': [dict(row) for row in updated_conversation]
        })
    
    except Exception as e:
        print(f"❌ Chat error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/voice-chat', methods=['POST'])
def voice_chat():
    """Voice chat endpoint - transcribes audio and returns text response"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio = request.files['audio']
        session_id = request.form.get('session_id')
        
        if not session_id:
            session_id = create_session()
            print(f"✅ Created new session: {session_id}")
        
        # Save temporary audio file
        temp_path = f"temp_audio_{session_id}.wav"
        audio.save(temp_path)
        
        # Transcribe audio
        print("🎧 Transcribing audio...", flush=True)
        user_message = voice_service.transcribe_audio(temp_path)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        if not user_message:
            return jsonify({'error': 'Failed to transcribe audio'}), 500
        
        print(f"✅ Transcribed: {user_message[:50]}...")
        
        # Save user message
        save_turn(session_id, 'user', user_message)
        
        # Get conversation history
        conversation = get_session_turns(session_id)
        
        # Generate AI response
        print("🤖 Generating AI response...", flush=True)
        assistant_reply = ai_service.generate_response(
            user_message, 
            [dict(row) for row in conversation]
        )
        
        # Save assistant response
        save_turn(session_id, 'assistant', assistant_reply)
        
        # Get updated conversation
        updated_conversation = get_session_turns(session_id)
        
        return jsonify({
            'session_id': session_id,
            'transcribed_text': user_message,
            'reply': assistant_reply,
            'conversation': [dict(row) for row in updated_conversation]
        })
    
    except Exception as e:
        print(f"❌ Voice chat error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/voice-chat-complete', methods=['POST'])
@app.route('/voice-chat-complete', methods=['POST'])
def voice_chat_complete():
    """Complete voice chat endpoint - WITH DETAILED TIMING DIAGNOSTICS"""
    try:
        # Track total pipeline time
        pipeline_start = time.time()
        
        print("\n" + "="*70)
        print("=== VOICE CHAT COMPLETE ENDPOINT CALLED ===")
        print("="*70)
        
        # ============================================================
        # STEP 1: Receive and Save Audio
        # ============================================================
        step1_start = time.time()
        
        if 'audio' not in request.files:
            print('❌ No audio file in request')
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio = request.files['audio']
        session_id = request.form.get('session_id')
        print(f"✅ Audio file received, session_id: {session_id}")
        
        if not session_id:
            session_id = create_session()
            print(f"✅ Created new session: {session_id}")
        
        # Save temporary audio file
        temp_path = f"temp_audio_{session_id}.wav"
        audio.save(temp_path)
        
        step1_time = time.time() - step1_start
        print(f"⏱️  Step 1 (Receive & Save): {step1_time:.3f}s")
        
        # ============================================================
        # STEP 2: Transcribe Audio (Speech-to-Text)
        # ============================================================
        print("\n🎧 Starting transcription...")
        step2_start = time.time()
        
        user_message = voice_service.transcribe_audio(temp_path)
        
        step2_time = time.time() - step2_start
        print(f"✅ Transcription result: {user_message}")
        print(f"⏱️  Step 2 (Transcription): {step2_time:.3f}s")
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            print("✅ Temp file cleaned up")
        
        if not user_message:
            print('❌ Transcription failed or empty')
            return jsonify({'error': 'Failed to transcribe audio'}), 500
        
        # ============================================================
        # STEP 3: Save User Message & Get History
        # ============================================================
        step3_start = time.time()
        
        print("\n💾 Saving user message to database...")
        save_turn(session_id, 'user', user_message)
        
        print("📚 Getting conversation history...")
        conversation = get_session_turns(session_id)
        
        step3_time = time.time() - step3_start
        print(f"⏱️  Step 3 (Database ops): {step3_time:.3f}s")
        
        # ============================================================
        # STEP 4: Generate AI Response (THE BOTTLENECK!)
        # ============================================================
        print("\n🧠 Generating AI response...")
        step4_start = time.time()
        
        assistant_reply = ai_service.generate_response(
            user_message, 
            [dict(row) for row in conversation]
        )
        
        step4_time = time.time() - step4_start
        print(f"✅ AI response: {assistant_reply[:100]}...")
        print(f"⏱️  Step 4 (AI Generation): {step4_time:.3f}s ← CHECK THIS!")
        
        # ============================================================
        # STEP 5: Save AI Response
        # ============================================================
        step5_start = time.time()
        
        print("\n💾 Saving AI response to database...")
        save_turn(session_id, 'assistant', assistant_reply)
        
        step5_time = time.time() - step5_start
        print(f"⏱️  Step 5 (Save AI response): {step5_time:.3f}s")
        
        # ============================================================
        # STEP 6: Generate TTS Audio
        # ============================================================
        print("\n🎤 Generating TTS audio...")
        step6_start = time.time()
        
        audio_file = tts_service.generate_speech(assistant_reply)
        
        step6_time = time.time() - step6_start
        print(f"✅ TTS audio created: {audio_file}")
        print(f"⏱️  Step 6 (TTS Generation): {step6_time:.3f}s")
        
        if not audio_file or not os.path.exists(audio_file):
            print('❌ TTS generation failed or file not found')
            return jsonify({'error': 'Failed to generate speech'}), 500
        
        # ============================================================
        # FINAL: Calculate Total Time and Print Report
        # ============================================================
        total_time = time.time() - pipeline_start
        
        print("\n" + "="*70)
        print("📊 COMPLETE PIPELINE TIMING BREAKDOWN:")
        print("="*70)
        print(f"   Step 1 - Receive Audio:     {step1_time:>6.2f}s")
        print(f"   Step 2 - Transcription:      {step2_time:>6.2f}s")
        print(f"   Step 3 - Database ops:       {step3_time:>6.2f}s")
        print(f"   Step 4 - AI Generation:      {step4_time:>6.2f}s  ⚠️  BOTTLENECK!")
        print(f"   Step 5 - Save AI response:   {step5_time:>6.2f}s")
        print(f"   Step 6 - TTS Audio:          {step6_time:>6.2f}s")
        print("-"*70)
        print(f"   TOTAL PIPELINE TIME:         {total_time:>6.2f}s")
        print("="*70 + "\n")
        
        # Identify the slowest component
        times = {
            'Transcription': step2_time,
            'AI Generation': step4_time,
            'TTS': step6_time
        }
        slowest = max(times.items(), key=lambda x: x[1])
        print(f"🐌 Slowest component: {slowest[0]} ({slowest[1]:.2f}s)")
        
        if step4_time > 5.0:
            print("⚠️  WARNING: AI generation is very slow!")
            print("💡 SOLUTION: Consider switching to Groq API for 10x speed boost")
        
        print("✅ SUCCESS - Returning response\n")
        
        return jsonify({
            'session_id': session_id,
            'transcribed_text': user_message,
            'reply': assistant_reply,
            'audio_file': audio_file,
            'audio_url': f'/audio/{os.path.basename(audio_file)}',
            'timing': {
                'transcription': round(step2_time, 2),
                'ai_generation': round(step4_time, 2),
                'tts': round(step6_time, 2),
                'total': round(total_time, 2)
            }
        })
    
    except Exception as e:
        print("\n❌ EXCEPTION OCCURRED:")
        print(f"Error: {str(e)}")
        print("Full traceback:")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/audio/<filename>')
def serve_audio(filename):
    """Serve audio files"""
    try:
        # Absolute path to audio file
        audio_path = os.path.join(os.getcwd(), 'static', 'audio', filename)
        print(f"🎵 Serving audio: {audio_path}")
        
        # Check if file exists
        if not os.path.exists(audio_path):
            print(f"❌ Audio file not found: {audio_path}")
            return "Audio file not found", 404
        
        # Serve the file
        return send_file(audio_path, mimetype='audio/mpeg')
    
    except Exception as e:
        print(f"❌ Audio serve error: {e}")
        traceback.print_exc()
        return f"Error serving audio: {str(e)}", 500

# =============================================================================
# WebSocket Events for Real-Time Voice Sessions
# =============================================================================

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f'✅ Client connected: {request.sid}')
    emit('connected', {
        'message': 'Connected to Zenith voice session server',
        'client_id': request.sid
    })

@socketio.on('start_session')
def handle_start_session(data):
    """Start a new real-time voice session"""
    client_id = request.sid
    session_duration = data.get('duration', 30)  # Default 30 minutes
    db_session_id = create_session()
    
    # Store active session
    active_sessions[client_id] = {
        'db_session_id': db_session_id,
        'duration': session_duration,
        'start_time': time.time(),
        'status': 'active'
    }
    
    print(f'🎙️ Starting voice session for client {client_id}: {session_duration} minutes')
    
    emit('session_started', {
        'message': f'Voice session started for {session_duration} minutes',
        'duration': session_duration,
        'session_id': db_session_id,
        'client_id': client_id
    })

@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    """Handle real-time audio chunks"""
    client_id = request.sid
    
    if client_id not in active_sessions:
        emit('error', {'message': 'No active session found'})
        return
    
    try:
        # TODO: Process audio chunk in real-time
        # This will be implemented in future phases
        print(f'📡 Received audio chunk from client {client_id}')
        
        # Send acknowledgment
        emit('audio_received', {'status': 'processing'})
    
    except Exception as e:
        print(f'❌ Error processing audio chunk: {e}')
        emit('error', {'message': f'Error processing audio: {str(e)}'})

@socketio.on('end_session')
def handle_end_session(data):
    """End a real-time voice session"""
    client_id = request.sid
    
    if client_id in active_sessions:
        session_info = active_sessions[client_id]
        session_duration = time.time() - session_info['start_time']
        
        print(f'🛑 Ending voice session for client {client_id} after {session_duration:.1f} seconds')
        
        # Clean up session
        del active_sessions[client_id]
        
        emit('session_ended', {
            'message': 'Voice session ended',
            'duration': session_duration,
            'session_id': session_info['db_session_id']
        })
    else:
        emit('error', {'message': 'No active session to end'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    client_id = request.sid
    print(f'❌ Client disconnected: {client_id}')
    
    # Clean up any active sessions
    if client_id in active_sessions:
        print(f'🧹 Cleaning up session for disconnected client {client_id}')
        del active_sessions[client_id]

# Session cleanup background task
def cleanup_expired_sessions():
    """Clean up sessions that have exceeded their time limit"""
    while True:
        current_time = time.time()
        expired_clients = []
        
        for client_id, session_info in active_sessions.items():
            session_age = current_time - session_info['start_time']
            max_duration = session_info['duration'] * 60  # Convert to seconds
            
            if session_age > max_duration:
                expired_clients.append(client_id)
        
        # Clean up expired sessions
        for client_id in expired_clients:
            print(f'⏰ Auto-ending expired session for client {client_id}')
            if client_id in active_sessions:
                del active_sessions[client_id]
        
        time.sleep(30)  # Check every 30 seconds

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_expired_sessions, daemon=True)
cleanup_thread.start()
print("✅ Session cleanup thread started")

if __name__ == '__main__':
    print("\n🎙️ Starting Flask server on http://0.0.0.0:8000")
    print("🌐 Frontend should connect from: http://localhost:3000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=8000)
