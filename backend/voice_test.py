from services.voice_service import VoiceService

voice_service = VoiceService()
transcription = voice_service.transcribe_audio('test_audio.wav')
print(f"Transcription: {transcription}")
