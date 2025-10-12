"""
AI Service - GROQ CLOUD OPTIMIZED (10x faster than local)
Uses Groq API for ultra-fast inference
"""

import os
import time
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class MentalHealthAI:
    """
    Singleton AI service using GROQ API for ultra-fast responses
    """
    _instance = None
    _client = None
    _is_initialized = False
    
    def __new__(cls):
        """Ensure only one instance exists (Singleton pattern)"""
        if cls._instance is None:
            print("🧠 Creating new AI service instance (Groq Cloud)...")
            cls._instance = super(MentalHealthAI, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Groq client only once"""
        if not MentalHealthAI._is_initialized:
            print("🔄 Initializing Groq API client...")
            self._initialize_groq()
            MentalHealthAI._is_initialized = True
            print("✅ Groq AI service ready! (Ultra-fast cloud inference)")
        else:
            print("♻️  Using existing Groq client")
    
    def _initialize_groq(self):
        """Initialize Groq API client"""
        api_key = os.getenv('GROQ_API_KEY')
        
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not found in environment variables!\n"
                "Please create a .env file in backend folder with:\n"
                "GROQ_API_KEY=your_key_here"
            )
        
        MentalHealthAI._client = Groq(api_key=api_key)
        print("✅ Groq client initialized successfully!")
    
    def _build_context(self, conversation_history):
        """Build conversation context for Groq"""
        if not conversation_history:
            return []
        
        # Convert to Groq chat format (only last 6 messages)
        messages = []
        recent_turns = conversation_history[-6:] if len(conversation_history) > 6 else conversation_history
        
        for turn in recent_turns:
            role = turn.get('role', 'unknown')
            message = turn.get('message', '')
            
            if role == 'user':
                messages.append({
                    "role": "user",
                    "content": message
                })
            elif role == 'assistant':
                messages.append({
                    "role": "assistant",
                    "content": message
                })
        
        return messages
    
    def generate_response(self, user_message, conversation_history=None):
        """
        Generate therapeutic response using Groq API (ULTRA FAST!)
        
        Args:
            user_message (str): User's input message
            conversation_history (list): Previous conversation turns
            
        Returns:
            str: AI's therapeutic response
        """
        total_start = time.time()
        
        if conversation_history is None:
            conversation_history = []
        
        # Build context
        context_start = time.time()
        context_messages = self._build_context(conversation_history)
        context_time = time.time() - context_start
        print(f"   ⏱️  Context building: {context_time:.3f}s")
        
        # System prompt for therapeutic responses
        system_message = {
            "role": "system",
            "content": """You are Zenith, a compassionate AI mental health companion.

Your role:
- Listen empathetically and validate emotions
- Provide supportive, non-judgmental responses
- Ask clarifying questions when helpful
- Keep responses warm and concise (2-4 sentences)
- Never diagnose or prescribe medication
- Encourage professional help for serious concerns"""
        }
        
        # Build complete messages array
        messages = [system_message] + context_messages + [{
            "role": "user",
            "content": user_message
        }]
        
        # Call Groq API (ULTRA FAST!)
        print("   🚀 Calling Groq API...")
        api_start = time.time()
        
        try:
            chat_completion = MentalHealthAI._client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",  # UPDATED: Latest, excellent quality
                temperature=0.7,
                max_tokens=150,
                top_p=0.9,
                stream=False
            )
            
            api_time = time.time() - api_start
            print(f"   ⏱️  Groq API call: {api_time:.3f}s ← SUPER FAST!")
            
            response_text = chat_completion.choices[0].message.content.strip()
            
            total_time = time.time() - total_start
            print(f"   ✅ Total AI generation: {total_time:.3f}s")
            
            return response_text
        
        except Exception as e:
            print(f"   ❌ Groq API Error: {str(e)}")
            # Fallback response
            return "I'm having trouble connecting right now. Could you please try again?"
    
    def generate_intro_response(self, user_name=None):
        """Generate warm introduction for new session"""
        print("🎭 Generating introduction via Groq...")
        
        if user_name:
            prompt = f"You are Zenith, a compassionate AI therapist. Greet {user_name} warmly in 2-3 sentences, introduce yourself, and ask how they're feeling today."
        else:
            prompt = "You are Zenith, a compassionate AI therapist. Introduce yourself warmly in 2-3 sentences and ask how the user is feeling today."
        
        try:
            chat_completion = MentalHealthAI._client.chat.completions.create(
                messages=[{
                    "role": "user",
                    "content": prompt
                }],
                model="llama-3.3-70b-versatile",  # UPDATED: Same model
                temperature=0.8,
                max_tokens=100
            )
            
            return chat_completion.choices[0].message.content.strip()
        
        except Exception as e:
            print(f"❌ Groq intro error: {str(e)}")
            return "Hello! I'm Zenith, your AI mental health companion. I'm here to listen and support you. How are you feeling today?"


# Create singleton instance
print("🚀 Initializing Groq-powered AI service...")
ai_service = MentalHealthAI()


def get_ai_service():
    """Get the singleton AI service instance"""
    return ai_service
