'use strict';

console.log("Janken Clicker script loaded!");

// Game constants
const ROCK = 'rock';
const PAPER = 'paper';
const SCISSORS = 'scissors';
const HAND_CHOICES = [ROCK, PAPER, SCISSORS];

const WIN = 'win';
const LOSE = 'lose';
const DRAW = 'draw';

// Storage Key
const LOCAL_STORAGE_KEY = 'jankenClickerSaveData';

// Player Data
let playerData = {}; // Will be initialized by loadGame or initializeDefaultPlayerData

// Static Game Data
const UPGRADES_CONFIG = {
    spiritPerWin: {
        name: "勝利時スピリット増加 (Spirit per Win)",
        baseCost: 20,
        costMultiplier: 1.2, // Each level costs 20% more than the last
        baseEffect: 1,       // Each level adds +1 to spirit gained on win
        description: (level, effect, cost) => `勝利時の獲得スピリット +${effect} (現在レベル: ${level}, 次コスト: ${cost}スピリット)`
    }
};

// Function to initialize or reset player data
function initializeDefaultPlayerData() {
    playerData = {
        version: "0.1.0",
        lastSaveTimestamp: 0,
        jankenSpirit: 0,
        upgrades: {
            spiritPerWin: 0 // Level of the 'spiritPerWin' upgrade
        },
        // Skills, ascension, etc. would go here later
        stats: {
            totalWins: 0,
            totalLosses: 0,
            totalDraws: 0,
            rocksThrown: 0,
            papersThrown: 0,
            scissorsThrown: 0
        }
    };
    console.log("Player data initialized to default.");
}

// Function to save game data
function saveGame() {
    try {
        playerData.lastSaveTimestamp = Date.now();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(playerData));
        // console.log("Game saved successfully.");
        updateDebugOutput(); // Update debug output whenever game is saved
    } catch (error) {
        console.error("Error saving game data:", error);
    }
}

// Function to load game data
function loadGame() {
    const savedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedDataString) {
        try {
            const loadedData = JSON.parse(savedDataString);
            if (loadedData.version === "0.1.0") {
                const defaultDataForShape = {}; // Create a shape from current default func
                initializeDefaultPlayerData(); // this sets playerData to default
                const currentDefaultShape = playerData; // capture the shape

                playerData = { // Build the new playerData state
                    ...currentDefaultShape, // Spread default to get all keys and default values
                    ...loadedData,          // Spread loaded data to overwrite defaults with saved values
                    upgrades: {             // Explicitly merge nested objects
                        ...(currentDefaultShape.upgrades || {}),
                        ...(loadedData.upgrades || {})
                    },
                    stats: {
                        ...(currentDefaultShape.stats || {}),
                        ...(loadedData.stats || {})
                    }
                };
                console.log("Game loaded successfully.");
            } else {
                console.warn(`Save data version mismatch (found ${loadedData.version}, expected 0.1.0). Initializing new game.`);
                initializeDefaultPlayerData();
            }
        } catch (error) {
            console.error("Error parsing saved game data:", error, "Initializing new game.");
            initializeDefaultPlayerData();
        }
    } else {
        console.log("No save data found. Initializing new game.");
        initializeDefaultPlayerData();
    }
    // updateAllDisplays(); // Called from DOMContentLoaded after loadGame completes
}

// Function to update all displays
function updateAllDisplays() {
    updateSpiritDisplay();
    updateUpgradesDisplay();
    updateDebugOutput();
    // Add any other UI update functions here as they are created
}

// Function to update the debug output area
function updateDebugOutput() {
    if (playerDataDebugOutput) {
        playerDataDebugOutput.textContent = JSON.stringify(playerData, null, 2);
    }
}

// Resource Gain Constants (initial values)
const SPIRIT_GAIN_WIN = 10;
const SPIRIT_GAIN_DRAW = 1;
const SPIRIT_GAIN_LOSE = 0;

// DOM Elements (initialized in DOMContentLoaded)
let jankenSpiritDisplay;
let rockButton, paperButton, scissorsButton;
let playerChoiceDisplay, opponentChoiceDisplay, outcomeDisplay, spiritGainedDisplay;
let spiritPerWinUpgradeDisplay;
let buySpiritPerWinButton;
let manualSaveButton, resetDataButton, playerDataDebugOutput;

// Wait for DOM to load before getting elements and setting up listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load game data first
    loadGame();

    // Then get DOM elements
    jankenSpiritDisplay = document.getElementById('janken-spirit-display');
    rockButton = document.getElementById('rock-button');
    paperButton = document.getElementById('paper-button');
    scissorsButton = document.getElementById('scissors-button');
    playerChoiceDisplay = document.getElementById('player-choice-display');
    opponentChoiceDisplay = document.getElementById('opponent-choice-display');
    outcomeDisplay = document.getElementById('outcome-display');
    spiritGainedDisplay = document.getElementById('spirit-gained-display');

    spiritPerWinUpgradeDisplay = document.getElementById('spirit-per-win-display');
    buySpiritPerWinButton = document.getElementById('buy-spirit-per-win-button');

    manualSaveButton = document.getElementById('manual-save-button');
    resetDataButton = document.getElementById('reset-data-button');
    playerDataDebugOutput = document.getElementById('player-data-debug-output');

    // Initialize all displays with potentially loaded data
    updateAllDisplays();

    // Add event listeners
    if (rockButton) rockButton.addEventListener('click', () => playRound(ROCK));
    if (paperButton) paperButton.addEventListener('click', () => playRound(PAPER));
    if (scissorsButton) scissorsButton.addEventListener('click', () => playRound(SCISSORS));
    if (buySpiritPerWinButton) buySpiritPerWinButton.addEventListener('click', () => buyUpgrade('spiritPerWin'));

    if (manualSaveButton) manualSaveButton.addEventListener('click', () => {
        saveGame();
        // console.log("Manual save triggered.");
    });
    if (resetDataButton) resetDataButton.addEventListener('click', () => {
        if (confirm("本当にゲームデータをリセットしますか？ (Are you sure you want to reset game data?)")) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            initializeDefaultPlayerData(); // This sets playerData to new default object
            // No need to call loadGame() here, we are intentionally starting fresh.
            updateAllDisplays(); // Refresh UI with default state
            saveGame(); // Persist the reset state
            // console.log("Game data reset to defaults.");
        }
    });
});


/**
 * Calculates the outcome of a Janken game.
 * @param {string} playerChoice - Player's choice (ROCK, PAPER, or SCISSORS).
 * @param {string} opponentChoice - Opponent's choice (ROCK, PAPER, or SCISSORS).
 * @returns {string} Outcome of the game (WIN, LOSE, or DRAW).
 */
function calculateJankenOutcome(playerChoice, opponentChoice) {
    if (playerChoice === opponentChoice) {
        return DRAW;
    }
    if (
        (playerChoice === ROCK && opponentChoice === SCISSORS) ||
        (playerChoice === PAPER && opponentChoice === ROCK) ||
        (playerChoice === SCISSORS && opponentChoice === PAPER)
    ) {
        return WIN;
    }
    return LOSE;
}

/**
 * Simulates the opponent's choice for Janken.
 * Currently picks a random hand.
 * @returns {string} Opponent's choice (ROCK, PAPER, or SCISSORS).
 */
function getOpponentChoice() {
    const randomIndex = Math.floor(Math.random() * HAND_CHOICES.length);
    return HAND_CHOICES[randomIndex];
}

/**
 * Calculates the amount of Janken Spirit gained based on the outcome.
 * @param {string} outcome - The outcome of the Janken game (WIN, LOSE, DRAW).
 * @returns {number} The amount of Janken Spirit gained.
 */
function calculateResourceGain(outcome) {
    switch (outcome) {
        case WIN:
            return SPIRIT_GAIN_WIN;
        case DRAW:
            return SPIRIT_GAIN_DRAW;
        case LOSE:
            return SPIRIT_GAIN_LOSE;
        default:
            return 0;
    }
}

/**
 * Updates the player's Janken Spirit and calls UI update.
 * @param {number} amountGained - The amount of Janken Spirit gained.
 */
function updatePlayerSpirit(amountGained) {
    playerData.jankenSpirit += amountGained;
    updateSpiritDisplay();
}

/**
 * Updates the Janken Spirit display in the UI.
 */
function updateSpiritDisplay() {
    if (jankenSpiritDisplay) { // Check if element exists (it will after DOMContentLoaded)
       jankenSpiritDisplay.textContent = playerData.jankenSpirit;
    }
}

/**
 * Handles a full round of Janken: gets choices, calculates outcome, updates resources and UI.
 * @param {string} playerChoice - The player's chosen hand (ROCK, PAPER, or SCISSORS).
 */
function playRound(playerChoice) {
    const opponentChoice = getOpponentChoice();
    const outcome = calculateJankenOutcome(playerChoice, opponentChoice);
    const spiritGained = calculateResourceGain(outcome);

    updatePlayerSpirit(spiritGained); // This already calls updateSpiritDisplay

    // Update battle result displays
    if (playerChoiceDisplay) playerChoiceDisplay.textContent = playerChoice;
    if (opponentChoiceDisplay) opponentChoiceDisplay.textContent = opponentChoice;
    if (outcomeDisplay) outcomeDisplay.textContent = outcome;
    if (spiritGainedDisplay) spiritGainedDisplay.textContent = spiritGained;
}


// Example test calls (mainly for developer to test, can be removed or commented out later)
// const testPlayerChoice = ROCK;
// const testOpponentChoice = getOpponentChoice();
// const gameOutcome = calculateJankenOutcome(testPlayerChoice, testOpponentChoice);
// const spiritGained = calculateResourceGain(gameOutcome);
// updatePlayerSpirit(spiritGained);
// console.log(`Player chose ${testPlayerChoice}, Opponent chose ${testOpponentChoice}. Outcome: ${gameOutcome}, Spirit Gained: ${spiritGained}, Total Spirit: ${playerData.jankenSpirit}`);

// console.log(`Player: ROCK, Opponent: SCISSORS => ${calculateJankenOutcome(ROCK, SCISSORS)} (Expected: WIN)`);
// console.log(`Player: PAPER, Opponent: SCISSORS => ${calculateJankenOutcome(PAPER, SCISSORS)} (Expected: LOSE)`);
// console.log(`Player: SCISSORS, Opponent: SCISSORS => ${calculateJankenOutcome(SCISSORS, SCISSORS)} (Expected: DRAW)`);

// More game logic will be added here.
