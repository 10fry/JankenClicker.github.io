# コアゲームプレイ詳細設計書

## 1. じゃんけんバトルメカニクス

*   **プレイヤー入力:**
    *   プレイヤーは画面に表示された「グー」「チョキ」「パー」のボタンをクリックすることで手を選択します。
    *   誤クリックを防ぐための確認ステップは、ゲームのテンポを考慮し、初期段階では導入しません。ただし、UI/UXテストの結果次第で検討の余地があります。
*   **対戦相手AI:**
    *   **初期AI:** 完全にランダムな手を選択します。
    *   **中級AI:** 加重ランダム選択。例えば、プレイヤーが過去N回で出した手を記録し、それに勝つ手を優先的に出す、あるいは特定の「得意な手」を持つなどの傾向を導入します。
    *   **上級AI (ボスや高難易度ステージ向け):**
        *   パターン認識：プレイヤーの出し手の傾向を分析し、カウンターを狙います。
        *   AI固有の「スペシャルムーブ」：ハックアンドスラッシュ（H&S）ドキュメントで定義される特殊能力（例：一定確率で後出しする、特定の手の威力を一時的に上げるなど）を使用します。
    *   **相手の手の決定と公開タイミング:**
        *   プレイヤーが手を選択し、決定したタイミングで、AIも同時に手を決定します。
        *   両者の手は画面中央でアニメーションと共に同時に公開され、緊張感を演出します。
*   **勝敗判定:**
    *   グー > チョキ > パー > グー の力関係を明確に示します。
    *   勝ち、負け、あいこの条件を判定します。
*   **視覚的フィードバック:**
    *   プレイヤーの選択した手、相手の選択した手が画面中央でぶつかり合うようなアニメーションを表示します。
    *   結果（「勝ち！」「負け…」「あいこ」）をテキストとエフェクトで明確に表示します。
    *   勝利時には通貨獲得のアニメーション（例：コインが飛び出す）を表示します。

## 2. リソース生成（主要通貨 - 例：じゃんけんスピリット / 勝利ポイント）

*   **基本生成量:**
    *   **勝利時:** 基本通貨量を10ポイントとします。これはアップグレードや敵の強さによって変動します。
    *   **あいこ時:** 基本通貨量の20%（2ポイント）を獲得します。戦略的な引き分け狙いも考慮し、少量ながらメリットを与えます。
    *   **敗北時:** 通貨獲得は0とします。ペナルティは現状なしとしますが、ゲームバランスを見て導入を検討します（例：微量の通貨減少、一時的なデバフ）。
*   **クリティカル勝利:**
    *   **概念:** 一定確率で「クリティカル勝利」が発生し、通常よりも大幅に多くのリソースを獲得できます。
    *   **基本クリティカル率:** 5%。
    *   **クリティカル勝利倍率:** 通常獲得量の3倍～10倍（初期は3倍、アップグレードや装備で上昇）。
*   **アップグレードの影響:**
    *   「勝利ごとの通貨増加」アップグレード：基本通貨量に対して加算または乗算ボーナス。初期は加算（例：+5ポイント）とし、ゲームが進むと乗算（例：+10%）も登場させます。
        *   計算式例（加算）： `通貨獲得量 = (基本通貨量 + アップグレード加算値) * クリティカル倍率 (クリティカル時)`
        *   計算式例（乗算）： `通貨獲得量 = 基本通貨量 * (1 + アップグレード乗算率) * クリティカル倍率 (クリティカル時)`
    *   「クリティカル率/クリティカルダメージ増加」アップグレード：それぞれ確率と倍率に直接加算されます。
*   **対戦相手の補正:**
    *   より強い対戦相手は、より多くの基本通貨をドロップします（例：ボスは通常敵の5倍）。
    *   H&Sドキュメントで定義される「裕福な」タイプの敵は、通貨ドロップ量に特定の乗算ボーナスが付きます（例：+50%）。

## 3. クリッキングメカニクス（じゃんけん開始とは別の場合）

*   **目的:** 本作における主要な「アクティブな」プレイヤーアクションは、じゃんけんの手を選択し、バトルを開始することです。伝統的なクリッカーゲームに見られる、バトルとは独立した「クリックで資源生成」専用のボタンは、ゲームの焦点をじゃんけんバトルに集中させるため、初期段階では実装しません。
*   **「クリック」の広義な意味:** UI操作、アップグレード購入、装備変更など、プレイヤーが行う全てのインタラクションを指します。資源生成に直接関わる「クリック」は、じゃんけんバトルの開始トリガーとなります。
*   **今後の検討事項:** ゲームの進行が停滞する場合や、よりアクティブな操作を求めるプレイヤー層への対応として、じゃんけんバトルとは別に、短期的なブースト効果（例：数秒間だけオートバトル速度アップ、次回の勝利時通貨量アップなど）を得られる限定的なクリッキング要素の導入を検討する可能性はあります。

## 4. オートメーションメカニクス (オートじゃんけん)

*   **オートメーションのアンロック:**
    *   特定のアップグレード（例：「自動じゃんけん装置」）を購入することでアンロックされます。
    *   または、特定のステージ進行度（例：ステージ10クリア）に到達することで解放されます。
*   **オートメーションの種類:**
    *   **「オートグー/チョキ/パー」:** プレイヤーが事前に設定した特定の手を自動的に繰り返し出し続けます。最もシンプルな自動化です。
    *   **「おまかせオートじゃんけん」:** 過去の対戦データや簡易的な予測に基づき、AIが自動的に手を判断してプレイします。手動プレイよりは効率が落ちるものの、放置中の進行には役立ちます。最初はランダム選択に近いものとし、アップグレードでAIの賢さが向上するようにします。
*   **オートメーションの速度:**
    *   自動化時の秒間/分間のバトル数。初期は1バトル/2秒程度。
    *   オートメーション速度を向上させるアップグレード（例：「高速化回路」、「熟練の自動操作」）を設けます。
*   **オートメーション中のリソース生成:**
    *   手動プレイ時と同じ勝ち/負け/あいこのリソース生成ルールを使用します。
    *   オートメーションに対する効率ペナルティは、初期段階では設けない方針です。プレイヤーがアンロックした機能の利便性を損なわないためです。ただし、ゲームバランスを見て、例えば「おまかせオート」の効率をやや下げる（例：手動プレイ時の90%）などの調整を検討する可能性はあります。

## 5. データフロー / 疑似コード例 (説明用)

*   `function calculateJankenOutcome(playerChoice, opponentChoice): outcome (WIN, LOSE, DRAW) を返す`
    ```pseudocode
    function calculateJankenOutcome(playerChoice, opponentChoice):
      if playerChoice == opponentChoice:
        return DRAW
      else if (playerChoice == "ROCK" and opponentChoice == "SCISSORS") or \
              (playerChoice == "SCISSORS" and opponentChoice == "PAPER") or \
              (playerChoice == "PAPER" and opponentChoice == "ROCK"):
        return WIN
      else:
        return LOSE
    ```

*   `function calculateResourceGain(outcome, baseAmount, criticalChance, criticalMultiplier, upgrades): currencyGained を返す`
    ```pseudocode
    function calculateResourceGain(outcome, baseAmount, playerStats, opponentModifiers):
      currencyGained = 0
      isCritical = false

      if outcome == WIN:
        // クリティカル判定
        if random_chance() < playerStats.criticalChance:
          isCritical = true
          currencyGained = baseAmount * playerStats.criticalMultiplier
        else:
          currencyGained = baseAmount

        // アップグレードによる通貨増加 (例: 加算と乗算)
        currencyGained += playerStats.flatCurrencyBonus
        currencyGained *= (1 + playerStats.percentageCurrencyBonus)

        // 敵による補正
        currencyGained *= opponentModifiers.currencyMultiplier

      else if outcome == DRAW:
        currencyGained = baseAmount * 0.2 // あいこ時の基本獲得量 (例: 勝利時の20%)
        // あいこ時にもアップグレードや敵補正を一部適用するかは別途検討

      // 敗北時は currencyGained = 0 のまま

      return currencyGained, isCritical // クリティカル発生有無も返す
    ```

*   `function onPlayerChoosesHand(playerHand):`
    ```pseudocode
    function onPlayerChoosesHand(playerHand):
      opponentHand = determineOpponentAIHand(playerStats, currentOpponent) // AIが相手の手を決定
      outcome = calculateJankenOutcome(playerHand, opponentHand)

      baseWinAmount = currentOpponent.baseCurrencyDrop
      resourceGainDetails = calculateResourceGain(outcome, baseWinAmount, player.stats, currentOpponent.modifiers)

      player.currency += resourceGainDetails.currencyGained

      updatePlayerCurrencyDisplay(player.currency)
      displayBattleResult(playerHand, opponentHand, outcome, resourceGainDetails.isCritical)

      // 経験値やその他のH&S要素の処理 (該当する場合)
      if outcome == WIN:
        player.experience += currentOpponent.expValue
        checkForLevelUp(player)
        rollForLootDrop(currentOpponent.lootTable)
    ```
