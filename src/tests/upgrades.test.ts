import { getUpgradeCost, getUpgradeEffect, UPGRADES_CONFIG, buyUpgrade } from '../upgrades';
import { PlayerData } from '../types';
import { initializeDefaultPlayerData } from '../playerData';

// --- Simple Assertion Framework (can be shared if tests grow larger) ---
let testsPassed = 0;
let testsFailed = 0;

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual === expected) {
    console.log(`%cPASS: ${message}`, 'color: green;');
    testsPassed++;
  } else {
    console.error(`%cFAIL: ${message}\nExpected: ${expected}, Actual: ${actual}`, 'color: red;');
    testsFailed++;
  }
}

function assertTrue(condition: boolean, message: string) {
    if (condition) {
      console.log(`%cPASS: ${message}`, 'color: green;');
      testsPassed++;
    } else {
      console.error(`%cFAIL: ${message}`, 'color: red;');
      testsFailed++;
    }
  }

// --- Test Cases ---

function testGetUpgradeCost() {
  console.log('\n--- Testing getUpgradeCost ---');
  const spiritPerWinConfig = UPGRADES_CONFIG.spiritPerWin;
  if (!spiritPerWinConfig) {
    console.error('FAIL: spiritPerWin config not found!');
    testsFailed++;
    return;
  }

  assertEqual(getUpgradeCost('spiritPerWin', 0), spiritPerWinConfig.baseCost, 'Cost of spiritPerWin L0->L1');
  const expectedL1Cost = Math.floor(spiritPerWinConfig.baseCost * spiritPerWinConfig.costMultiplier);
  assertEqual(getUpgradeCost('spiritPerWin', 1), expectedL1Cost, 'Cost of spiritPerWin L1->L2');
}

function testGetUpgradeEffect() {
  console.log('\n--- Testing getUpgradeEffect ---');
  const spiritPerWinConfig = UPGRADES_CONFIG.spiritPerWin;
  if (!spiritPerWinConfig) {
    console.error('FAIL: spiritPerWin config not found!');
    testsFailed++;
    return;
  }

  assertEqual(getUpgradeEffect('spiritPerWin', 0), 0, 'Effect of spiritPerWin L0');
  assertEqual(getUpgradeEffect('spiritPerWin', 1), spiritPerWinConfig.baseEffect * 1, 'Effect of spiritPerWin L1');
  assertEqual(getUpgradeEffect('spiritPerWin', 2), spiritPerWinConfig.baseEffect * 2, 'Effect of spiritPerWin L2');
}

function testBuyUpgrade() {
  console.log('\n--- Testing buyUpgrade ---');
  let playerData = initializeDefaultPlayerData();

  // Test buying 'spiritPerWin' successfully
  const spiritPerWinId = 'spiritPerWin';
  const costL0 = getUpgradeCost(spiritPerWinId, 0);
  playerData.jankenSpirit = costL0 + 50; // Enough spirit

  let success = buyUpgrade(playerData, spiritPerWinId);
  assertTrue(success, 'Buy spiritPerWin L1 should be successful');
  assertEqual(playerData.upgrades[spiritPerWinId], 1, 'spiritPerWin level should be 1');
  assertEqual(playerData.jankenSpirit, 50, `Spirit should be deducted correctly (initial ${costL0+50} - cost ${costL0})`);

  // Test buying when not enough spirit
  const costL1 = getUpgradeCost(spiritPerWinId, 1);
  playerData.jankenSpirit = costL1 - 1; // Not enough spirit for L2

  success = buyUpgrade(playerData, spiritPerWinId);
  assertTrue(!success, 'Buy spiritPerWin L2 should fail (not enough spirit)');
  assertEqual(playerData.upgrades[spiritPerWinId], 1, 'spiritPerWin level should remain 1');
  assertEqual(playerData.jankenSpirit, costL1 - 1, 'Spirit should not change on failed purchase');

  // Test buying a non-existent upgrade
  playerData.jankenSpirit = 1000;
  success = buyUpgrade(playerData, 'nonExistentUpgrade');
  assertTrue(!success, 'Buying non-existent upgrade should fail');
  assertEqual(playerData.jankenSpirit, 1000, 'Spirit should not change on buying non-existent upgrade');

}


// --- Test Runner ---
export function runUpgradesTests() {
  testsPassed = 0;
  testsFailed = 0;
  console.log('======== Running Upgrades Tests ========');

  testGetUpgradeCost();
  testGetUpgradeEffect();
  testBuyUpgrade();

  console.log('\n------------------------------------');
  console.log(`Upgrades Tests Summary: ${testsPassed} passed, ${testsFailed} failed.`);
  console.log('====================================');
  return testsFailed === 0;
}

// Optional: Run tests if this file is executed directly
// if (typeof require !== 'undefined' && require.main === module) {
//   runUpgradesTests();
// }
