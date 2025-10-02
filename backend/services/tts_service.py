import edge_tts
import asyncio
import os
import uuid

class TTSService:
    def __init__(self):
        self.voices = {
            "aria": "en-US-AriaNeural",
            "jenny": "en-US-JennyNeural",
            "ryan": "en-US-RyanMultilingualNeural"
        }
        self.current_voice = self.voices["jenny"]
        print("✅ TTS Service initialized with Jenny voice!")

    async def synthesize_async(self, text, voice):
        """Async method to generate TTS audio"""
        filename = f"response_{uuid.uuid4().hex[:8]}.mp3"
        directory = os.path.join("static", "audio")
        os.makedirs(directory, exist_ok=True)
        filepath = os.path.join(directory, filename)
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(filepath)
        return filepath

    def generate_speech(self, text, voice_name="jenny"):
        """Main method that Flask calls - THIS WAS MISSING"""
        try:
            voice = self.voices.get(voice_name, self.current_voice)
            filepath = asyncio.run(self.synthesize_async(text, voice))
            print(f"✅ TTS audio created: {filepath}")
            return filepath
        except Exception as e:
            print(f"❌ Error generating speech: {e}")
            import traceback
            traceback.print_exc()
            return None
