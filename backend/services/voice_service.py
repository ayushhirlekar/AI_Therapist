"""
Voice Service - GROQ OPTIMIZED for ultra-fast transcription
"""

import os
from groq import Groq
from dotenv import load_dotenv
import time

load_dotenv()


class VoiceService:
    """
    Voice transcription service using Groq Whisper API (10x faster than local)
    """
    
    def __init__(self):
        """Initialize Groq client for Whisper"""
        print("🎤 Initializing Groq Whisper service...")
        
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in .env file")
        
        self.client = Groq(api_key=api_key)
        print("✅ Groq Whisper ready!")
    
    def transcribe_audio(self, audio_path):
        """
        Transcribe audio file using Groq Whisper API (ULTRA FAST!)
        
        Args:
            audio_path (str): Path to audio file
            
        Returns:
            str: Transcribed text
        """
        print(f"🎧 Transcribing with Groq Whisper: {audio_path}")
        start_time = time.time()
        
        try:
            # Open and send audio file to Groq
            with open(audio_path, "rb") as audio_file:
                transcription = self.client.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-large-v3",  # Best accuracy
                    response_format="text",
                    language="en"  # Specify if you know the language
                )
            
            elapsed = time.time() - start_time
            print(f"✅ Groq transcription completed in {elapsed:.3f}s")
            
            return transcription.strip()
        
        except Exception as e:
            print(f"❌ Groq transcription error: {str(e)}")
            return ""
