import { EquipmentItem, EquipmentRarity, EquipmentEffect, HandChoice, PlayerData } from './types';

const EQUIPMENT_TYPES = ['Glove', 'Helm', 'Accessory', 'Boots'];
const RARITIES: EquipmentRarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

// Basic name generation parts
const ADJECTIVES_COMMON = ['Basic', 'Old', 'Worn', 'Simple'];
const ADJECTIVES_UNCOMMON = ['Sturdy', 'Reliable', 'Improved', 'Fine'];
const ADJECTIVES_RARE = ['Ornate', 'Special', 'Glowing', 'Potent'];
const ADJECTIVES_EPIC = ['Masterwork', 'Ancient', 'Radiant', 'Powerful'];
const ADJECTIVES_LEGENDARY = ['Mythical', 'Divine', 'Legendary', 'Unrivaled'];

const NOUNS_GLOVE = ['Gloves', 'Gauntlets', 'Handwraps', 'Mitts'];
const NOUNS_HELM = ['Helm', 'Cap', 'Crown', 'Visor'];
const NOUNS_ACCESSORY = ['Ring', 'Amulet', 'Charm', 'Talisman'];
const NOUNS_BOOTS = ['Boots', 'Greaves', 'Sabatons', 'Footsteps'];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomEquipment(playerLevel: number): EquipmentItem {
    // Determine Rarity (simplified)
    let rarity: EquipmentRarity;
    const randRarity = Math.random();
    if (randRarity < 0.05 && playerLevel > 20) rarity = 'Legendary'; // 5%
    else if (randRarity < 0.15 && playerLevel > 10) rarity = 'Epic';   // 10%
    else if (randRarity < 0.30 && playerLevel > 5) rarity = 'Rare';    // 15%
    else if (randRarity < 0.60) rarity = 'Uncommon'; // 30%
    else rarity = 'Common';                         // 40%

    const itemType = getRandomElement(EQUIPMENT_TYPES);

    let adjectives: string[];
    let nouns: string[];
    switch(rarity) {
        case 'Legendary': adjectives = ADJECTIVES_LEGENDARY; break;
        case 'Epic': adjectives = ADJECTIVES_EPIC; break;
        case 'Rare': adjectives = ADJECTIVES_RARE; break;
        case 'Uncommon': adjectives = ADJECTIVES_UNCOMMON; break;
        default: adjectives = ADJECTIVES_COMMON;
    }
    switch(itemType) {
        case 'Glove': nouns = NOUNS_GLOVE; break;
        case 'Helm': nouns = NOUNS_HELM; break;
        case 'Accessory': nouns = NOUNS_ACCESSORY; break;
        case 'Boots': nouns = NOUNS_BOOTS; break;
        default: nouns = ['Item'];
    }
    const name = `${getRandomElement(adjectives)} ${getRandomElement(nouns)} of Janken`;

    const effects: EquipmentEffect[] = [];
    const numEffects = RARITIES.indexOf(rarity) + 1; // Common:1, Uncommon:2, ..., Legendary:5

    for (let i = 0; i < numEffects; i++) {
        const effectTypeRand = Math.random();
        let effect: EquipmentEffect | null = null;

        if (effectTypeRand < 0.4) { // Spirit Boost
            effect = { type: 'spiritBoost', value: (RARITIES.indexOf(rarity) + 1) * 2 + Math.floor(Math.random() * 5) };
        } else if (effectTypeRand < 0.7) { // Hand Damage (conditional spirit boost)
            const handCondition = getRandomElement<HandChoice>(['rock', 'paper', 'scissors']);
            effect = {
                type: 'handDamage', // This implies a percentage boost
                value: (RARITIES.indexOf(rarity) + 1) * 0.05 + Math.random() * 0.1, // 5-15% for common, up to 25-35% for legendary
                handCondition: handCondition
            };
        } else { // Crit Chance
             effect = { type: 'critChance', value: (RARITIES.indexOf(rarity) + 1) * 0.01 + Math.random() * 0.02 }; // 1-3% for common
        }
        if (effect) effects.push(effect);
    }

    // Ensure at least one effect for higher rarities if somehow loop failed
    if (rarity !== 'Common' && effects.length === 0) {
        effects.push({ type: 'spiritBoost', value: (RARITIES.indexOf(rarity) + 1) * 2 });
    }


    return {
        id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
        name,
        type: itemType,
        rarity,
        effects,
        description: `${rarity} ${itemType}. Power echoes within.`, // Simple description
    };
}

export function applyEquipmentEffects(playerData: PlayerData, baseSpiritGain: number, actionType: 'jankenWin' | 'anySpiritGain', handPlayed?: HandChoice): number {
    let modifiedGain = baseSpiritGain;
    let critBonus = 0;
    let hasCrit = false;

    for (const item of playerData.equipment) {
        for (const effect of item.effects) {
            if (actionType === 'jankenWin') {
                if (effect.type === 'spiritBoost' && typeof effect.value === 'number') {
                    modifiedGain += effect.value;
                }
                if (effect.type === 'handDamage' && typeof effect.value === 'number' && effect.handCondition && effect.handCondition === handPlayed) {
                    modifiedGain *= (1 + effect.value); // Apply percentage bonus
                }
                if (effect.type === 'critChance' && typeof effect.value === 'number') {
                    if (Math.random() < effect.value) {
                        hasCrit = true;
                        // Crit bonus can be a multiplier of current gain or a flat amount
                        // For now, let's say crit doubles the current modifiedGain from other effects
                        // This will be applied once at the end if any crit occurs.
                    }
                }
            }
            // Could add 'anySpiritGain' effects here if any were designed
        }
    }

    if (hasCrit) { // Apply crit bonus at the end
      critBonus = modifiedGain; // Doubles the gain from non-crit effects
      // console.log("CRITICAL HIT! Spirit gain doubled for this win!"); // Would be nice in game log
    }

    return Math.floor(modifiedGain + critBonus);
}
