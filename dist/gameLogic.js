import { getUpgradeEffect } from './upgrades';
import { applyEquipmentEffects } from './hacksSlash';
export const HAND_CHOICES = ['rock', 'paper', 'scissors'];
export function calculateJankenOutcome(playerChoice, opponentChoice) {
    if (playerChoice === opponentChoice) {
        return 'draw';
    }
    if ((playerChoice === 'rock' && opponentChoice === 'scissors') ||
        (playerChoice === 'scissors' && opponentChoice === 'paper') ||
        (playerChoice === 'paper' && opponentChoice === 'rock')) {
        return 'win';
    }
    return 'lose';
}
export function getOpponentChoice() {
    // Simple random choice for now
    const randomIndex = Math.floor(Math.random() * HAND_CHOICES.length);
    return HAND_CHOICES[randomIndex];
}
// calculateResourceGain is removed, its logic is integrated into playRound
export function playRound(playerData, playerChoice) {
    if (!HAND_CHOICES.includes(playerChoice)) {
        throw new Error(`Invalid player choice: ${playerChoice}`);
    }
    const opponentChoice = getOpponentChoice();
    const outcome = calculateJankenOutcome(playerChoice, opponentChoice);
    let spiritGained = 0; // This will be the final gain after all bonuses
    // Update stats first
    if (outcome === 'win') {
        playerData.stats.totalWins++;
    }
    else if (outcome === 'lose') {
        playerData.stats.totalLosses++;
    }
    else { // draw
        playerData.stats.totalDraws++;
    }
    // Calculate base spirit gain from win/draw/loss (excluding equipment)
    let baseGainForOutcome = 0;
    if (outcome === 'win') {
        baseGainForOutcome = 1; // Base for win
        const spiritPerWinLevel = playerData.upgrades['spiritPerWin'] || 0;
        if (spiritPerWinLevel > 0) {
            baseGainForOutcome += getUpgradeEffect('spiritPerWin', spiritPerWinLevel);
        }
    }
    else if (outcome === 'draw') {
        baseGainForOutcome = 0; // Or small amount, per game design
    } // 'lose' remains 0 base gain for this example
    // Apply equipment effects if it was a win
    if (outcome === 'win') {
        spiritGained = applyEquipmentEffects(playerData, baseGainForOutcome, 'jankenWin', playerChoice);
    }
    else {
        // For draws or losses, equipment effects for spirit gain are not applied in this design.
        spiritGained = baseGainForOutcome;
    }
    // Update hand usage stats
    if (playerChoice === 'rock')
        playerData.stats.rocksThrown++;
    else if (playerChoice === 'paper')
        playerData.stats.papersThrown++;
    else if (playerChoice === 'scissors')
        playerData.stats.scissorsThrown++;
    // Add gained spirit
    playerData.jankenSpirit += spiritGained;
    // Logging is now handled in main.ts's event handler for better separation
    // console.log(
    //   `Player chose ${playerChoice}, Opponent chose ${opponentChoice}. Outcome: ${outcome}. Spirit Gained: ${spiritGained}`
    // );
    return { opponentChoice, outcome, spiritGained };
}
