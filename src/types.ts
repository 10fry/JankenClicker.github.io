export type HandChoice = 'rock' | 'paper' | 'scissors';

export type Outcome = 'win' | 'lose' | 'draw';

export interface UpgradeConfigItem {
  name: string;
  baseCost: number;
  costMultiplier: number;
  baseEffect: number;
  description: (level: number, effect: number, cost: number) => string;
}

export interface UpgradesConfig {
  [upgradeId: string]: UpgradeConfigItem;
}

export interface PlayerStats {
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  rocksThrown: number;
  papersThrown: number;
  scissorsThrown: number;
}

export type EquipmentRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface EquipmentEffect {
  type: string; // e.g., 'spiritBoost', 'criticalChance', 'revealNextHand'
  value: number | string | boolean;
  handCondition?: HandChoice; // e.g., effect only applies if 'rock' wins
}

export interface EquipmentItem {
  id: string; // unique identifier
  name: string; // e.g., "炎のパーグローブ"
  type: string; // e.g., 'Glove', 'Helm', 'Accessory'
  rarity: EquipmentRarity;
  effects: EquipmentEffect[];
  description: string;
}

export type SkillType = 'Active' | 'Passive';

// Forward declaration for PlayerData to be used in Skill's effect
// Actual definition will come after Skill
// This is a common pattern for mutually referential types,
// but PlayerData is more central here.
// Alternatively, we can define all interfaces first, then types that use them.
// For now, let's assume 'any' for gameLogic if it's too complex to define upfront.
export interface PlayerData {
  version: string;
  lastSaveTimestamp: number;
  jankenSpirit: number;
  upgrades: { [upgradeId: string]: number }; // e.g., { spiritPerWin: 0 }
  stats: PlayerStats;
  equipment: EquipmentItem[];
  skills: Skill[]; // Skill will be defined below
  tenseiTokens: number; // for Tensei currency
}

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  cooldown?: number; // for Active skills
  effect: (playerData: PlayerData, gameLogic: any) => void; // gameLogic can be more specific later
}

export interface EnemyStats {
  name: string;
  preferredHand?: HandChoice;
  pattern?: HandChoice[];
  dropsCurrencyMultiplier?: number;
  dropsEquipment?: EquipmentItem[]; // Or a function to generate equipment
}
