import { calculateJankenOutcome, getOpponentChoice, playRound, HAND_CHOICES } from '../gameLogic';
import { initializeDefaultPlayerData } from '../playerData';
import { UPGRADES_CONFIG } from '../upgrades'; // Needed for playRound if it uses upgrades
// --- Simple Assertion Framework ---
let testsPassed = 0;
let testsFailed = 0;
function assertEqual(actual, expected, message) {
    if (actual === expected) {
        console.log(`%cPASS: ${message}`, 'color: green;');
        testsPassed++;
    }
    else {
        console.error(`%cFAIL: ${message}\nExpected: ${expected}, Actual: ${actual}`, 'color: red;');
        testsFailed++;
    }
}
function assert(condition, message) {
    if (condition) {
        console.log(`%cPASS: ${message}`, 'color: green;');
        testsPassed++;
    }
    else {
        console.error(`%cFAIL: ${message}`, 'color: red;');
        testsFailed++;
    }
}
// --- Test Cases ---
// Tests for calculateJankenOutcome
function testCalculateJankenOutcome() {
    console.log('\n--- Testing calculateJankenOutcome ---');
    assertEqual(calculateJankenOutcome('rock', 'scissors'), 'win', 'Rock vs Scissors should be win');
    assertEqual(calculateJankenOutcome('paper', 'rock'), 'win', 'Paper vs Rock should be win');
    assertEqual(calculateJankenOutcome('scissors', 'paper'), 'win', 'Scissors vs Paper should be win');
    assertEqual(calculateJankenOutcome('rock', 'paper'), 'lose', 'Rock vs Paper should be lose');
    assertEqual(calculateJankenOutcome('paper', 'scissors'), 'lose', 'Paper vs Scissors should be lose');
    assertEqual(calculateJankenOutcome('scissors', 'rock'), 'lose', 'Scissors vs Rock should be lose');
    assertEqual(calculateJankenOutcome('rock', 'rock'), 'draw', 'Rock vs Rock should be draw');
    assertEqual(calculateJankenOutcome('paper', 'paper'), 'draw', 'Paper vs Paper should be draw');
    assertEqual(calculateJankenOutcome('scissors', 'scissors'), 'draw', 'Scissors vs Scissors should be draw');
}
// Tests for getOpponentChoice
function testGetOpponentChoice() {
    console.log('\n--- Testing getOpponentChoice ---');
    const choice = getOpponentChoice();
    assert(HAND_CHOICES.includes(choice), `Opponent choice "${choice}" should be one of ${HAND_CHOICES.join(', ')}`);
    // Run a few times to check randomness (not a true statistical test)
    const choices = new Set();
    for (let i = 0; i < 20; i++) {
        choices.add(getOpponentChoice());
    }
    assert(choices.size > 1, `Opponent choices should be somewhat random (got ${Array.from(choices).join(', ')}) over 20 tries. This might fail by chance.`);
}
// Tests for playRound
function testPlayRound() {
    console.log('\n--- Testing playRound ---');
    let playerData = initializeDefaultPlayerData();
    playerData.jankenSpirit = 100; // Set initial spirit for testing upgrades later if any
    // Simulate a win (assuming opponent choice is somewhat random, this might need adjustment or mocking for deterministic test)
    // To make it deterministic, we'd need to mock getOpponentChoice or run multiple times.
    // For now, let's check general mechanics.
    const initialWins = playerData.stats.totalWins;
    const initialSpirit = playerData.jankenSpirit;
    // Test a round (e.g. player picks rock)
    // We don't know opponent's choice, so outcome varies. We'll check based on outcome.
    const playerChoice = 'rock';
    const roundResult = playRound(playerData, playerChoice);
    console.log(`playRound test: Player chose ${playerChoice}, Opponent: ${roundResult.opponentChoice}, Outcome: ${roundResult.outcome}`);
    if (roundResult.outcome === 'win') {
        assertEqual(playerData.stats.totalWins, initialWins + 1, 'Wins should increment on win');
        // Base win spirit is 1. Check if spirit increased by at least 1 (could be more with upgrades/equipment)
        assert(playerData.jankenSpirit > initialSpirit, `Spirit should increase on win. Start: ${initialSpirit}, End: ${playerData.jankenSpirit}`);
        assert(roundResult.spiritGained > 0, 'spiritGained on win should be positive');
    }
    else if (roundResult.outcome === 'lose') {
        assertEqual(playerData.stats.totalLosses, 1, 'Losses should increment on lose (assuming 0 initial losses)');
        assertEqual(playerData.jankenSpirit, initialSpirit + roundResult.spiritGained, 'Spirit should change by spiritGained on lose');
        assert(roundResult.spiritGained === 0, 'spiritGained on lose should be 0 by current design');
    }
    else { // draw
        assertEqual(playerData.stats.totalDraws, 1, 'Draws should increment on draw (assuming 0 initial draws)');
        assertEqual(playerData.jankenSpirit, initialSpirit + roundResult.spiritGained, 'Spirit should change by spiritGained on draw');
        assert(roundResult.spiritGained === 0, 'spiritGained on draw should be 0 by current design');
    }
    if (playerChoice === 'rock')
        assertEqual(playerData.stats.rocksThrown, 1, 'Rocks thrown should increment');
    // Test that spirit calculation includes spiritPerWin upgrade
    playerData = initializeDefaultPlayerData();
    playerData.jankenSpirit = 100;
    playerData.upgrades['spiritPerWin'] = 1; // Level 1 spiritPerWin (+1 spirit, from baseEffect in UPGRADES_CONFIG)
    // Need to mock getOpponentChoice to guarantee a win for this specific test
    const originalGetOpponentChoice = getOpponentChoice;
    getOpponentChoice = () => 'scissors'; // Force opponent to choose scissors for a win with rock
    const forcedWinResult = playRound(playerData, 'rock');
    assertEqual(forcedWinResult.outcome, 'win', 'Forced win outcome check');
    // Base win (1) + spiritPerWin level 1 (1) = 2. Equipment could add more.
    // Assuming no equipment for this specific check.
    const expectedSpiritGain = 1 + (UPGRADES_CONFIG.spiritPerWin.baseEffect * 1);
    assertEqual(forcedWinResult.spiritGained, expectedSpiritGain, `Spirit gain with L1 spiritPerWin. Expected ${expectedSpiritGain}`);
    assertEqual(playerData.jankenSpirit, 100 + expectedSpiritGain, 'Player spirit after forced win with L1 spiritPerWin');
    getOpponentChoice = originalGetOpponentChoice; // Restore original function
}
// --- Test Runner ---
export function runGameLogicTests() {
    testsPassed = 0;
    testsFailed = 0;
    console.log('======== Running GameLogic Tests ========');
    testCalculateJankenOutcome();
    testGetOpponentChoice();
    testPlayRound();
    console.log('\n------------------------------------');
    console.log(`GameLogic Tests Summary: ${testsPassed} passed, ${testsFailed} failed.`);
    console.log('====================================');
    return testsFailed === 0;
}
// Optional: Run tests if this file is executed directly (e.g. in a Node-like environment for tests)
// In a browser context, runGameLogicTests() would be called from main.ts or dev console.
// if (typeof require !== 'undefined' && require.main === module) {
//   runGameLogicTests();
// }
