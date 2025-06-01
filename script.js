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
let playerData = {};
let playerMoveHistory = [];
const MAX_HISTORY_LENGTH = 5;

// Static Game Data
const UPGRADES_CONFIG = {
    spiritPerWin: {
        name: "勝利時スピリット増加 (Spirit per Win)",
        baseCost: 20,
        costMultiplier: 1.2,
        baseEffect: 1,
        description: (level, effect, cost) => `勝利時の獲得スピリット +${effect} (現在レベル: ${level}, 次コスト: ${cost}スピリット)`
    },
    critChance: {
        name: "クリティカル勝利確率 (Critical Win Chance)",
        baseCost: 50,
        costMultiplier: 1.3,
        baseEffect: 0.01,
        maxLevel: 50,
        description: (level, effect, cost) => `クリティカル勝利の確率 +${(effect * 100).toFixed(1)}% (現在レベル: ${level}, 次コスト: ${cost})`
    },
    critMultiplier: {
        name: "クリティカル勝利倍率 (Critical Win Multiplier)",
        baseCost: 100,
        costMultiplier: 1.4,
        baseEffect: 0.5,
        description: (level, effect, cost) => `クリティカル勝利時のスピリット倍率 +${effect.toFixed(1)}x (現在レベル: ${level}, 次コスト: ${cost})`
    }
};

const BASE_CRIT_MULTIPLIER = 1.5;

const ITEMS_CONFIG = {
    trainingGloves: {
        id: 'trainingGloves',
        name: "トレーニンググローブ (Training Gloves)",
        description: "グーで勝利時、追加で2スピリット獲得 (Win with Rock, +2 Spirit)",
        effect: { type: 'rockWinBonus', value: 2 },
        slot: 'hand'
    },
    sharpScissorsCharm: {
        id: 'sharpScissorsCharm',
        name: "鋭いハサミのお守り (Sharp Scissors Charm)",
        description: "チョキで勝利時、追加で2スピリット獲得 (Win with Scissors, +2 Spirit)",
        effect: { type: 'scissorsWinBonus', value: 2 },
        slot: 'hand'
    }
};
const ITEM_DROP_CHANCE = 0.1; // 10% chance to drop an item on win

// Function to initialize or reset player data
function initializeDefaultPlayerData() {
    playerData = {
        version: "0.1.0",
        lastSaveTimestamp: 0,
        jankenSpirit: 0,
        upgrades: {
            spiritPerWin: 0,
            critChance: 0,
            critMultiplier: 0
        },
        playerLevel: 1,
        playerEXP: 0,
        expToNextLevel: calculateExpToNextLevel(1),
        equippedHand: null,
        inventory: [],
        stats: {
            totalWins: 0,
            totalLosses: 0,
            totalDraws: 0,
            rocksThrown: 0,
            papersThrown: 0,
            scissorsThrown: 0
        },
        lastRoundWasCritical: false
    };
    playerMoveHistory = [];
    console.log("Player data initialized to default. AI history cleared.");
}

// Function to save game data
function saveGame() {
    try {
        playerData.lastSaveTimestamp = Date.now();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(playerData));
        updateDebugOutput();
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
                initializeDefaultPlayerData();

                for (const key in playerData) {
                    if (loadedData.hasOwnProperty(key)) {
                        if (key === 'upgrades' || key === 'stats') {
                            if (typeof loadedData[key] === 'object' && loadedData[key] !== null) {
                                for (const nestedKey in playerData[key]) {
                                    if (loadedData[key].hasOwnProperty(nestedKey)) {
                                        playerData[key][nestedKey] = loadedData[key][nestedKey];
                                    }
                                }
                            }
                        } else if (key === 'inventory') {
                            playerData.inventory = Array.isArray(loadedData.inventory) ? loadedData.inventory.map(item => ({...item})) : []; // Deep copy inventory items
                        } else if (key === 'equippedHand') {
                            playerData.equippedHand = (typeof loadedData.equippedHand === 'object' && loadedData.equippedHand !== null) ? {...loadedData.equippedHand} : null; // Deep copy equipped item
                        }
                        else if (typeof playerData[key] !== 'object' || playerData[key] === null) {
                            playerData[key] = loadedData[key];
                        }
                    }
                }
                if (!playerData.expToNextLevel || playerData.expToNextLevel === 0) {
                    playerData.expToNextLevel = calculateExpToNextLevel(playerData.playerLevel || 1);
                }
                playerData.lastRoundWasCritical = false;
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
}

// EXP and Leveling
function calculateExpToNextLevel(level) {
    return Math.floor(100 * Math.pow(1.15, level - 1));
}

const EXP_GAIN_WIN = 10;
const EXP_GAIN_DRAW = 1;

function gainEXP(amount) {
    if (!playerData) return;
    playerData.playerEXP += amount;
    checkForLevelUp();
}

function checkForLevelUp() {
    if (!playerData) return;
    while (playerData.playerEXP >= playerData.expToNextLevel) {
        playerData.playerEXP -= playerData.expToNextLevel;
        playerData.playerLevel++;
        playerData.expToNextLevel = calculateExpToNextLevel(playerData.playerLevel);
        console.log(`Congratulations! Reached Level ${playerData.playerLevel}!`);
    }
}

// UI Update Functions
function updatePlayerLevelAndEXPDisplay() {
    if (playerLevelDisplay) playerLevelDisplay.textContent = playerData.playerLevel;
    if (playerEXPDisplay) playerEXPDisplay.textContent = playerData.playerEXP;
    if (expToNextLevelDisplay) expToNextLevelDisplay.textContent = playerData.expToNextLevel;
}

function updateEquipmentDisplay() {
    if (equippedHandDisplay) {
        if (playerData.equippedHand) {
            equippedHandDisplay.textContent = `Equipped: ${playerData.equippedHand.name} (${playerData.equippedHand.description})`;
        } else {
            equippedHandDisplay.textContent = "Equipped: None";
        }
    }
    if (inventoryItemDisplay) {
        if (playerData.inventory.length > 0) {
            const item = playerData.inventory[0];
            inventoryItemDisplay.textContent = `Inventory: ${item.name} (${item.description})`;
        } else {
            inventoryItemDisplay.textContent = "Inventory: Empty";
        }
    }
    if (swapEquipmentButton) {
        swapEquipmentButton.disabled = !(playerData.equippedHand && playerData.inventory.length > 0);
    }
}

function updateAllDisplays() {
    updateSpiritDisplay();
    updateUpgradesDisplay();
    updatePlayerLevelAndEXPDisplay();
    updateEquipmentDisplay();
    updateDebugOutput();
}

function updateDebugOutput() {
    if (playerDataDebugOutput) {
        playerDataDebugOutput.textContent = JSON.stringify(playerData, null, 2);
    }
}

function updateSpiritDisplay() {
    if (jankenSpiritDisplay) {
       jankenSpiritDisplay.textContent = playerData.jankenSpirit;
    }
}

function updateUpgradesDisplay() {
    if (!UPGRADES_CONFIG || !playerData.upgrades) return;

    const idsToUpdate = ['spiritPerWin', 'critChance', 'critMultiplier'];
    idsToUpdate.forEach(id => {
        const config = UPGRADES_CONFIG[id];
        const displayElement = document.getElementById(`${id}-upgrade-display`); // Assumes specific ID pattern
        const buttonElement = document.getElementById(`buy-${id}-button`); // Assumes specific ID pattern

        if (config && displayElement && buttonElement) {
            const currentLevel = playerData.upgrades[id] || 0;
            const cost = getUpgradeCost(id);
            let effect = currentLevel * config.baseEffect;
            if (id === 'critChance' && config.maxLevel) {
                effect = Math.min(effect, config.maxLevel * config.baseEffect);
            }

            displayElement.textContent = config.description(currentLevel, effect, cost === Infinity ? "MAX" : cost);
            buttonElement.disabled = playerData.jankenSpirit < cost || cost === Infinity;
            buttonElement.textContent = cost === Infinity ? "MAX" : "購入 (Buy)";
        }
    });
}


// DOM Elements
let jankenSpiritDisplay, rockButton, paperButton, scissorsButton;
let playerChoiceDisplay, opponentChoiceDisplay, outcomeDisplay, spiritGainedDisplay;
let spiritPerWinUpgradeDisplay, buySpiritPerWinButton;
let critChanceUpgradeDisplay, buyCritChanceButton;
let critMultiplierUpgradeDisplay, buyCritMultiplierButton;
let playerLevelDisplay, playerEXPDisplay, expToNextLevelDisplay;
let equippedHandDisplay, inventoryItemDisplay, swapEquipmentButton;
let manualSaveButton, resetDataButton, playerDataDebugOutput;

document.addEventListener('DOMContentLoaded', () => {
    loadGame();

    jankenSpiritDisplay = document.getElementById('janken-spirit-display');
    rockButton = document.getElementById('rock-button');
    paperButton = document.getElementById('paper-button');
    scissorsButton = document.getElementById('scissors-button');
    playerChoiceDisplay = document.getElementById('player-choice-display');
    opponentChoiceDisplay = document.getElementById('opponent-choice-display');
    outcomeDisplay = document.getElementById('outcome-display');
    spiritGainedDisplay = document.getElementById('spirit-gained-display');

    spiritPerWinUpgradeDisplay = document.getElementById('spirit-per-win-upgrade-display');
    buySpiritPerWinButton = document.getElementById('buy-spirit-per-win-button');
    critChanceUpgradeDisplay = document.getElementById('crit-chance-upgrade-display');
    buyCritChanceButton = document.getElementById('buy-crit-chance-button');
    critMultiplierUpgradeDisplay = document.getElementById('crit-multiplier-upgrade-display');
    buyCritMultiplierButton = document.getElementById('buy-crit-multiplier-button');

    playerLevelDisplay = document.getElementById('player-level-display');
    playerEXPDisplay = document.getElementById('player-exp-display');
    expToNextLevelDisplay = document.getElementById('exp-to-next-level-display');

    equippedHandDisplay = document.getElementById('equipped-hand-display');
    inventoryItemDisplay = document.getElementById('inventory-item-display');
    swapEquipmentButton = document.getElementById('swap-equipment-button');

    manualSaveButton = document.getElementById('manual-save-button');
    resetDataButton = document.getElementById('reset-data-button');
    playerDataDebugOutput = document.getElementById('player-data-debug-output');

    updateAllDisplays();

    if (rockButton) rockButton.addEventListener('click', () => playRound(ROCK));
    if (paperButton) paperButton.addEventListener('click', () => playRound(PAPER));
    if (scissorsButton) scissorsButton.addEventListener('click', () => playRound(SCISSORS));
    if (buySpiritPerWinButton) buySpiritPerWinButton.addEventListener('click', () => buyUpgrade('spiritPerWin'));
    if (buyCritChanceButton) buyCritChanceButton.addEventListener('click', () => buyUpgrade('critChance'));
    if (buyCritMultiplierButton) buyCritMultiplierButton.addEventListener('click', () => buyUpgrade('critMultiplier'));
    if (swapEquipmentButton) swapEquipmentButton.addEventListener('click', swapEquippedAndInventory);

    if (manualSaveButton) manualSaveButton.addEventListener('click', () => saveGame());
    if (resetDataButton) resetDataButton.addEventListener('click', () => {
        if (confirm("本当にゲームデータをリセットしますか？ (Are you sure you want to reset game data?)")) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            initializeDefaultPlayerData();
            updateAllDisplays();
            saveGame();
        }
    });
});

// Core Game Logic
function calculateJankenOutcome(playerChoice, opponentChoice) {
    if (playerChoice === opponentChoice) return DRAW;
    if ((playerChoice === ROCK && opponentChoice === SCISSORS) ||
        (playerChoice === PAPER && opponentChoice === ROCK) ||
        (playerChoice === SCISSORS && opponentChoice === PAPER)) {
        return WIN;
    }
    return LOSE;
}

function getOpponentChoice() {
    if (playerMoveHistory.length < 3) {
        return HAND_CHOICES[Math.floor(Math.random() * HAND_CHOICES.length)];
    }
    const moveCounts = { [ROCK]: 0, [PAPER]: 0, [SCISSORS]: 0 };
    playerMoveHistory.forEach(move => { if (moveCounts.hasOwnProperty(move)) moveCounts[move]++; });
    let maxCount = 0;
    Object.values(moveCounts).forEach(count => maxCount = Math.max(maxCount, count));
    const mostFrequentPlayerMoves = Object.keys(moveCounts).filter(move => moveCounts[move] === maxCount);
    let preferredAIChoices = [...new Set(mostFrequentPlayerMoves.map(playerMove => {
        if (playerMove === ROCK) return PAPER;
        if (playerMove === PAPER) return SCISSORS;
        return ROCK;
    }))];
    const rand = Math.random();
    if (preferredAIChoices.length === 1 && rand < 0.6) return preferredAIChoices[0];
    if (preferredAIChoices.length === 2 && rand < 0.3) return preferredAIChoices[0];
    if (preferredAIChoices.length === 2 && rand < 0.6) return preferredAIChoices[1];
    let nonPreferredChoices = HAND_CHOICES.filter(choice => !preferredAIChoices.includes(choice));
    if (nonPreferredChoices.length === 0) return HAND_CHOICES[Math.floor(Math.random() * HAND_CHOICES.length)];
    return nonPreferredChoices[Math.floor(Math.random() * nonPreferredChoices.length)];
}

function calculateResourceGain(outcome) {
    let spiritGainedBase;
    playerData.lastRoundWasCritical = false;

    switch (outcome) {
        case WIN:
            spiritGainedBase = SPIRIT_GAIN_WIN;
            if (playerData.upgrades.spiritPerWin) {
                spiritGainedBase += (playerData.upgrades.spiritPerWin * UPGRADES_CONFIG.spiritPerWin.baseEffect);
            }
            let currentCritChance = (playerData.upgrades.critChance || 0) * UPGRADES_CONFIG.critChance.baseEffect;
            if (UPGRADES_CONFIG.critChance.maxLevel) {
                 currentCritChance = Math.min(currentCritChance, UPGRADES_CONFIG.critChance.maxLevel * UPGRADES_CONFIG.critChance.baseEffect);
            }
            if (Math.random() < currentCritChance) {
                playerData.lastRoundWasCritical = true;
                const critMultiplierBonus = (playerData.upgrades.critMultiplier || 0) * UPGRADES_CONFIG.critMultiplier.baseEffect;
                spiritGainedBase *= (BASE_CRIT_MULTIPLIER + critMultiplierBonus);
            }
            break;
        case DRAW: spiritGainedBase = SPIRIT_GAIN_DRAW; break;
        case LOSE: spiritGainedBase = SPIRIT_GAIN_LOSE; break;
        default: spiritGainedBase = 0;
    }
    let finalGain = Math.floor(spiritGainedBase);

    if (outcome === WIN && playerData.equippedHand && playerData.equippedHand.effect) {
        const effect = playerData.equippedHand.effect;
        const playerChoiceForRound = playerMoveHistory.length > 0 ? playerMoveHistory[0] : null;
        if (playerChoiceForRound) {
            if (effect.type === 'rockWinBonus' && playerChoiceForRound === ROCK) finalGain += effect.value;
            else if (effect.type === 'scissorsWinBonus' && playerChoiceForRound === SCISSORS) finalGain += effect.value;
        }
    }
    return finalGain;
}

function updatePlayerSpirit(amountGained) {
    playerData.jankenSpirit += amountGained;
}

function getUpgradeCost(upgradeId) {
    const config = UPGRADES_CONFIG[upgradeId];
    if (!config) return Infinity;
    const currentLevel = playerData.upgrades[upgradeId] || 0;
    if (config.maxLevel && currentLevel >= config.maxLevel) return Infinity;
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
}

function buyUpgrade(upgradeId) {
    const config = UPGRADES_CONFIG[upgradeId];
    if (!config) return;
    const currentLevel = playerData.upgrades[upgradeId] || 0;
    if (config.maxLevel && currentLevel >= config.maxLevel) return;
    const cost = getUpgradeCost(upgradeId);
    if (playerData.jankenSpirit >= cost) {
        playerData.jankenSpirit -= cost;
        playerData.upgrades[upgradeId]++;
        updateAllDisplays();
        saveGame();
    }
}

// Equipment System
function handleItemDrop(item) {
    console.log("Item dropped:", item.name);
    const newItemCopy = JSON.parse(JSON.stringify(item)); // Ensure it's a copy
    if (!playerData.equippedHand) {
        playerData.equippedHand = newItemCopy;
        console.log(newItemCopy.name + " equipped automatically.");
    } else if (playerData.inventory.length === 0) {
        playerData.inventory.push(newItemCopy);
        console.log(newItemCopy.name + " added to inventory.");
    } else {
        const replacedItem = playerData.inventory[0];
        playerData.inventory[0] = newItemCopy;
        console.log(newItemCopy.name + " replaced " + replacedItem.name + " in inventory.");
    }
}

function swapEquippedAndInventory() {
    if (playerData.equippedHand && playerData.inventory.length > 0) {
        const temp = playerData.equippedHand;
        playerData.equippedHand = playerData.inventory[0];
        playerData.inventory[0] = temp;
        updateAllDisplays();
        saveGame();
    }
}

function playRound(playerChoice) {
    playerMoveHistory.unshift(playerChoice);
    if (playerMoveHistory.length > MAX_HISTORY_LENGTH) playerMoveHistory.pop();

    const opponentChoice = getOpponentChoice();
    const outcome = calculateJankenOutcome(playerChoice, opponentChoice);
    const spiritGained = calculateResourceGain(outcome);

    let expGained = 0;
    if (outcome === WIN) {
        expGained = EXP_GAIN_WIN;
        if (Math.random() < ITEM_DROP_CHANCE) {
            const itemKeys = Object.keys(ITEMS_CONFIG);
            const randomItemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
            handleItemDrop(ITEMS_CONFIG[randomItemKey]); // Pass the original config object to be copied by handleItemDrop
        }
    } else if (outcome === DRAW) {
        expGained = EXP_GAIN_DRAW;
    }

    if (expGained > 0) gainEXP(expGained);
    updatePlayerSpirit(spiritGained);

    if (playerChoiceDisplay) playerChoiceDisplay.textContent = playerChoice;
    if (opponentChoiceDisplay) opponentChoiceDisplay.textContent = opponentChoice;
    if (outcomeDisplay) {
       let outcomeText = outcome;
       if (playerData.lastRoundWasCritical && outcome === WIN) outcomeText += " (CRITICAL!)";
       outcomeDisplay.textContent = outcomeText;
    }
    if (spiritGainedDisplay) spiritGainedDisplay.textContent = spiritGained;

    if (!playerData.stats) playerData.stats = { totalWins: 0, totalLosses: 0, totalDraws: 0, rocksThrown: 0, papersThrown: 0, scissorsThrown: 0 };
    if (playerChoice === ROCK) playerData.stats.rocksThrown++;
    else if (playerChoice === PAPER) playerData.stats.papersThrown++;
    else if (playerChoice === SCISSORS) playerData.stats.scissorsThrown++;
    if (outcome === WIN) playerData.stats.totalWins++;
    else if (outcome === LOSE) playerData.stats.totalLosses++;
    else if (outcome === DRAW) playerData.stats.totalDraws++;

    updateAllDisplays();
    saveGame();
}
