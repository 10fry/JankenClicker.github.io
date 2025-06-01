const LOCAL_STORAGE_KEY = 'jankenClickerWarsSave';
const CURRENT_VERSION = '0.1.0'; // Example version
export function initializeDefaultPlayerData() {
    const defaultStats = {
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        rocksThrown: 0,
        papersThrown: 0,
        scissorsThrown: 0,
    };
    const defaultEquipment = [];
    const defaultSkills = [];
    return {
        version: CURRENT_VERSION,
        lastSaveTimestamp: Date.now(),
        jankenSpirit: 0,
        upgrades: {
        // Example: spiritPerWin might be an upgrade ID
        // 'spiritPerWin': 0
        },
        stats: defaultStats,
        equipment: defaultEquipment, // Already there from previous subtask, ensure it's initialized
        skills: defaultSkills,
        tenseiTokens: 0, // Already there from previous subtask, ensure it's initialized
    };
}
export function saveGame(playerData) {
    try {
        playerData.lastSaveTimestamp = Date.now();
        playerData.version = CURRENT_VERSION;
        const dataString = JSON.stringify(playerData);
        localStorage.setItem(LOCAL_STORAGE_KEY, dataString);
        console.log('Game saved successfully.');
    }
    catch (error) {
        console.error('Error saving game:', error);
    }
}
export function loadGame() {
    var _a, _b, _c, _d, _e, _f, _g;
    let loadedData;
    try {
        const dataString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (dataString) {
            const parsedData = JSON.parse(dataString);
            // Basic version check and migration (can be expanded)
            if (parsedData.version !== CURRENT_VERSION) {
                console.warn(`Save data version mismatch. Found: ${parsedData.version}, Expected: ${CURRENT_VERSION}. Attempting to merge.`);
                // For now, we'll merge by taking defaults for missing top-level keys
                // A more robust migration would handle nested structures and specific version changes
                const defaultData = initializeDefaultPlayerData();
                loadedData = Object.assign(Object.assign(Object.assign({}, defaultData), parsedData), { version: CURRENT_VERSION });
                // Ensure nested objects like stats are also merged properly if they exist in parsedData
                if (parsedData.stats) {
                    loadedData.stats = Object.assign(Object.assign({}, defaultData.stats), parsedData.stats);
                }
                else {
                    loadedData.stats = defaultData.stats;
                }
                // Ensure upgrades is at least an empty object
                loadedData.upgrades = parsedData.upgrades || {};
                loadedData.equipment = parsedData.equipment || [];
                loadedData.skills = parsedData.skills || [];
            }
            else {
                loadedData = parsedData;
            }
            // Ensure all essential fields are present, falling back to defaults if necessary
            // This provides a basic level of data integrity
            const defaultForIntegrity = initializeDefaultPlayerData();
            loadedData.jankenSpirit = (_a = loadedData.jankenSpirit) !== null && _a !== void 0 ? _a : defaultForIntegrity.jankenSpirit;
            loadedData.upgrades = (_b = loadedData.upgrades) !== null && _b !== void 0 ? _b : defaultForIntegrity.upgrades;
            loadedData.stats = (_c = loadedData.stats) !== null && _c !== void 0 ? _c : defaultForIntegrity.stats;
            loadedData.equipment = (_d = loadedData.equipment) !== null && _d !== void 0 ? _d : defaultForIntegrity.equipment;
            loadedData.skills = (_e = loadedData.skills) !== null && _e !== void 0 ? _e : defaultForIntegrity.skills;
            loadedData.tenseiTokens = (_f = loadedData.tenseiTokens) !== null && _f !== void 0 ? _f : defaultForIntegrity.tenseiTokens;
            loadedData.lastSaveTimestamp = (_g = loadedData.lastSaveTimestamp) !== null && _g !== void 0 ? _g : Date.now();
            console.log('Game loaded successfully.');
            return loadedData;
        }
    }
    catch (error) {
        console.error('Error loading game:', error);
        // Fallback to default data if loading fails
    }
    // If no save data or error, return default
    console.log('No save data found or error in loading, initializing new game.');
    return initializeDefaultPlayerData();
}
