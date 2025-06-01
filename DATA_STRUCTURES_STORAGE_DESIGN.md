# データ構造およびストレージ詳細設計書

## 1. 全体データオブジェクト (`playerData`)

*   全ての永続的なゲームデータを保持する単一のトップレベルJavaScriptオブジェクト。このオブジェクトは保存のためにJSONにシリアライズされます。
*   **基本構造例:**
    ```javascript
    let playerData = {
        lastSaveTimestamp: 0, // 最終保存タイムスタンプ
        version: "1.0.0",     // データ構造変更時のマイグレーション用バージョン

        // 通貨
        jankenSpirit: 0,      // じゃんけんスピリット (主要通貨)
        sacredTokens: 0,      // 聖なるトークン (転生通貨)

        // 進行状況
        playerLevel: 1,       // プレイヤーレベル
        playerEXP: 0,         // 現在の経験値
        currentOpponentIndex: 0, // 現在の対戦相手のインデックス (静的データ内のリストを指す)
        highestOpponentIndexDefeated: -1, // 倒した最も強い敵のインデックス
        ascensionCount: 0,    // 転生回数

        // アップグレード (主要通貨)
        upgrades: {
            // 例: 'jankenSpiritPerWin': { level: 0 }, // コストや効果は静的データから計算で求めるか、一部保持
            // 'critChance': { level: 0 },
        },

        // 転生アップグレード
        ascensionUpgrades: {
            // 例: 'globalSpiritBonus': { level: 0 },
        },

        // 装備
        equipmentSlots: {
            rightHand: null, // ItemObject または null
            leftHand: null,
            head: null,
            body: null,
            accessory1: null,
            accessory2: null,
        },
        inventory: [
            // ItemObject の配列
        ],

        // スキル
        skills: {
            // 例: 'forceWin': { level: 0, unlocked: false }, // スキルツリー上のアンロック状況とレベル
            // 'lootMagnet': { level: 1, unlocked: true }
        },
        skillPoints: 0,       // 未使用のスキルポイント

        // 設定
        settings: {
            volumeMaster: 0.8,
            volumeMusic: 0.5,
            volumeSFX: 0.7,
            showAnimations: true,
            numberFormatting: "short", // "short" (1M) or "long" (1,000,000)
        },

        // 統計情報 (実績ややりこみ指標用)
        stats: {
            totalWins: 0,
            totalLosses: 0,
            totalDraws: 0,
            rocksThrown: 0,
            papersThrown: 0,
            scissorsThrown: 0,
            criticalWins: 0,
            itemsLooted: 0,
            bossesDefeated: 0,
            // ... その他、追跡したい統計情報
        },

        // チュートリアル進行状況
        tutorialFlags: {
            //例: 'seenUpgradeScreen': false,
            // 'seenEquipmentScreen': false,
        }
    };
    ```

## 2. 主要データ型の詳細構造

*   **通貨:**
    *   `jankenSpirit`: `Number`。非常に大きな数値になる可能性があるため、JavaScriptの安全な整数上限 ( `Number.MAX_SAFE_INTEGER` ) を超える場合は、BigIntまたは専用ライブラリの使用を検討します。静的ページで手軽に始めるなら、初期は通常の `Number` で問題ありませんが、インフレを見越した設計が望ましいです。
    *   `sacredTokens`: `Number`。
*   **アップグレード (主要通貨 & 転生):**
    *   `upgrades` / `ascensionUpgrades`: キーがアップグレードID (例: `jankenSpiritPerWin`) のオブジェクト。
    *   各アップグレードオブジェクト: `{ level: Number }`。
        *   コスト、効果量、次のレベルの効果などは、この `level` と静的ゲームデータ（基本コスト、スケールファクターなど）に基づいてゲームロジック内で計算します。これにより `playerData` の肥大化を防ぎます。
*   **装備アイテムオブジェクト (`ItemObject`):**
    *   `id`: `String` (ドロップ時に生成されるUUIDなど、インベントリ内でユニークなID)。
    *   `baseItemKey`: `String` (例: "FireGloves", "BasicHelmet"。静的アイテム定義データを指すキー)。
    *   `name`: `String` (例: "灼熱の篭手")。基本名に接頭辞・接尾辞が付く形式も可。
    *   `type`: `String` (例: "Hand", "Head"。装備スロットに対応)。
    *   `rarity`: `String` (例: "Common", "Legendary", "Mythic")。
    *   `itemLevel`: `Number` (任意。アイテムの強さの指標)。
    *   `affixes`: オブジェクトの配列。例: `[{ key: "rockWinBonus", value: 0.15, description: "+15% グー勝利時スピリット" }]`。
        *   `key` は効果の種類を示す内部的な識別子。`description` はUI表示用。
    *   `icon`: `String` (アイコンファイルへのパス、またはCSSクラス名)。
    *   `equippedTimestamp`: `Number` (任意。装備した時刻。並び替えなどに使用)。
*   **スキル:**
    *   `skills`: キーがスキルID (例: `forceWin`) のオブジェクト。
    *   各スキルオブジェクト: `{ level: Number, unlocked: Boolean }`。
        *   `level` はスキルに投資したポイント数またはランク。
        *   `unlocked` はスキルツリー上でアンロックされているか否か。
*   **対戦相手データ (静的 vs 動的):**
    *   ほとんどの対戦相手の定義（ステータス、接辞、AIタイプ、ドロップテーブルなど）は静的ゲームデータとして保持し、`playerData` には含めません。
    *   `playerData.currentOpponentIndex` や `playerData.highestOpponentIndexDefeated` などで、静的データ内のどの対戦相手まで進行したかを追跡します。

## 3. 静的ゲームデータ (`playerData` の一部ではないが、ゲームによってロードされる)

*   このデータはゲームの「ルール」と利用可能なコンテンツを定義し、プレイヤー固有の進行状況ではありません。
*   例:
    *   全アップグレードの基本定義（初期コスト、コストスケーリング計算式、レベルごとの効果）。
    *   全装備の基本定義（種類、スロット、可能な接辞とその効果範囲、レアリティごとの接辞数、基本ステータス）。
    *   全スキルの定義（レベルごとの効果、習得コスト、前提条件、スキルツリー構造）。
    *   全対戦相手/ボスの定義（基本じゃんけんスピリット報酬、ドロップテーブル、使用可能性のある接辞、AIパターン、体力（もしあれば））。
    *   レアリティごとの色コードや表示名。
*   このデータは通常、別のJavaScriptファイル (`game_constants.js` など) やJSONファイル (`item_definitions.json`, `opponent_definitions.json` など) に保存され、ゲーム起動時にロードされます。

## 4. ストレージメカニズム (`localStorage`)

*   **データ保存:**
    *   `localStorage.setItem('jankenClickerSaveData', JSON.stringify(playerData));`
    *   保存タイミング:
        *   定期的 (例: 30～60秒ごと)。
        *   重要なイベント後 (例: 転生実行、ボス撃破、レアアイテム獲得、設定変更)。
        *   任意で、ウィンドウを閉じる直前 (`beforeunload` イベント。ただし、100%の信頼性はないため補助的に)。
*   **データ読込:**
    *   ゲーム起動時に `localStorage.getItem('jankenClickerSaveData');` で保存データ文字列を取得。
    *   `if (savedDataString) { playerData = JSON.parse(savedDataString); } else { /* 初回起動またはデータなし。デフォルトの playerData で初期化 */ }`
    *   `JSON.parse`時の潜在的なパースエラーを処理 (例: データ破損時)。
*   **データマイグレーション:**
    *   ロードした `playerData.version` が現在のゲームバージョンより古い場合、マイグレーション処理を実行。
    *   マイグレーション関数は、古いデータ構造を新しいバージョンに合わせて更新します（例: 新しいフィールドにデフォルト値を追加、既存データの変換）。
    *   例: `if (playerData.version === "1.0.0") { playerData.newFeatureSetting = defaultValue; playerData.version = "1.1.0"; }`
*   **インポート/エクスポート:**
    *   `playerData` を文字列（例: Base64エンコードされたJSON）にエクスポートし、プレイヤーがコピーできる機能。
    *   その文字列をインポートして現在の `playerData` を上書きする機能。バックアップや異なるブラウザ/デバイスへの移行に有用。

## 5. データ整合性とエラーハンドリング

*   `JSON.parse` および `JSON.stringify` は `try...catch` ブロックで囲み、エラー発生時の処理を記述します。
*   データロード後、基本的な検証を行います (例: 必須フィールドが存在するか、数値が期待される範囲内か)。
*   クリティカルなデータ (例: 通貨) が不正な値 (NaN, undefined) になっていないかチェック。
*   データ破損が検出された場合:
    *   可能であれば、破損部分をデフォルト値で修復試行。
    *   修復不可能な場合は、ユーザーに通知し、ゲームをデフォルト状態にリセットするか、バックアップからの復元を促す。
*   バックアップ戦略: 手動エクスポート機能の提供は、ユーザー自身によるシンプルなバックアップ手段となります。可能であれば、過去数バージョンのセーブデータをlocalStorage内に保持するローカルバックアップも検討。

このドキュメントは、プレイヤーの進行状況が正しく管理・維持されることを保証するために不可欠です。
