# カードショーケース デモ仕様書

## 1. 実装概要
- Next.js (App Router) のクライアントコンポーネントとして `CardShowcase` を中核に構成。DOM オーバーレイと Three.js キャンバスを同期させてカード1枚のリッチプレビューを描画。
- 入力制御は `CardController` クラスに集約し、ポインタ／キーボードのチルト操作と演出トリガーを一元管理している。
- React Three Fiber (`@react-three/fiber`) を使い、`CardCanvas` → `CardScene` へ描画状態を渡すことで、Three.js のシーン制御を React の再レンダリングから切り離している。

## 2. コンポーネント構成
1. **CardShowcase** (`app/components/card/CardShowcase.tsx:18-193`)
   - コンテナ DOM を保持し、Pointer/Keyboard イベントを `CardController` にフォワード。
   - モーションリデュース・モバイル判定に応じてコントローラのスケールを調整し、Three.js 側と DOM オーバーレイの姿勢を同期。
   - `burstSignal` と `kickSignal` をステートで扱い、演出トリガを Canvas と Overlay 双方に配信。
2. **CardCanvas** (`app/components/card/CardCanvas.tsx:22-85`)
   - React Three Fiber の `Canvas` を初期化。Antialias や DPR、ToneMapping をモバイル／Reduced Motionに合わせて切り替え。
   - `PerformanceMonitor` でレンダリング負荷を測り、`quality` ステートを `high`/`medium`/`low` に調整して `CardScene` へ渡す。
3. **CardScene** (`app/components/card/CardScene.tsx:37-207`)
   - テクスチャロード／マテリアル初期化／アニメーションフレーム更新を担当。
   - `CardController` の `update` から得た回転・イントロ進捗に応じてカードの位置・スケール・ホログラムパラメータを更新。
4. **CardOverlay** (`app/components/card/CardOverlay.tsx:14-59`)
   - DOM レイヤーにタイトル、ステータス、フレーバー文を表示。`burstSignal`/`kickSignal` に連動した CSS モーションを適用。
5. **SceneBackground**
   - 背景演出の Three.js or fallback CSS を担当（詳細実装は別ファイル）。`reducedMotion`/`isMobile` に応じた描画切り替えを想定。

## 3. 入力制御仕様（CardController）
- `CardController` (`app/components/card/CardController.ts:1-153`) があらゆる入力イベントを処理し、カード回転 (`rotation: Vector2`) と演出イベントを管理。
- ポインタ操作: `handlePointerDown/Move/Up/Leave/Enter` が正規化座標に変換し、最大 ±12° まで傾き (`MAX_TILT_RAD`) を制限。
- キーボード: 矢印キーで `setKeyboardTilt` を更新し、ポインタ非操作時の代替操作を提供。
- 演出トリガー:
  - クリック（200ms以内 / 移動10px以内）を検出し `pendingBurst` をセット → `onBurst` コールバック。
  - ±9° を超える角度跨ぎを `detectKick` で監視し、クールダウン 0.22 秒後に `onKick` を発火。
- 慣性: `update` 内で回転目標との差分に基づき速度を積分し、`damping` と Snapback を適用して自然な揺れを再現。

## 4. 3D レイヤー構成
- 共通ジオメトリ: 幅 `5:7` 比の `PlaneGeometry` を再利用 (`app/components/card/CardScene.tsx:95-97`)。
- レイヤー順 (背面→前面):
  1. **Shadow Plate**: `meshBasicMaterial` 黒板 (`CardScene.tsx:162-164`) で背面の厚み影を擬似表現。
  2. **Back Hologram**: `HologramMaterialImpl` 背面 (`CardScene.tsx:166-168`) — 背景テクスチャをホログラム化。
  3. **Base Art**: `meshStandardMaterial` (`CardScene.tsx:170-172`) — メインアートを PBR ライトで描画。
  4. **Subject Overlay**: 任意の人物／メインモチーフ (`CardScene.tsx:174-183`) — 透明マテリアルで重ね合わせ。
  5. **Front Hologram**: `HologramMaterialImpl` 前面 (`CardScene.tsx:186-188`) — 角度依存の虹色反射。
  6. **Frame**: `meshPhysicalMaterial` (`CardScene.tsx:190-202`) — 金属感の枠とエミッシブで縁の輝きを表現。
- `burstSignal`/`kickSignal` により `frontMaterial`/`backMaterial` の `uBurst`/`uKick` を加算し、瞬間的な光量アップを実現 (`CardScene.tsx:145-157`)。

## 5. ホログラムシェーダー
- `HologramMaterialImpl` (`app/components/card/HologramMaterial.ts:1-98`) は `shaderMaterial` ベースのカスタムマテリアル。
- 頂点シェーダでビュー方向と法線から入射角 `vViewAngle` を算出し、フラグメントで `uMaskPower` に基づく角度マスクを生成。
- `noise` と `sin` 波で虹色干渉模様を合成し、`uParallax` でカードチルトに応じた流動感を付与。
- `uBurst`/`uKick` によるピンポイントな光量ブーストをサポート、`uTint` による色味調整も可能。

## 6. DOM オーバーレイ
- `CardOverlay` はカード表面のコピー表現を CSS で再現。
- レイアウトとスタイルは `CardShowcase.module.css:82-229` で管理。`--overlay-tilt` CSS カスタムプロパティを `CardShowcase` が更新し、DOM オーバーレイが 3D カードと同期して傾く。
- 演出: `burstSignal` → `.burstPulse`、`kickSignal` → `.haneFlash` を付与し、CSS アニメーションでハイライト。

## 7. データ仕様
- `CardSpec` (`app/data/cardSpec.ts:1-36`) でカードの文言・数値・アセットパスを定義。
- `assets` は `main`（全面アート）、`subject`（任意）、`background`（背面アート）を想定。
- `CardScene` が `useTexture` で同期ロードし、`subject` が未指定の場合は `main` を使い回す (`CardScene.tsx:51-66`)。

## 8. パフォーマンスとモバイル対応
- `CardCanvas` が `PerformanceMonitor` の `factor` に応じて品質ランクを動的変更 (`CardCanvas.tsx:36-52`)。
- モバイル判定時は初期品質を `medium`、DPR を `[1, 1.2]`、アンチエイリアスを無効化し負荷を抑制 (`CardCanvas.tsx:30-67`)。
- `CardScene` のホログラム強度やパララックス量は `quality` と `isMobile` に応じて逓減 (`CardScene.tsx:138-157`)。

## 9. 既知の制約
- カード形状は矩形 Plane を使用しているため、角丸のグロスマスクがカードジオメトリとずれ、光沢がはみ出す。
- DOM オーバーレイは画面サイズに依存した絶対配置が中心で、カード基準レイアウトとしては未完成。
- モバイル向けのジャイロ／タッチ専用 UI は未実装。`isMobile` 判定で品質を落としているが、完全対応ではない。
- カード厚みは薄板の疑似表現のみで、サイド面を持つ 3D メッシュは未導入。

---
この仕様書は現行デモ実装の把握を目的としたものです。後続フェーズで再設計する際のリファレンスとして活用してください。
