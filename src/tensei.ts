import { PlayerData } from './types';
import { initializeDefaultPlayerData } from './playerData';

export function calculateTenseiTokens(playerData: PlayerData): number {
  // Example calculation: 1 token for every 10,000 Janken Spirit accumulated.
  // This is a placeholder. A better calculation might involve total spirit earned ever,
  // highest zone, specific achievements, etc. Player level isn't tracked yet.
  // Let's also add a small bonus for total wins.
  const spiritContribution = Math.floor(playerData.jankenSpirit / 10000);
  const winsContribution = Math.floor(playerData.stats.totalWins / 500); // 1 token per 500 wins

  // Minimum 1 token if eligible at all (e.g. spirit > 5000)
  if (playerData.jankenSpirit < 5000 && playerData.stats.totalWins < 100) return 0;

  return Math.max(0, spiritContribution + winsContribution);
}

export function performTensei(playerData: PlayerData): PlayerData {
  const tokensEarned = calculateTenseiTokens(playerData);

  if (tokensEarned <= 0 && playerData.jankenSpirit < 5000) { // Add a threshold to tensei
    // Not enough progress to Tensei, or no tokens would be earned.
    // In a real game, this button might be disabled or show "0 tokens".
    console.warn("Not enough progress to Tensei or no tokens would be earned.");
    return playerData; // Return original data, no Tensei performed
  }

  const previousTenseiTokens = playerData.tenseiTokens || 0;

  // Create a new default player data state
  const newPlayerData = initializeDefaultPlayerData();

  // Assign the newly earned Tensei tokens + any existing ones
  newPlayerData.tenseiTokens = previousTenseiTokens + tokensEarned;

  // Potentially carry over other persistent values here, for example:
  // newPlayerData.somePermanentUnlock = playerData.somePermanentUnlock;
  // newPlayerData.achievements = playerData.achievements;

  console.log(`Tensei performed! Earned ${tokensEarned} Tensei Tokens. Total: ${newPlayerData.tenseiTokens}`);
  return newPlayerData;
}
