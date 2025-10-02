import whisper

print("Loading Whisper model...", flush=True)
model = whisper.load_model("small")
print("Model loaded successfully!", flush=True)

result = model.transcribe('test_audio.wav')
print(f"Transcription: {result['text']}")
