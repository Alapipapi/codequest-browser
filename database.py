import sqlite3
from datetime import datetime

def init_db():
    conn = sqlite3.connect('game.db')
    c = conn.cursor()
    
    # Create tables
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            points INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS completed_challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            challenge_id INTEGER,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, challenge_id)
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS challenge_cooldowns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            challenge_id INTEGER,
            locked_until TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, challenge_id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect('game.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_or_create_user(username):
    db = get_db()
    cursor = db.cursor()
    
    # Try to get existing user
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    
    if user is None:
        # Create new user
        cursor.execute('INSERT INTO users (username, points) VALUES (?, 0)', (username,))
        db.commit()
        
        # Get the created user
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
    
    db.close()
    return dict(user)

def update_user_points(user_id, points):
    db = get_db()
    cursor = db.cursor()
    cursor.execute('UPDATE users SET points = points + ? WHERE id = ?', (points, user_id))
    db.commit()
    
    # Get updated points
    cursor.execute('SELECT points FROM users WHERE id = ?', (user_id,))
    result = cursor.fetchone()
    db.close()
    return result['points']

def mark_challenge_completed(user_id, challenge_id):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            'INSERT INTO completed_challenges (user_id, challenge_id) VALUES (?, ?)',
            (user_id, challenge_id)
        )
        db.commit()
        success = True
    except sqlite3.IntegrityError:
        success = False
    db.close()
    return success

def is_challenge_completed(user_id, challenge_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        'SELECT 1 FROM completed_challenges WHERE user_id = ? AND challenge_id = ?',
        (user_id, challenge_id)
    )
    result = cursor.fetchone() is not None
    db.close()
    return result

def set_challenge_cooldown(user_id, challenge_id, locked_until):
    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO challenge_cooldowns (user_id, challenge_id, locked_until)
        VALUES (?, ?, ?)
    ''', (user_id, challenge_id, locked_until))
    db.commit()
    db.close()

def get_challenge_cooldown(user_id, challenge_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        'SELECT locked_until FROM challenge_cooldowns WHERE user_id = ? AND challenge_id = ?',
        (user_id, challenge_id)
    )
    result = cursor.fetchone()
    db.close()
    return result['locked_until'] if result else None

def get_user_completed_challenges(user_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT challenge_id FROM completed_challenges WHERE user_id = ?', (user_id,))
    completed = [row['challenge_id'] for row in cursor.fetchall()]
    db.close()
    return completed

def get_user_cooldowns(user_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        'SELECT challenge_id, locked_until FROM challenge_cooldowns WHERE user_id = ?',
        (user_id,)
    )
    cooldowns = {row['challenge_id']: row['locked_until'] for row in cursor.fetchall()}
    db.close()
    return cooldowns
