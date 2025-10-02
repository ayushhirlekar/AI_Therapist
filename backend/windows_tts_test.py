import pyttsx3

def test_windows_tts():
    try:
        print("Testing Windows built-in TTS...")
        engine = pyttsx3.init()
        
        # Set properties for Gen Z friendly voice
        voices = engine.getProperty('voices')
        if len(voices) > 1:
            engine.setProperty('voice', voices[1].id)  # Usually female voice
        
        engine.setProperty('rate', 180)  # Speech rate
        
        # Save to file
        engine.save_to_file("Hello! I'm your mental health assistant. How are you feeling today?", "windows_tts_test.wav")
        engine.runAndWait()
        
        print("✅ Windows TTS audio generated: windows_tts_test.wav")
        
    except Exception as e:
        print(f"❌ Windows TTS failed: {e}")

test_windows_tts()
