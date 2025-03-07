// Game state
let challenges = [];
let currentChallenge = null;
let currentDifficultyFilter = 'all';
let currentTypeFilter = 'all';
let currentSort = 'default';

// Initialize game
async function initializeGame() {
    try {
        // Get user data
        const userResponse = await fetch('/api/user');
        const userData = await userResponse.json();
        if (userData.points !== undefined) {
            document.getElementById('points-display').textContent = `Points: ${userData.points}`;
        }

        // Get challenges
        const challengesResponse = await fetch('/api/challenges');
        challenges = await challengesResponse.json();
        
        // Render UI
        renderFilters();
        renderChallenges();
    } catch (error) {
        console.error('Error initializing game:', error);
        showMessage('error', 'Failed to initialize game. Please refresh the page.');
    }
}

// Challenge submission
async function submitChallenge() {
    if (!currentChallenge) return;

    let data = {
        challengeId: currentChallenge.id
    };

    if (currentChallenge.type === 'quiz') {
        const selectedAnswer = document.querySelector('input[name="quiz-answer"]:checked');
        if (!selectedAnswer) {
            showMessage('error', 'Please select an answer');
            return;
        }
        data.answer = parseInt(selectedAnswer.value);
    } else {
        const codeEditor = document.getElementById('code-editor');
        if (!codeEditor || !codeEditor.value.trim()) {
            showMessage('error', 'Please write some code');
            return;
        }
        data.code = codeEditor.value;
    }

    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            if (result.correct) {
                showMessage('success', `${result.message} +${result.points} points!`);
                document.getElementById('points-display').textContent = `Points: ${result.total_points}`;
                closeChallenge();
                await initializeGame(); // Refresh challenges to update completion status
            } else {
                showMessage('error', result.message);
                if (result.locked_until) {
                    closeChallenge();
                    await initializeGame(); // Refresh challenges to update cooldown
                }
            }
        } else {
            if (result.error === 'Challenge already completed') {
                showMessage('info', 'Challenge already completed');
                closeChallenge();
                await initializeGame();
            } else if (result.error === 'Challenge is locked') {
                showMessage('error', `Challenge is locked. Try again later.`);
                closeChallenge();
                await initializeGame();
            } else {
                showMessage('error', result.error || 'Failed to submit challenge');
            }
        }
    } catch (error) {
        console.error('Error submitting challenge:', error);
        showMessage('error', 'Failed to submit challenge. Please try again.');
    }
}

// Load cooldowns from localStorage
const COOLDOWN_KEY = 'challenge_cooldowns';
let challengeCooldowns = JSON.parse(localStorage.getItem(COOLDOWN_KEY)) || {};

function saveCooldowns() {
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(challengeCooldowns));
}

function formatTimeRemaining(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

async function fetchChallenges() {
    try {
        const response = await fetch('/api/challenges');
        if (!response.ok) {
            throw new Error('Failed to fetch challenges');
        }
        challenges = await response.json();
        
        // Update cooldowns from server
        challenges.forEach(challenge => {
            if (challenge.locked_until) {
                challengeCooldowns[challenge.id] = challenge.locked_until;
            }
        });
        saveCooldowns();
        
        console.log('Fetched challenges:', challenges);
        updateFiltersAndChallenges();
        
        // Start cooldown timer updates
        setInterval(updateCooldowns, 60000); // Update every minute
    } catch (error) {
        console.error('Error fetching challenges:', error);
        document.getElementById('challenges-list').innerHTML = 
            '<div class="p-4 text-red-600">Failed to load challenges. Please try refreshing the page.</div>';
    }
}

function updateCooldowns() {
    const now = new Date();
    let updated = false;
    
    Object.entries(challengeCooldowns).forEach(([id, endTime]) => {
        if (new Date(endTime) <= now) {
            delete challengeCooldowns[id];
            updated = true;
        }
    });
    
    if (updated) {
        saveCooldowns();
        renderChallenges();
    }
}

function getDifficultyLevel(points) {
    if (points <= 15) return 'Beginner';
    if (points <= 25) return 'Intermediate';
    return 'Advanced';
}

function getDifficultyColor(points) {
    if (points <= 15) return 'bg-green-100 text-green-800';
    if (points <= 25) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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

function selectChallenge(id) {
    const challenge = challenges.find(c => c.id === id);
    if (!challenge) return;

    // Check if challenge is already completed
    if (challenge.completed) {
        const workspace = document.getElementById('current-challenge');
        if (workspace) {
            workspace.innerHTML = `
                <div class="p-4 bg-green-100 rounded-lg text-center">
                    <p class="text-green-800 font-semibold">Challenge Already Completed! 🎉</p>
                    <p class="text-green-600">You've already earned points for this challenge.</p>
                    <button onclick="closeChallenge()" 
                            class="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        Close
                    </button>
                </div>
            `;
        }
        return;
    }
    
    // Check if challenge is locked
    const cooldownEnd = challengeCooldowns[id];
    if (cooldownEnd && new Date(cooldownEnd) > new Date()) {
        alert(`This challenge is locked for ${formatTimeRemaining(cooldownEnd)}`);
        return;
    }
    
    currentChallenge = challenge;
    
    if (challenge.type === 'quiz') {
        renderQuizChallenge(challenge);
    } else {
        const workspace = document.getElementById('current-challenge');
        const codeEditor = document.getElementById('code-editor');
        const submitBtn = document.getElementById('submit-btn');
        
        if (!workspace || !codeEditor || !submitBtn) return;
        
        workspace.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-semibold">${challenge.title}</h3>
                    <p class="text-gray-600 mt-1">${challenge.description}</p>
                </div>
                <button onclick="closeChallenge()" class="text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `;
        
        codeEditor.style.display = 'block';
        codeEditor.value = '';
        submitBtn.style.display = 'block';
    }
}

async function submitChallenge() {
    if (!currentChallenge) {
        console.error('No challenge selected');
        return;
    }

    let data = {
        challengeId: currentChallenge.id
    };

    if (currentChallenge.type === 'quiz') {
        const selectedAnswer = document.querySelector('input[name="quiz-answer"]:checked');
        if (!selectedAnswer) {
            showMessage('error', 'Please select an answer');
            return;
        }
        data.answer = parseInt(selectedAnswer.value);
    } else {
        const codeEditor = document.getElementById('code-editor');
        if (!codeEditor || !codeEditor.value.trim()) {
            showMessage('error', 'Please write some code');
            return;
        }
        data.code = codeEditor.value;
    }

    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            if (result.correct) {
                showMessage('success', `${result.message} +${result.points} points!`);
                document.getElementById('points-display').textContent = `Points: ${result.total_points}`;
                closeChallenge();
                await initializeGame(); // Refresh challenges to update completion status
            } else {
                showMessage('error', result.message);
                if (result.locked_until) {
                    closeChallenge();
                    await initializeGame(); // Refresh challenges to update cooldown
                }
            }
        } else {
            if (result.error === 'Challenge already completed') {
                showMessage('info', 'Challenge already completed');
                closeChallenge();
                await initializeGame();
            } else if (result.error === 'Challenge is locked') {
                showMessage('error', `Challenge is locked. Try again later.`);
                closeChallenge();
                await initializeGame();
            } else {
                showMessage('error', result.error || 'Failed to submit challenge');
            }
        }
    } catch (error) {
        console.error('Error submitting challenge:', error);
        showMessage('error', 'Failed to submit challenge. Please try again.');
    }
}

function closeChallenge() {
    currentChallenge = null;
    
    // Clear and hide the code editor
    const codeEditor = document.getElementById('code-editor');
    if (codeEditor) {
        codeEditor.value = '';
        codeEditor.style.display = 'none';
    }
    
    // Hide the submit button
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.style.display = 'none';
    }
    
    // Reset the workspace
    const workspace = document.getElementById('current-challenge');
    if (workspace) {
        workspace.innerHTML = '<p class="text-gray-600">Select a challenge to begin</p>';
    }
    
    // Update filters and challenges
    updateFiltersAndChallenges();
}

function renderQuizChallenge(challenge) {
    const workspace = document.getElementById('current-challenge');
    if (!workspace) return;

    const isCompleted = challenge.completed;
    const completedClass = isCompleted ? 'text-green-500' : '';
    const completedText = isCompleted ? '<span class="text-green-500">(Completed)</span> ' : '';
    
    workspace.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="text-xl font-semibold ${completedClass}">${challenge.title} ${completedText}</h3>
                <p class="text-gray-600 mt-1">${challenge.description}</p>
            </div>
            <button onclick="closeChallenge()" class="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="space-y-2">
            ${challenge.options.map((option, index) => `
                <button onclick="submitQuizAnswer(${index})" 
                        class="w-full p-3 text-left border rounded hover:bg-gray-50 transition-colors
                        ${isCompleted ? 'cursor-not-allowed opacity-75' : ''}"
                        ${isCompleted ? 'disabled' : ''}>
                    ${option}
                </button>
            `).join('')}
        </div>
    `;
}

function updatePoints(points) {
    document.getElementById('points-display').textContent = `Points: ${points}`;
}

function updateFiltersAndChallenges() {
    renderFilters();
    renderChallenges();
}

function saveCompletedChallenges() {
    const completedIds = challenges
        .filter(c => c.completed)
        .map(c => c.id);
    localStorage.setItem('completedChallenges', JSON.stringify(completedIds));
}

function loadCompletedChallenges() {
    try {
        const saved = localStorage.getItem('completedChallenges');
        if (saved) {
            const completedIds = JSON.parse(saved);
            challenges.forEach(c => {
                c.completed = completedIds.includes(c.id);
            });
        }
    } catch (error) {
        console.error('Error loading completed challenges:', error);
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing game...');
    
    // Initialize points display
    document.getElementById('points-display').textContent = `Points: 0`;
    
    // Add submit button event listener
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitChallenge);
    }
    
    // Fetch challenges and render UI
    await initializeGame();
    loadCompletedChallenges(); // Load completed challenges
    updateFiltersAndChallenges();
});
