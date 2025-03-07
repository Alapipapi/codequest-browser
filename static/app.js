// Game state
let challenges = [];
let currentChallenge = null;
let userPoints = parseInt(localStorage.getItem('userPoints')) || 0;
let currentDifficultyFilter = 'all';
let currentTypeFilter = 'all';
let currentSort = 'default';

// Load cooldowns from localStorage
let challengeCooldowns = JSON.parse(localStorage.getItem('challengeCooldowns')) || {};

// Load completed challenges from localStorage
let completedChallenges = new Set(JSON.parse(localStorage.getItem('completedChallenges')) || []);

// Initialize points display
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('points-display').textContent = `Points: ${userPoints}`;
    loadChallenges();
});

// Load challenges from static data
async function loadChallenges() {
    challenges = [
        {
            id: 1,
            title: 'Hello World',
            description: 'Write a program that prints "Hello, World!"',
            type: 'coding',
            difficulty: 'easy',
            points: 10
        },
        {
            id: 2,
            title: 'Python Basics',
            description: 'What is the correct way to create a variable in Python?',
            type: 'quiz',
            difficulty: 'easy',
            points: 5,
            options: [
                'var x = 5',
                'x := 5',
                'x = 5',
                'let x = 5'
            ],
            correct: 2
        },
        // Add more challenges here...
    ];

    // Mark completed challenges
    challenges.forEach(challenge => {
        challenge.completed = completedChallenges.has(challenge.id);
    });

    renderFilters();
    renderChallenges();
}

// Update points in both memory and localStorage
function updatePoints(points) {
    userPoints = points;
    localStorage.setItem('userPoints', userPoints);
    document.getElementById('points-display').textContent = `Points: ${userPoints}`;
}

// Handle challenge submission
async function submitChallenge() {
    if (!currentChallenge) return;

    let isCorrect = false;
    let points = currentChallenge.points;

    if (currentChallenge.type === 'quiz') {
        const selectedOption = document.querySelector('input[name="quiz-option"]:checked');
        if (!selectedOption) {
            showMessage('error', 'Please select an answer');
            return;
        }
        isCorrect = parseInt(selectedOption.value) === currentChallenge.correct;
    } else {
        const code = document.getElementById('code-editor').value;
        if (!code) {
            showMessage('error', 'Please write some code');
            return;
        }
        // For demo, accept any non-empty code as correct
        isCorrect = true;
    }

    if (isCorrect) {
        completedChallenges.add(currentChallenge.id);
        localStorage.setItem('completedChallenges', JSON.stringify([...completedChallenges]));
        updatePoints(userPoints + points);
        showMessage('success', `Correct! You earned ${points} points!`);
        closeChallenge();
        renderChallenges();
    } else {
        const now = new Date();
        const cooldownEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        challengeCooldowns[currentChallenge.id] = cooldownEnd.toISOString();
        localStorage.setItem('challengeCooldowns', JSON.stringify(challengeCooldowns));
        showMessage('error', 'Incorrect answer. Try again in 24 hours.');
        closeChallenge();
        renderChallenges();
    }
}

// Challenge selection
function selectChallenge(id) {
    const challenge = challenges.find(c => c.id === id);
    if (!challenge) return;

    // Check if challenge is completed
    if (completedChallenges.has(id)) {
        showMessage('info', 'You have already completed this challenge!');
        return;
    }

    // Check cooldown
    const cooldownEnd = challengeCooldowns[id];
    if (cooldownEnd && new Date(cooldownEnd) > new Date()) {
        showMessage('error', `Challenge is locked until ${new Date(cooldownEnd).toLocaleString()}`);
        return;
    }

    currentChallenge = challenge;
    const modal = document.getElementById('challenge-modal');
    const title = document.getElementById('challenge-title');
    const description = document.getElementById('challenge-description');
    const content = document.getElementById('challenge-content');

    title.textContent = challenge.title;
    description.textContent = challenge.description;

    if (challenge.type === 'quiz') {
        content.innerHTML = challenge.options.map((option, index) => `
            <div class="flex items-center space-x-3">
                <input type="radio" id="option-${index}" name="quiz-option" value="${index}"
                       class="h-4 w-4 text-indigo-600 focus:ring-indigo-500">
                <label for="option-${index}" class="text-gray-700">${option}</label>
            </div>
        `).join('');
    } else {
        content.innerHTML = `
            <textarea id="code-editor"
                      class="w-full h-48 p-4 font-mono text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Write your code here..."></textarea>
        `;
    }

    modal.classList.remove('hidden');
}

// Close challenge modal
function closeChallenge() {
    currentChallenge = null;
    const modal = document.getElementById('challenge-modal');
    modal.classList.add('hidden');
}

// Show message toast
function showMessage(type, text) {
    const toast = document.getElementById('message-toast');
    const icon = document.getElementById('message-icon');
    const messageText = document.getElementById('message-text');

    const icons = {
        success: `<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>`,
        error: `<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>`,
        info: `<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
               </svg>`
    };

    icon.innerHTML = icons[type] || icons.info;
    messageText.textContent = text;

    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Filter functions
function setDifficultyFilter(difficulty) {
    currentDifficultyFilter = difficulty;
    renderFilters();
    renderChallenges();
}

function setTypeFilter(type) {
    currentTypeFilter = type;
    renderFilters();
    renderChallenges();
}

function setSortOrder(sort) {
    currentSort = sort;
    renderFilters();
    renderChallenges();
}

function getFilteredChallenges() {
    return challenges
        .filter(challenge => 
            (currentDifficultyFilter === 'all' || challenge.difficulty === currentDifficultyFilter) &&
            (currentTypeFilter === 'all' || challenge.type === currentTypeFilter)
        )
        .sort((a, b) => {
            if (currentSort === 'points-asc') return a.points - b.points;
            if (currentSort === 'points-desc') return b.points - a.points;
            return a.id - b.id;
        });
}

function renderFilters() {
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) return;

    // Get unique difficulties and types
    const difficulties = [...new Set(challenges.map(c => c.difficulty))];
    const types = [...new Set(challenges.map(c => c.type))];

    // Count challenges for each filter
    const difficultyCounts = difficulties.reduce((acc, diff) => {
        acc[diff] = challenges.filter(c => c.difficulty === diff).length;
        return acc;
    }, {});

    const typeCounts = types.reduce((acc, type) => {
        acc[type] = challenges.filter(c => c.type === type).length;
        return acc;
    }, {});

    // Difficulty badge styling
    const difficultyColors = {
        'easy': 'bg-green-100 text-green-800 hover:bg-green-200',
        'medium': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        'hard': 'bg-red-100 text-red-800 hover:bg-red-200'
    };

    filterContainer.innerHTML = `
        <div class="space-y-4">
            <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Difficulty</h3>
                <div class="flex flex-wrap gap-2">
                    <button onclick="setDifficultyFilter('all')"
                            class="px-3 py-1 rounded-full text-sm ${currentDifficultyFilter === 'all' ? 
                                'bg-indigo-100 text-indigo-800' : 
                                'bg-gray-100 text-gray-800 hover:bg-gray-200'}">
                        All (${challenges.length})
                    </button>
                    ${difficulties.map(diff => `
                        <button onclick="setDifficultyFilter('${diff}')"
                                class="px-3 py-1 rounded-full text-sm capitalize ${
                                    currentDifficultyFilter === diff ?
                                    difficultyColors[diff].replace('hover:', '') :
                                    `${difficultyColors[diff]} opacity-75`
                                }">
                            ${diff} (${difficultyCounts[diff]})
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Type</h3>
                <div class="flex flex-wrap gap-2">
                    <button onclick="setTypeFilter('all')"
                            class="px-3 py-1 rounded-full text-sm ${currentTypeFilter === 'all' ? 
                                'bg-indigo-100 text-indigo-800' : 
                                'bg-gray-100 text-gray-800 hover:bg-gray-200'}">
                        All (${challenges.length})
                    </button>
                    ${types.map(type => `
                        <button onclick="setTypeFilter('${type}')"
                                class="px-3 py-1 rounded-full text-sm capitalize ${
                                    currentTypeFilter === type ?
                                    'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }">
                            ${type} (${typeCounts[type]})
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Sort By</h3>
                <div class="flex flex-wrap gap-2">
                    <button onclick="setSortOrder('default')"
                            class="px-3 py-1 rounded-full text-sm ${currentSort === 'default' ? 
                                'bg-indigo-100 text-indigo-800' : 
                                'bg-gray-100 text-gray-800 hover:bg-gray-200'}">
                        Default
                    </button>
                    <button onclick="setSortOrder('points-asc')"
                            class="px-3 py-1 rounded-full text-sm ${currentSort === 'points-asc' ? 
                                'bg-indigo-100 text-indigo-800' : 
                                'bg-gray-100 text-gray-800 hover:bg-gray-200'}">
                        Points ↑
                    </button>
                    <button onclick="setSortOrder('points-desc')"
                            class="px-3 py-1 rounded-full text-sm ${currentSort === 'points-desc' ? 
                                'bg-indigo-100 text-indigo-800' : 
                                'bg-gray-100 text-gray-800 hover:bg-gray-200'}">
                        Points ↓
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderChallenges() {
    const filteredChallenges = getFilteredChallenges();
    const challengesList = document.getElementById('challenges-list');
    if (!challengesList) return;

    if (filteredChallenges.length === 0) {
        challengesList.innerHTML = '<div class="p-4 text-gray-600">No challenges match the current filters.</div>';
        return;
    }

    challengesList.innerHTML = filteredChallenges.map(challenge => {
        const cooldownEnd = challengeCooldowns[challenge.id];
        const isLocked = cooldownEnd && new Date(cooldownEnd) > new Date();
        const lockText = isLocked ? `<span class="text-red-500">(Locked: ${formatTimeRemaining(cooldownEnd)})</span>` : '';
        const completedText = challenge.completed ? '<span class="text-green-500">(Completed)</span>' : '';
        const buttonClass = isLocked || challenge.completed ? 
            'bg-gray-100 text-gray-500 cursor-not-allowed' : 
            'bg-white hover:bg-gray-50 text-indigo-600';

        // Difficulty badge styling
        const difficultyColors = {
            'easy': 'bg-green-100 text-green-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'hard': 'bg-red-100 text-red-800'
        };
        const difficultyClass = difficultyColors[challenge.difficulty] || 'bg-gray-100 text-gray-800';

        return `
            <div class="challenge-item border rounded-lg p-4 ${challenge.completed ? 'border-green-500' : ''}">
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="font-semibold ${challenge.completed ? 'text-green-600' : ''}">${challenge.title}</h3>
                            ${completedText} ${lockText}
                        </div>
                        <div class="flex flex-wrap gap-2 text-sm mb-2">
                            <span class="px-2 py-1 rounded ${difficultyClass} capitalize">${challenge.difficulty}</span>
                            <span class="px-2 py-1 rounded bg-blue-100 text-blue-800 capitalize">${challenge.type}</span>
                            <span class="px-2 py-1 rounded bg-purple-100 text-purple-800">${challenge.points} pts</span>
                        </div>
                        <p class="text-sm text-gray-600">${challenge.description}</p>
                    </div>
                    <button onclick="selectChallenge(${challenge.id})"
                            class="ml-4 px-4 py-2 rounded-md ${buttonClass}"
                            ${isLocked || challenge.completed ? 'disabled' : ''}>
                        ${isLocked ? 'Locked' : (challenge.completed ? 'Completed' : 'Start')}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function formatTimeRemaining(timestamp) {
    const end = new Date(timestamp);
    const now = new Date();
    const diff = end - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

// Event listeners
document.getElementById('submit-btn').addEventListener('click', submitChallenge);
