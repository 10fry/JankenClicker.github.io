import { loadGame, saveGame, initializeDefaultPlayerData } from './playerData';
import { playRound } from './gameLogic';
import { UPGRADES_CONFIG, getUpgradeEffect, getUpgradeCost, buyUpgrade } from './upgrades';
import { generateRandomEquipment } from './hacksSlash';
import { performTensei, calculateTenseiTokens } from './tensei';
import { runGameLogicTests } from './tests/gameLogic.test';
import { runUpgradesTests } from './tests/upgrades.test';
export let currentPlayer;
// DOM Element Variables
let rockButton = null;
let paperButton = null;
let scissorsButton = null;
let playerChoiceDisplay = null;
let opponentChoiceDisplay = null;
let outcomeDisplay = null;
// let spiritGainedDisplay: HTMLElement | null = null; // Not explicitly in HTML, often part of outcome or log
let jankenSpiritDisplay = null;
let totalWinsDisplay = null;
let totalLossesDisplay = null;
let totalDrawsDisplay = null;
let upgradesContainer = null;
// Specific upgrade elements will be handled dynamically
let manualSaveButton = null;
let resetDataButton = null;
let gameLogDisplay = null;
let tenseiButton = null;
let tenseiTokensDisplay = null;
let equipmentDisplay = null;
function initializeUI() {
    rockButton = document.getElementById('rock-button');
    paperButton = document.getElementById('paper-button');
    scissorsButton = document.getElementById('scissors-button');
    playerChoiceDisplay = document.getElementById('player-choice-display');
    opponentChoiceDisplay = document.getElementById('opponent-choice-display');
    outcomeDisplay = document.getElementById('outcome-display');
    jankenSpiritDisplay = document.getElementById('janken-spirit-display');
    totalWinsDisplay = document.getElementById('total-wins-display');
    totalLossesDisplay = document.getElementById('total-losses-display');
    totalDrawsDisplay = document.getElementById('total-draws-display');
    upgradesContainer = document.getElementById('upgrades-list');
    manualSaveButton = document.getElementById('save-button');
    resetDataButton = document.getElementById('reset-button');
    gameLogDisplay = document.getElementById('game-log-list');
    tenseiButton = document.getElementById('tensei-button'); // Added in HTML conceptually
    tenseiTokensDisplay = document.getElementById('tensei-tokens-display'); // Added in HTML conceptually
    equipmentDisplay = document.getElementById('equipment-display'); // Added in HTML conceptually
    // Attach event listeners
    rockButton === null || rockButton === void 0 ? void 0 : rockButton.addEventListener('click', () => handleJankenPlay('rock'));
    paperButton === null || paperButton === void 0 ? void 0 : paperButton.addEventListener('click', () => handleJankenPlay('paper'));
    scissorsButton === null || scissorsButton === void 0 ? void 0 : scissorsButton.addEventListener('click', () => handleJankenPlay('scissors'));
    manualSaveButton === null || manualSaveButton === void 0 ? void 0 : manualSaveButton.addEventListener('click', handleManualSave);
    resetDataButton === null || resetDataButton === void 0 ? void 0 : resetDataButton.addEventListener('click', handleResetData);
    tenseiButton === null || tenseiButton === void 0 ? void 0 : tenseiButton.addEventListener('click', handleTensei);
    // Initial UI update
    updateAllDisplays();
    // Run tests after UI is initialized (optional, for dev feedback)
    console.log('\n\n--- Running Automated Tests ---');
    runGameLogicTests();
    runUpgradesTests();
    console.log('--- Automated Tests Finished ---\n\n');
}
function initializeGame() {
    currentPlayer = loadGame();
    console.log("Game loaded/initialized in main.ts:", currentPlayer);
    saveGame(currentPlayer);
    // Initialize UI elements and attach listeners after game data is ready
    initializeUI();
    logMessage("Game initialized. Welcome to Janken Clicker Wars!");
}
// --- UI Update Functions ---
function updateSpiritDisplay() {
    if (jankenSpiritDisplay) {
        jankenSpiritDisplay.textContent = currentPlayer.jankenSpirit.toString();
    }
}
function updateBattleResultDisplay(playerChoice, opponentChoice, outcome, spiritGained) {
    if (playerChoiceDisplay)
        playerChoiceDisplay.textContent = playerChoice;
    if (opponentChoiceDisplay)
        opponentChoiceDisplay.textContent = opponentChoice;
    if (outcomeDisplay)
        outcomeDisplay.textContent = `${outcome.toUpperCase()}! ${spiritGained >= 0 ? `+${spiritGained}` : spiritGained} Spirit.`;
}
function updateStatsDisplay() {
    if (totalWinsDisplay)
        totalWinsDisplay.textContent = currentPlayer.stats.totalWins.toString();
    if (totalLossesDisplay)
        totalLossesDisplay.textContent = currentPlayer.stats.totalLosses.toString();
    if (totalDrawsDisplay)
        totalDrawsDisplay.textContent = currentPlayer.stats.totalDraws.toString();
    // Could add rocks/papers/scissors thrown counts if there are elements for them
}
function updateUpgradesDisplay() {
    if (!upgradesContainer)
        return;
    upgradesContainer.innerHTML = ''; // Clear existing upgrades
    for (const upgradeId in UPGRADES_CONFIG) {
        const config = UPGRADES_CONFIG[upgradeId];
        const currentLevel = currentPlayer.upgrades[upgradeId] || 0;
        const effect = getUpgradeEffect(upgradeId, currentLevel);
        const cost = getUpgradeCost(upgradeId, currentLevel);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'upgrade-item';
        itemDiv.id = `upgrade-${upgradeId}`;
        const nameEl = document.createElement('h3');
        nameEl.textContent = config.name;
        const descEl = document.createElement('p');
        descEl.textContent = config.description(currentLevel, getUpgradeEffect(upgradeId, currentLevel + 1) - effect, cost); // Show effect of *next* level in desc or current? For now, use config's own desc logic.
        // Let's use config's description as intended, passing current level, current total effect, and cost of next.
        descEl.textContent = config.description(currentLevel, effect, cost);
        const levelEl = document.createElement('p');
        levelEl.innerHTML = `Level: <span id="upgrade-${upgradeId}-level">${currentLevel}</span>`;
        const effectEl = document.createElement('p');
        // For 'spiritPerWin', effect is additive. If baseEffect was % based, formatting might be different.
        effectEl.innerHTML = `Effect: <span id="upgrade-${upgradeId}-effect">+${effect}</span>`;
        // This should reflect total current effect.
        // The baseEffect in config is per level for spiritPerWin.
        // So, total effect is baseEffect * level.
        const displayEffect = (upgradeId === 'spiritPerWin') ? config.baseEffect * currentLevel : effect;
        effectEl.innerHTML = `Effect: <span id="upgrade-${upgradeId}-effect">+${displayEffect}</span>`;
        const costEl = document.createElement('p');
        costEl.innerHTML = `Cost: <span id="upgrade-${upgradeId}-cost">${cost}</span>`;
        const buyButton = document.createElement('button');
        buyButton.id = `buy-${upgradeId}-button`;
        buyButton.textContent = 'Buy';
        buyButton.addEventListener('click', () => handleBuyUpgrade(upgradeId));
        if (currentPlayer.jankenSpirit < cost) {
            buyButton.disabled = true;
        }
        itemDiv.appendChild(nameEl);
        itemDiv.appendChild(descEl);
        itemDiv.appendChild(levelEl);
        itemDiv.appendChild(effectEl);
        itemDiv.appendChild(costEl);
        itemDiv.appendChild(buyButton);
        upgradesContainer.appendChild(itemDiv);
    }
}
function logMessage(message) {
    if (gameLogDisplay) {
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}]: ${message}`;
        // Add to top of log
        gameLogDisplay.insertBefore(logEntry, gameLogDisplay.firstChild);
        // Limit log entries
        while (gameLogDisplay.children.length > 20) {
            gameLogDisplay.removeChild(gameLogDisplay.lastChild);
        }
    }
    else {
        console.log(`LOG: ${message}`); // Fallback if display not found
    }
}
function updateTenseiDisplay() {
    if (tenseiTokensDisplay) {
        tenseiTokensDisplay.textContent = currentPlayer.tenseiTokens.toString();
    }
}
function updateEquipmentDisplay() {
    if (equipmentDisplay) {
        equipmentDisplay.innerHTML = '<h3>Equipped:</h3>';
        if (currentPlayer.equipment.length === 0) {
            equipmentDisplay.innerHTML += '<p>Nothing equipped.</p>';
            return;
        }
        const ul = document.createElement('ul');
        currentPlayer.equipment.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} (${item.rarity} ${item.type}) - Effects: ${item.effects.map(e => `${e.type}: ${e.value}${e.handCondition ? ` (${e.handCondition})` : ''}`).join(', ')}`;
            ul.appendChild(li);
        });
        equipmentDisplay.appendChild(ul);
    }
}
function updateAllDisplays() {
    updateSpiritDisplay();
    updateStatsDisplay();
    updateUpgradesDisplay();
    updateTenseiDisplay();
    updateEquipmentDisplay();
    // updateBattleResultDisplay is called specifically after a round
}
// --- Event Handlers ---
function handleJankenPlay(playerChoice) {
    const result = playRound(currentPlayer, playerChoice);
    // currentPlayer is modified directly by playRound for stats and spirit
    updateBattleResultDisplay(playerChoice, result.opponentChoice, result.outcome, result.spiritGained);
    updateSpiritDisplay();
    updateStatsDisplay();
    updateUpgradesDisplay(); // Costs might become affordable / unaffordable
    if (result.outcome === 'win' && Math.random() < 0.1) { // 10% chance to find equipment on win
        // Player level isn't implemented yet, so defaulting to 1 for equipment generation.
        // This could be tied to total wins, spirit, or a dedicated player level system later.
        const playerMockLevel = Math.floor(currentPlayer.stats.totalWins / 10) + 1;
        const newItem = generateRandomEquipment(playerMockLevel);
        currentPlayer.equipment.push(newItem); // For now, auto-equip. Max equipment slots could be a thing.
        logMessage(`Found equipment: ${newItem.name}! (${newItem.rarity})`);
        updateEquipmentDisplay();
    }
    saveGame(currentPlayer);
    logMessage(`Played ${playerChoice}. Opponent: ${result.opponentChoice}. Outcome: ${result.outcome}. Spirit: ${result.spiritGained >= 0 ? '+' : ''}${result.spiritGained}.`);
}
function handleBuyUpgrade(upgradeId) {
    const success = buyUpgrade(currentPlayer, upgradeId);
    if (success) {
        updateSpiritDisplay();
        updateUpgradesDisplay(); // This will re-render the specific upgrade and others
        saveGame(currentPlayer);
        const config = UPGRADES_CONFIG[upgradeId];
        logMessage(`Upgrade purchased: ${config.name} Level ${currentPlayer.upgrades[upgradeId]}.`);
    }
    else {
        logMessage(`Failed to purchase upgrade: ${UPGRADES_CONFIG[upgradeId].name}. Not enough spirit or max level.`);
    }
}
function handleManualSave() {
    saveGame(currentPlayer);
    logMessage("Game manually saved.");
}
function handleResetData() {
    // Consider using a more robust confirmation, like a custom modal
    if (confirm("Are you sure you want to reset all your game data? This cannot be undone!")) {
        currentPlayer = initializeDefaultPlayerData();
        saveGame(currentPlayer); // Save the newly reset data
        updateAllDisplays();
        logMessage("Game data has been reset.");
    }
}
function handleTensei() {
    const tokensToGain = calculateTenseiTokens(currentPlayer);
    if (tokensToGain <= 0 && currentPlayer.jankenSpirit < 5000) { // Consistent with tensei.ts check
        logMessage(`Not enough progress to Tensei. Need more Spirit or Wins. You would gain ${tokensToGain} tokens.`);
        alert(`Not enough progress to Tensei. You would gain ${tokensToGain} tokens this run. Keep going!`);
        return;
    }
    if (confirm(`Are you sure you want to Tensei? You will gain ${tokensToGain} Tensei Tokens. This will reset your current progress (Spirit, Upgrades, Stats, Equipment) but Tensei Tokens are permanent.`)) {
        currentPlayer = performTensei(currentPlayer);
        saveGame(currentPlayer);
        updateAllDisplays(); // This will refresh everything to the new post-Tensei state
        logMessage(`Tensei successful! You now have ${currentPlayer.tenseiTokens} Tensei Tokens.`);
        alert("Tensei successful! Your journey begins anew, but with greater cosmic power!");
    }
}
// DOMContentLoaded listener
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
}
else {
    // DOMContentLoaded has already fired
    initializeGame();
}
// If other modules need to access currentPlayer, they can import it.
// However, it's often better to pass it as a parameter or have specific functions
// in main.ts that orchestrate operations on currentPlayer.
