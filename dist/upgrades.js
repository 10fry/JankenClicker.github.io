// Define UPGRADES_CONFIG
export const UPGRADES_CONFIG = {
    spiritPerWin: {
        name: 'Spirit per Win',
        baseCost: 10,
        costMultiplier: 1.5, // Each level costs 1.5x the previous
        baseEffect: 1, // Base +1 spirit per win
        description: (level, effect, cost) => `Level ${level}: +${effect} Spirit per win. Cost: ${cost} Spirit.`,
    },
    // Add other upgrades here, e.g.:
    // criticalChance: {
    //   name: 'Critical Chance',
    //   baseCost: 100,
    //   costMultiplier: 2,
    //   baseEffect: 0.01, // Base +1% critical chance
    //   description: (level, effect, cost) =>
    //     `Level ${level}: +${(effect * 100).toFixed(2)}% Critical Chance. Cost: ${cost} Spirit.`,
    // },
};
export function getUpgradeConfig(upgradeId) {
    return UPGRADES_CONFIG[upgradeId];
}
export function getUpgradeEffect(upgradeId, level) {
    const config = getUpgradeConfig(upgradeId);
    if (!config || level === 0) {
        return 0;
    }
    // For simplicity, let's assume effect scales linearly with level for now
    // More complex scaling (e.g., exponential, or defined per upgrade) can be added
    // Example: spiritPerWin gives baseEffect per level.
    if (upgradeId === 'spiritPerWin') {
        return config.baseEffect * level;
    }
    // Example for a percentage-based upgrade if 'criticalChance' was active:
    // if (upgradeId === 'criticalChance') {
    //   return config.baseEffect * level; // e.g. level 1 = 0.01, level 2 = 0.02
    // }
    return config.baseEffect * level; // Default linear scaling
}
export function getUpgradeCost(upgradeId, level) {
    const config = getUpgradeConfig(upgradeId);
    if (!config) {
        return Infinity; // Or throw an error
    }
    // Cost = baseCost * (costMultiplier ^ level)
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, level));
}
export function buyUpgrade(playerData, upgradeId) {
    const config = getUpgradeConfig(upgradeId);
    if (!config) {
        console.error(`Upgrade ${upgradeId} not found in config.`);
        return false;
    }
    const currentLevel = playerData.upgrades[upgradeId] || 0;
    const cost = getUpgradeCost(upgradeId, currentLevel);
    if (playerData.jankenSpirit >= cost) {
        playerData.jankenSpirit -= cost;
        playerData.upgrades[upgradeId] = currentLevel + 1;
        console.log(`Bought upgrade: ${config.name} Level ${currentLevel + 1}`);
        return true;
    }
    else {
        console.warn(`Not enough Janken Spirit to buy ${config.name}. Need ${cost}, have ${playerData.jankenSpirit}`);
        return false;
    }
}
