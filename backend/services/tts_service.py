"""
TTS Service - Edge TTS with Natural Voice Quality
Uses best neural voices with optimal settings for natural speech
"""
import os
import uuid
import ssl
import asyncio

# NUCLEAR OPTION: Monkey patch ssl module BEFORE anything else imports it
_original_create_default_context = ssl.create_default_context

def _create_unverified_context(*args, **kwargs):
    """Create SSL context with verification disabled"""
    context = _original_create_default_context(*args, **kwargs)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    return context

# Replace globally
ssl.create_default_context = _create_unverified_context
ssl._create_default_https_context = _create_unverified_context

print("🔓 SSL verification disabled globally (fixes Edge TTS cert issue)")


class TTSService:
    def __init__(self):
        # PREMIUM VOICES - Most natural sounding neural voices
        self.voices = {
            # English (US) - Most natural
            "aria": "en-US-AriaNeural",           # Young adult female, conversational
            "jenny": "en-US-JennyNeural",         # Professional, warm female
            "michelle": "en-US-MichelleNeural",   # Natural, friendly female
            "ana": "en-US-AnaNeural",             # Young, energetic female
            "emma": "en-US-EmmaNeural",           # Calm, soothing female
            "ashley": "en-US-AshleyNeural",       # Friendly, approachable female
            
            # Male voices
            "ryan": "en-US-RyanNeural",           # Natural male voice
            "eric": "en-US-EricNeural",           # Friendly male
            "guy": "en-US-GuyNeural",             # Conversational male
            
            # Multilingual (best for therapy/counseling)
            "ryan_multi": "en-US-RyanMultilingualNeural",  # Very natural multilingual male
            "andrew_multi": "en-US-AndrewMultilingualNeural",  # Expressive multilingual male
        }
        
        # Use Michelle for mental health - most empathetic and natural
        self.current_voice = self.voices["michelle"]
        
        # Try to import edge_tts AFTER ssl patch
        try:
            import edge_tts
            self.edge_tts = edge_tts
            print("✅ TTS Service initialized with Michelle (Premium Natural Voice)")
        except ImportError:
            print("❌ Edge TTS not installed. Install with: pip install edge-tts")
            raise ImportError("Please install Edge TTS: pip install edge-tts")

    async def synthesize_async(self, text, voice):
        """Generate speech with optimal settings for natural voice"""
        filename = f"response_{uuid.uuid4().hex[:8]}.mp3"
        directory = os.path.join("static", "audio")
        os.makedirs(directory, exist_ok=True)
        filepath = os.path.join(directory, filename)
        
        # Create communicate with optimal settings
        communicate = self.edge_tts.Communicate(
            text=text,
            voice=voice,
            rate="+0%",      # Normal speed (try -10% to +10% for variation)
            volume="+0%",    # Normal volume
            pitch="+0Hz"     # Normal pitch
        )
        
        await communicate.save(filepath)
        
        return filepath

    def generate_speech(self, text, voice_name="michelle"):
        """
        Main method that Flask calls
        
        Args:
            text: Text to convert to speech
            voice_name: Voice to use (michelle, aria, jenny, emma, ashley, ryan, etc.)
        """
        try:
            # Get voice, default to michelle if not found
            voice = self.voices.get(voice_name, self.current_voice)
            
            filepath = asyncio.run(self.synthesize_async(text, voice))
            print(f"✅ Edge TTS audio created: {filepath} (voice: {voice_name})")
            return filepath
            
        except Exception as e:
            print(f"❌ Error generating speech: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def set_voice(self, voice_name):
        """Change the default voice"""
        if voice_name in self.voices:
            self.current_voice = self.voices[voice_name]
            print(f"✅ Voice changed to: {voice_name}")
            return True
        else:
            print(f"❌ Voice '{voice_name}' not found")
            return False