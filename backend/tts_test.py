import edge_tts
import asyncio
import pygame
import os

async def test_tts():
    # Generate speech
    communicate = edge_tts.Communicate("Hello! I'm your mental health assistant. How are you feeling today?", "en-US-AriaNeural")
    await communicate.save("test_response.wav")
    print("✅ TTS audio generated: test_response.wav")
    
    # Play the audio (optional)
    pygame.mixer.init()
    pygame.mixer.music.load("test_response.wav")
    pygame.mixer.music.play()
    
    # Wait for audio to finish
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)

# Run the test
asyncio.run(test_tts())
