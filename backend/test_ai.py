from services.ai_service import MentalHealthAI

print("🧪 Testing AI Service...", flush=True)
ai = MentalHealthAI()

test_message = "I'm feeling really anxious about work lately"
response = ai.generate_response(test_message)

print(f"User: {test_message}", flush=True)
print(f"AI: {response}", flush=True)
