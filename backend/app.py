from app import create_app
from flask import request, jsonify, send_from_directory
import os
from database.database import create_session, save_turn, get_session_turns
from services.ai_service import MentalHealthAI
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

print(" Starting zeneith", flush=True)
ai_service = MentalHealthAI()
voice_service = VoiceService()
tts_service = TTSService()

# Active sessions storage
active_sessions = {}

@app.route('/health')
def health_check():
    return {'status': 'healthy', 'message': 'Zenith Voice Assistant is running! '}

@app.route('/')
def home():
    return {
        'message': 'Mental Health Voice Assistant API', 
        'status': 'ready', 
        'features': ['text_chat', 'voice_chat', 'voice_chat_complete', 'real_time_sessions']
    }

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    session_id = data.get('session_id')
    if not session_id:
        session_id = create_session()
    save_turn(session_id, 'user', user_message)
    conversation = get_session_turns(session_id)
    print(f" Generating AI response for: {user_message[:50]}...", flush=True)
    assistant_reply = ai_service.generate_response(user_message, [dict(row) for row in conversation])
    save_turn(session_id, 'assistant', assistant_reply)
    updated_conversation = get_session_turns(session_id)
    return jsonify({
        'session_id': session_id,
        'reply': assistant_reply,
        'conversation': [dict(row) for row in updated_conversation]
    })

@app.route('/voice-chat', methods=['POST'])
def voice_chat():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        audio = request.files['audio']
        session_id = request.form.get('session_id')
        if not session_id:
            session_id = create_session()
        temp_path = f"temp_audio_{session_id}.wav"
        audio.save(temp_path)
        user_message = voice_service.transcribe_audio(temp_path)
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if not user_message:
            return jsonify({'error': 'Failed to transcribe audio'}), 500
        save_turn(session_id, 'user', user_message)
        conversation = get_session_turns(session_id)
        assistant_reply = ai_service.generate_response(user_message, [dict(row) for row in conversation])
        save_turn(session_id, 'assistant', assistant_reply)
        updated_conversation = get_session_turns(session_id)
        return jsonify({
            'session_id': session_id,
            'transcribed_text': user_message,
            'reply': assistant_reply,
            'conversation': [dict(row) for row in updated_conversation]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/voice-chat-complete', methods=['POST'])
def voice_chat_complete():
    try:
        print("=== VOICE CHAT COMPLETE ENDPOINT CALLED ===")
        
        if 'audio' not in request.files:
            print('❌ No audio file in request')
            return jsonify({'error': 'No audio file provided'}), 400
            
        audio = request.files['audio']
        session_id = request.form.get('session_id')
        print(f"✅ Audio file received, session_id: {session_id}")
        
        if not session_id:
            session_id = create_session()
            print(f"✅ Created new session: {session_id}")
        
        temp_path = f"temp_audio_{session_id}.wav"
        audio.save(temp_path)
        print(f"✅ Audio saved to: {temp_path}")
        
        print("🎧 Starting transcription...")
        user_message = voice_service.transcribe_audio(temp_path)
        print(f"✅ Transcription result: {user_message}")
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
            print("✅ Temp file cleaned up")
        
        if not user_message:
            print('❌ Transcription failed or empty')
            return jsonify({'error': 'Failed to transcribe audio'}), 500
            
        print(" Saving user message to database...")
        save_turn(session_id, 'user', user_message)
        
        print(" Getting conversation history...")
        conversation = get_session_turns(session_id)
        
        print(" Generating AI response...")
        assistant_reply = ai_service.generate_response(user_message, [dict(row) for row in conversation])
        print(f"✅ AI response: {assistant_reply[:100]}...")
        
        print(" Saving AI response to database...")
        save_turn(session_id, 'assistant', assistant_reply)
        
        print("🎤 Generating TTS audio...")
        # Call the CORRECTED generate_speech method
        audio_file = tts_service.generate_speech(assistant_reply)
        print(f"✅ TTS result: {audio_file}")
        
        if not audio_file or not os.path.exists(audio_file):
            print('❌ TTS generation failed or file not found')
            return jsonify({'error': 'Failed to generate speech'}), 500
        
        print("✅ SUCCESS - Returning response")
        return jsonify({
            'session_id': session_id,
            'transcribed_text': user_message,
            'reply': assistant_reply,
            'audio_file': audio_file,
            'audio_url': f'/audio/{os.path.basename(audio_file)}'
        })
        
    except Exception as e:
        print("❌ EXCEPTION OCCURRED:")
        print(f"Error: {str(e)}")
        print("Full traceback:")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

 


@app.route('/audio/<filename>')
def serve_audio(filename):
    try:
        # Absolute path to audio file
        audio_path = os.path.join(os.getcwd(), 'static', 'audio', filename)
        print(f"🎵 Serving audio: {audio_path}")
        
        # Check if file exists
        if not os.path.exists(audio_path):
            print(f"❌ Audio file not found: {audio_path}")
            return "Not Found", 404
        
        # Serve the file directly
        return send_file(audio_path, mimetype='audio/mpeg')
        
    except Exception as e:
        print(f"❌ Audio serve error: {e}")
        return f"Error: {e}", 500




# =============================================================================
# WebSocket Events for Real-Time Voice Sessions
# =============================================================================

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connected', {
        'message': 'Connected to Zenith voice session server',
        'client_id': request.sid
    })

@socketio.on('start_session')
def handle_start_session(data):
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
    
    print(f'Starting voice session for client {client_id}: {session_duration} minutes')
    
    emit('session_started', {
        'message': f'Voice session started for {session_duration} minutes',
        'duration': session_duration,
        'session_id': db_session_id,
        'client_id': client_id
    })

@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    client_id = request.sid
    
    if client_id not in active_sessions:
        emit('error', {'message': 'No active session found'})
        return
    
    try:
        # TODO: Process audio chunk in real-time
        # This will be implemented in the next step
        print(f'Received audio chunk from client {client_id}')
        
        # For now, send acknowledgment
        emit('audio_received', {'status': 'processing'})
        
    except Exception as e:
        print(f'Error processing audio chunk: {e}')
        emit('error', {'message': f'Error processing audio: {str(e)}'})

@socketio.on('end_session')
def handle_end_session(data):
    client_id = request.sid
    
    if client_id in active_sessions:
        session_info = active_sessions[client_id]
        session_duration = time.time() - session_info['start_time']
        
        print(f'Ending voice session for client {client_id} after {session_duration:.1f} seconds')
        
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
    client_id = request.sid
    print(f'Client disconnected: {client_id}')
    
    # Clean up any active sessions
    if client_id in active_sessions:
        print(f'Cleaning up session for disconnected client {client_id}')
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
            print(f'Auto-ending expired session for client {client_id}')
            if client_id in active_sessions:
                del active_sessions[client_id]
            # Note: In a production environment, you'd want to notify the client
        
        time.sleep(30)  # Check every 30 seconds

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_expired_sessions, daemon=True)
cleanup_thread.start()

if __name__ == '__main__':
    print("🎙️ Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=8000)


