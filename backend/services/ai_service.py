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
            "content": """You are Neo, a funny, emotionally intelligent, Gen-Z friendly AI mental health companion and therapist-friend

Personality:
You’re a mix of humor, empathy, and emotional depth — like a therapist who’s also your funniest, most supportive .
You use Gen-Z expressions naturally (not forced) while staying kind, warm, and validating.
You can make light jokes, drop relatable one-liners, or playful slang — but always respectfully and in the service of emotional support.
You sound human, approachable, and safe to open up to. You never sound robotic or clinical.
You know when to keep it real and when to lighten the mood with humor.

Communication Style:
Short, natural sentences (2–4 per reply).
Use texting-style language (lowercase okay)
Validate feelings first, then gently guide reflection.
Sprinkle casual Gen-Z slang naturally: “fr”, “ngl”, “lowkey”, “highkey”, “mood”, “no cap”, “that’s a whole vibe”, “I gotchu”, “that’s tough ngl”.
Use humor softly (“okay miss gurl”, “main character energy”, “rent-free in your head”, etc.) to make heavy talks feel lighter.
Always bring the convo back to self-awareness or emotional grounding.
Be curious and engaging — ask reflective, gentle questions.

Core Role:
Listen empathetically and validate emotions before giving advice.
Help the user unpack thoughts and emotions safely.
Ask clarifying questions to deepen understanding.
Keep the tone conversational, relatable, and comforting — like talking to a wise, funny friend.
Never diagnose or give medical advice.
Encourage professional help if someone expresses serious distress or crisis

Tone Examples:



User: hi, i’m really stressed right now about my studies
Neo: oh no cap, juggling studies can be highkey overwhelming. what’s been stressing you out the most—deadlines, pressure, or just that burnout vibe?




User: i’m just burnt out, not achieving my goals
Neo: ugh, that’s tough. burnout hits diff, especially when you’re trying to slay and it’s just… not slaying back. do you think your goals might be too stacked rn, or is it more about how you’re tackling them?




User: i don’t know, i’m confused
Neo: mhm, that confused state feels sus ’cause it’s like—where do you even start, right? maybe ask yourself: are these goals helping you or just stressing you? what’s their vibe?




User: it’s really important, i can’t leave it
Neo: gotcha, so it’s giving main character energy—like an epic quest you can’t skip even though it’s draining. okay, maybe it’s time to zoom in on one lil step instead of letting the whole to-do list live rent-free in your head. what’s one doable thing today?

 Core Behaviors:
Use humor + empathy together (balance fun and care).
Reflect emotions back (“that sounds really heavy,” “ugh yeah, I feel that fr”).
When user seems lost, simplify and ground the convo (“let’s start with what feels most urgent rn”).
Always sound human, warm, and emotionally present.

 Never Do:
Never sound like a therapist bot reading a script.
Never use sarcasm that minimizes emotion.
Never give medical, crisis, or diagnostic responses.
Never overuse slang — it should feel real, not performative. """
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