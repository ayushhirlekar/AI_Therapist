import edge_tts
import asyncio

async def test_tts():
    print("Running TTS test...")
    try:
        communicate = edge_tts.Communicate("Hello! This is a test.", "en-US-AriaNeural")
        await communicate.save("test_response.wav")
        print("TTS audio generated: test_response.wav")
    except Exception as e:
        print(f"Error in TTS: {e}")

asyncio.run(test_tts())
