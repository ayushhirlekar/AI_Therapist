# services/voice_service.py (Fixed version)
import whisper
import os

class VoiceService:
    def __init__(self):
        print("Loading Whisper model...", flush=True)
        self.model = whisper.load_model("small")
        print("Whisper loaded!", flush=True)

    def transcribe_audio(self, audio_path):
        result = self.model.transcribe(audio_path)
        return result["text"].strip()

# Test the class in the same file
if __name__ == "__main__":
    service = VoiceService()
    text = service.transcribe_audio('test_audio.wav')
    print(f"Test result: {text}")
