# CodeQuest Browser

A web-based coding challenge platform that helps users learn programming concepts through interactive quizzes and coding challenges.

## Features

- Interactive coding challenges and quizzes
- Points system with persistent progress
- Challenge difficulty levels (Easy, Medium, Hard)
- Challenge types (Coding, Quiz)
- Cooldown system to prevent challenge replay
- Filter challenges by difficulty and type
- Sort challenges by points
- Modern, responsive UI with Tailwind CSS

## Getting Started

1. Make sure you have Python installed on your system
2. Clone this repository
3. Install dependencies:
   ```bash
   pip install flask flask-cors
   ```
4. Run the server:
   ```bash
   python app.py
   ```
5. Open http://localhost:5000 in your browser

## Challenge Types

### Coding Challenges
- Write code to solve programming problems
- Test your implementation against test cases
- Earn points based on difficulty

### Quiz Challenges
- Test your knowledge of programming concepts
- Multiple choice questions
- Quick and interactive

## Points System

- Easy challenges: 5-10 points
- Medium challenges: 15-25 points
- Hard challenges: 30-40 points
- Points persist across sessions
- Completed challenges cannot be replayed

## Development

Built with:
- Frontend: HTML, JavaScript, Tailwind CSS
- Backend: Python Flask
- Local Storage for persistence
