from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import json

app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)

# Game state (in-memory for demo)
user_points = 0
completed_challenges = set()
challenge_cooldowns = {}  # Store challenge cooldowns

# Load completed challenges from file
COMPLETED_CHALLENGES_FILE = 'completed_challenges.json'

def load_completed_challenges():
    global completed_challenges
    try:
        if os.path.exists(COMPLETED_CHALLENGES_FILE):
            with open(COMPLETED_CHALLENGES_FILE, 'r') as f:
                completed_list = json.load(f)
                completed_challenges = set(completed_list)
    except Exception as e:
        print(f"Error loading completed challenges: {e}")

def save_completed_challenges():
    try:
        with open(COMPLETED_CHALLENGES_FILE, 'w') as f:
            json.dump(list(completed_challenges), f)
    except Exception as e:
        print(f"Error saving completed challenges: {e}")

# Load completed challenges at startup
load_completed_challenges()

def get_challenge_list():
    return [
        {
            'id': 1,
            'title': 'Hello World',
            'description': 'Write a program that prints "Hello, World!"',
            'type': 'coding',
            'difficulty': 'easy',
            'points': 10,
            'correct': None
        },
        {
            'id': 2,
            'title': 'Python Basics',
            'description': 'What is the correct way to create a variable in Python?',
            'type': 'quiz',
            'difficulty': 'easy',
            'points': 5,
            'options': [
                'var x = 5',
                'x := 5',
                'x = 5',
                'let x = 5'
            ],
            'correct': 2
        },
        {
            'id': 3,
            'title': 'List Reversal',
            'description': 'Write code to reverse a list in Python',
            'type': 'coding',
            'difficulty': 'easy',
            'points': 15,
            'correct': None
        },
        {
            'id': 4,
            'title': 'Data Types',
            'description': 'Which of these is a mutable data type in Python?',
            'type': 'quiz',
            'difficulty': 'easy',
            'points': 5,
            'options': [
                'tuple',
                'string',
                'list',
                'int'
            ],
            'correct': 2
        },
        {
            'id': 5,
            'title': 'FizzBuzz',
            'description': 'Write a FizzBuzz solution that prints Fizz for multiples of 3, Buzz for multiples of 5, and FizzBuzz for multiples of both',
            'type': 'coding',
            'difficulty': 'medium',
            'points': 20,
            'correct': None
        },
        {
            'id': 6,
            'title': 'List Comprehension',
            'description': 'Which is a valid list comprehension in Python?',
            'type': 'quiz',
            'difficulty': 'medium',
            'points': 10,
            'options': [
                'list(x for x in range(10))',
                '[x in range(10)]',
                '[for x in range(10)]',
                '[x if x > 5 for x in range(10)]'
            ],
            'correct': 0
        },
        {
            'id': 7,
            'title': 'Palindrome Check',
            'description': 'Write a function that checks if a string is a palindrome',
            'type': 'coding',
            'difficulty': 'medium',
            'points': 25,
            'correct': None
        },
        {
            'id': 8,
            'title': 'Python Decorators',
            'description': 'What is the correct syntax for a decorator in Python?',
            'type': 'quiz',
            'difficulty': 'medium',
            'points': 15,
            'options': [
                '#decorator',
                '@decorator',
                '$decorator',
                '&decorator'
            ],
            'correct': 1
        },
        {
            'id': 9,
            'title': 'Array Sum',
            'description': 'Write a function to find the sum of all numbers in an array',
            'type': 'coding',
            'difficulty': 'medium',
            'points': 20,
            'correct': None
        },
        {
            'id': 10,
            'title': 'Exception Handling',
            'description': 'Which keyword is used to handle exceptions in Python?',
            'type': 'quiz',
            'difficulty': 'medium',
            'points': 10,
            'options': [
                'catch',
                'handle',
                'try',
                'error'
            ],
            'correct': 2
        },
        {
            'id': 11,
            'title': 'String Compression',
            'description': 'Write a function that performs basic string compression using counts of repeated characters',
            'type': 'coding',
            'difficulty': 'hard',
            'points': 30,
            'correct': None
        },
        {
            'id': 12,
            'title': 'Python GIL',
            'description': 'What does GIL stand for in Python?',
            'type': 'quiz',
            'difficulty': 'hard',
            'points': 15,
            'options': [
                'General Interface Lock',
                'Global Interpreter Lock',
                'Generic Input Lock',
                'Group Instruction Lock'
            ],
            'correct': 1
        },
        {
            'id': 13,
            'title': 'Binary Search',
            'description': 'Implement a binary search algorithm',
            'type': 'coding',
            'difficulty': 'hard',
            'points': 35,
            'correct': None
        },
        {
            'id': 14,
            'title': 'Python Memory',
            'description': 'Which statement about Python memory management is correct?',
            'type': 'quiz',
            'difficulty': 'hard',
            'points': 15,
            'options': [
                'Python has no garbage collection',
                'Python uses reference counting and garbage collection',
                'Python only uses manual memory management',
                'Python has no memory management'
            ],
            'correct': 1
        },
        {
            'id': 15,
            'title': 'Anagram Check',
            'description': 'Write a function to check if two strings are anagrams',
            'type': 'coding',
            'difficulty': 'hard',
            'points': 30,
            'correct': None
        },
        {
            'id': 16,
            'title': 'Python Scope',
            'description': 'What is the LEGB rule in Python?',
            'type': 'quiz',
            'difficulty': 'hard',
            'points': 15,
            'options': [
                'Local Enclosed Global Built-in',
                'Loop Extend Generate Build',
                'List Enumerate Generate Break',
                'Lambda Extend Generate Build'
            ],
            'correct': 0
        },
        {
            'id': 17,
            'title': 'Prime Numbers',
            'description': 'Write a function to check if a number is prime',
            'type': 'coding',
            'difficulty': 'hard',
            'points': 35,
            'correct': None
        },
        {
            'id': 18,
            'title': 'Python Threading',
            'description': 'Which module is used for threading in Python?',
            'type': 'quiz',
            'difficulty': 'hard',
            'points': 15,
            'options': [
                'thread',
                'threading',
                'threader',
                'threads'
            ],
            'correct': 1
        },
        {
            'id': 19,
            'title': 'Matrix Transpose',
            'description': 'Write a function to transpose a matrix',
            'type': 'coding',
            'difficulty': 'hard',
            'points': 40,
            'correct': None
        },
        {
            'id': 20,
            'title': 'Python Generators',
            'description': 'What keyword is used to create a generator in Python?',
            'type': 'quiz',
            'difficulty': 'hard',
            'points': 15,
            'options': [
                'gen',
                'generate',
                'yield',
                'return'
            ],
            'correct': 2
        }
    ]

@app.route('/')
def serve_static():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/challenges')
def get_challenges():
    """Get all challenges with their completion status."""
    challenges = get_challenge_list()
    
    # Add completion status to each challenge
    for challenge in challenges:
        challenge['completed'] = challenge['id'] in completed_challenges
        cooldown = challenge_cooldowns.get(challenge['id'])
        if cooldown:
            challenge['locked_until'] = cooldown
    
    return jsonify(challenges)

@app.route('/api/submit', methods=['POST'])
def submit_challenge():
    data = request.get_json()
    if not data or 'challengeId' not in data:
        return jsonify({'error': 'Invalid request data'}), 400
    
    challenge_id = data['challengeId']
    challenge = next((c for c in get_challenge_list() if c['id'] == challenge_id), None)
    
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404
    
    # Check if challenge is already completed
    if challenge_id in completed_challenges:
        return jsonify({
            'error': 'Challenge already completed',
            'completed': True,
            'points': challenge['points']
        }), 409
    
    # Check cooldown
    cooldown = challenge_cooldowns.get(challenge_id)
    if cooldown and datetime.fromisoformat(cooldown) > datetime.now():
        return jsonify({
            'error': 'Challenge is locked',
            'locked_until': cooldown
        }), 423
    
    # Handle quiz challenges
    if challenge['type'] == 'quiz':
        if 'answer' not in data:
            return jsonify({'error': 'No answer provided'}), 400
            
        is_correct = data['answer'] == challenge['correct']
        if is_correct:
            completed_challenges.add(challenge_id)
            save_completed_challenges()  # Save to file
            return jsonify({
                'correct': True,
                'points': challenge['points'],
                'message': 'Correct answer!'
            })
        else:
            # Set 24-hour cooldown
            locked_until = (datetime.now() + timedelta(hours=24)).isoformat()
            challenge_cooldowns[challenge_id] = locked_until
            return jsonify({
                'correct': False,
                'message': 'Incorrect answer',
                'locked_until': locked_until
            })
    
    # Handle coding challenges
    if 'code' not in data:
        return jsonify({'error': 'No code provided'}), 400
        
    code = data['code'].strip()
    if not code:
        return jsonify({'error': 'Empty code submission'}), 400
    
    # Evaluate code
    try:
        is_correct = evaluate_code(code, challenge)
        if is_correct:
            completed_challenges.add(challenge_id)
            save_completed_challenges()  # Save to file
            return jsonify({
                'correct': True,
                'points': challenge['points'],
                'message': 'Correct solution!'
            })
        else:
            # Set 24-hour cooldown
            locked_until = (datetime.now() + timedelta(hours=24)).isoformat()
            challenge_cooldowns[challenge_id] = locked_until
            return jsonify({
                'correct': False,
                'message': 'Incorrect solution',
                'locked_until': locked_until
            })
    except Exception as e:
        return jsonify({
            'error': 'Error evaluating code',
            'message': str(e)
        }), 500

def evaluate_code(code, challenge):
    """Evaluate submitted code for coding challenges."""
    try:
        if challenge['id'] == 1:  # Hello World
            return 'Hello, World!' in code
        elif challenge['id'] == 3:  # List Reversal
            return '[::-1]' in code or 'reverse' in code
        elif challenge['id'] == 5:  # FizzBuzz
            return all(x in code for x in ['Fizz', 'Buzz']) and \
                   ('%3' in code or '% 3' in code) and \
                   ('%5' in code or '% 5' in code)
        elif challenge['id'] == 7:  # Palindrome
            code = code.lower()
            return 'return' in code and \
                   ('[::-1]' in code or 'reverse' in code)
        elif challenge['id'] == 9:  # Array Sum
            return 'sum(' in code or \
                   ('for' in code and '+=' in code) or \
                   'reduce' in code
        elif challenge['id'] == 11:  # String Compression
            return 'count' in code and 'str' in code and \
                   ('join' in code or '+=' in code)
        elif challenge['id'] == 13:  # Binary Search
            return 'while' in code and \
                   ('mid' in code or 'middle' in code) and \
                   'return' in code and '<' in code and '>' in code
        elif challenge['id'] == 15:  # Anagram Check
            return ('sort' in code and '==' in code) or \
                   ('count' in code and 'dict' in code)
        elif challenge['id'] == 17:  # Prime Numbers
            return 'range' in code and '%' in code and \
                   'return' in code and \
                   ('True' in code or 'true' in code)
        elif challenge['id'] == 19:  # Matrix Transpose
            return ('zip' in code or \
                   ('for' in code and 'range' in code)) and \
                   '[' in code and ']' in code
        return False
    except Exception as e:
        print(f"Error evaluating code: {e}")
        return False

@app.route('/api/user_stats')
def get_user_stats():
    return jsonify({
        'points': user_points,
        'completed_challenges': list(completed_challenges)
    })

if __name__ == '__main__':
    app.run(debug=True)
