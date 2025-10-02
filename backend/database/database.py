import sqlite3
import os
from datetime import datetime
import uuid

DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'mental_health.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    conn = get_db_connection()
    with open(os.path.join(os.path.dirname(__file__), 'schema.sql'), 'r') as f:
        conn.executescript(f.read())
    conn.close()
    print('✅ Database initialized successfully', flush=True)

def create_session(user_id='anonymous'):
    session_id = str(uuid.uuid4())
    conn = get_db_connection()
    conn.execute('INSERT INTO sessions (id, user_id) VALUES (?, ?)', (session_id, user_id))
    conn.commit()
    conn.close()
    return session_id

def save_turn(session_id, role, content):
    conn = get_db_connection()
    conn.execute('INSERT INTO turns (session_id, role, content) VALUES (?, ?, ?)', (session_id, role, content))
    conn.commit()
    conn.close()

def get_session_turns(session_id):
    conn = get_db_connection()
    cursor = conn.execute('SELECT role, content, timestamp FROM turns WHERE session_id = ? ORDER BY timestamp ASC', (session_id,))
    turns = cursor.fetchall()
    conn.close()
    return turns

if __name__ == '__main__':
    print(' Testing database functionality...', flush=True)
    init_database()
    s = create_session('test_user')
    save_turn(s, 'user', 'Hello, I need someone to talk to')
    save_turn(s, 'assistant', 'Hi there! I am here to listen and support you. What would you like to talk about?')
    turns = get_session_turns(s)
    print(' Test conversation:', flush=True)
    for t in turns:
        print(f'  {t["timestamp"]} - {t["role"]}: {t["content"]}', flush=True)
    print('✅ Database test completed successfully!', flush=True)
