from llama_cpp import Llama
import os

class MentalHealthAI:
    def __init__(self):
        # Path to your downloaded model
        model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'mistral-7b-instruct-v0.2.Q4_0.gguf')
        
        # Check if model file exists
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        # Load the AI model
        print(" Loading AI model... (this takes 30-60 seconds)", flush=True)
        self.llm = Llama(
            model_path=model_path,
            n_ctx=4096,  # Context window
            n_threads=4,  # CPU threads
            verbose=False
        )
        print("✅ AI model loaded successfully!", flush=True)
    
    def generate_response(self, user_message, conversation_history=[]):
        """Generate empathetic mental health response"""
        
        # Create conversation context
        context = "You are a mental health genz therapist . Provide supportive, empathetic responses just like a friend . Keep responses acocordingly try to keep it short .\n\n"
        
        # Add recent conversation history
        for turn in conversation_history[-4:]:  # Last 4 messages for context
            if turn['role'] == 'user':
                context += f"Human: {turn['content']}\n"
            else:
                context += f"Assistant: {turn['content']}\n"
        
        # Add current message
        context += f"Human: {user_message}\nAssistant:"
        
        # Generate AI response
        response = self.llm(
            context,
            max_tokens=150,
            temperature=0.7,
            top_p=0.9,
            stop=["Human:", "\n\n"]
        )
        
        return response['choices'][0]['text'].strip()
