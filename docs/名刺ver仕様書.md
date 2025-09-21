# 名刺作成＆3D配置アプリ 仕様書（名刺ver）

最終更新: 2025-09-21
作成者: 優花（補佐: すえまるさんの要件ヒアリングに基づく）

---

## 0. 概要
- 本ドキュメントは、既存のカードショーケース（`app/components/card/*`）の技術/表現を継承しつつ、「Xプロフィール風の名刺」を作成し、PDF/画像として出力、かつ3D空間で1枚をリッチに展示・反転できる派生アプリの仕様を定義する。
- 参照デザイン/UIの基準: `/Users/keita.suezaki/Downloads/名刺デザインsample`（以下、名刺サンプル）
- デプロイ想定: Vercel
- MVPではログイン/ユーザー管理は無し。公開時はURL発行のみ（非公開/モデレーション無し）。

---

## 1. 目的とユースケース
- ユーザーが自分のXプロフィール風名刺をブラウザで作成。
- 作成した名刺を3D空間内で表示し、端末の傾き/ポインタ操作で反転やパララックス表現を楽しむ。
- 名刺をPDF（2ページ: 表/裏）と画像（PNG/JPEG）で出力して印刷やSNS共有に利用。
- 共有リンクを発行し、誰でもURLから閲覧できる（編集不可）。

---

## 2. 非機能要件（MVP）
- 対応端末: 一般的なPC/スマホの最新ブラウザ（Chrome/Safari/Edge/Firefoxの直近2バージョン想定）
- パフォーマンス: モバイルで滑らかに操作できることを要件化（モバイル対応メモ準拠）。
  - 目標: iPhone 12 以降 / Pixel 6 以降で 55fps 以上、LCP ≤ 2.0s。
  - 将来、品質自動調整（`@react-three/drei`の`PerformanceMonitor`）を段階導入可能な構造に。
- アクセシビリティ: 基本のキーボード操作/代替テキストを整備（PDF/画像出力は視覚表現優先）。
- セキュリティ/権利: ユーザーアップロードにライセンス注意喚起を表示。

---

## 3. 設計方針（高レベル）
- Next.js + React（既存踏襲）
- 3D表現: React Three Fiber（R3F）+ drei
- 既存のホログラム表現（`HologramMaterialImpl`）を汎用化し、名刺の各レイヤに適用可能とする
- レンダリングパイプライン:
  1) 名刺レイアウト（表/裏）を2D Canvasで合成（高DPI可）。
  2) 合成結果をR3Fテクスチャとしてカード両面のPlaneに貼る。
  3) 要素別ホログラムは薄いZオフセットのオーバーレイPlaneで再現（プリセット中心）。
  4) PDF/画像出力は2D Canvasをソースに2ページPDFまたはPNG/JPEGを生成。
- 背景空間は既存`SceneBackground`を拡張し、色/スパークルをユーザーが調整可能に。

---

## 4. ドメインモデル
### 4.1 BusinessCardSpec（名刺全体）
- size: 日本標準 91mm x 55mm
- bleed: 3mm（推奨、ユーザー非編集。PDF/画像の作図時に反映）
- safeMargin: 3mm（推奨、ガイドのみ。出力は仕上がり基準）
- dpi: 350（初期値。300〜600の範囲で内部的に切替可能だがUIは非公開）
- front: CardSideSpec（表）
- back: CardSideSpec（裏）
- background: BackgroundSpec（3D空間の背景設定）
- export: ExportSpec（出力形式の既定）

### 4.2 CardSideSpec（面）
- layers: LayerSpec[]（下から順に合成）
  - 代表的なレイヤ種別:
    - backgroundImage（ヘッダー）
    - profileImage（プロフィール画像）
    - text（名前/ユーザー名/自己紹介/ウェブサイトなど）
    - frame/deco（装飾、必要に応じ）
- hologram: EffectPresetId | EffectSettings（面全体のホログラム強度。レイヤ個別値で上書き可）

### 4.3 LayerSpec
- type: 'backgroundImage' | 'profileImage' | 'text' | 'frame' | 'deco'
- transform: { x, y, scale, rotation }
- opacity: number
- blendMode: 'normal'（将来拡張）
- hologram?: EffectPresetId | EffectSettings（無指定なら面/全体の設定に従う）
- textPayload?（typeがtextの時): { content, fontFamily, fontSizePx, lineHeight, color, align }
- imagePayload?（image系の時): { src, objectFit, focalPoint }

### 4.4 EffectSettings（ホログラム）
- intensity, maskPower, tint, parallax, burstGain, kickGain
- プリセット中心（weak/medium/strong）。数値は将来的にUI開放可能。

### 4.5 BackgroundSpec（3D空間）
- gradientStops: [color1, color2, color3]
- sparkles: { colors: string[], count: number, size: number, speed: number, opacity: number }

### 4.6 ExportSpec
- pdf: { pages: 2固定, colorProfile: 'sRGB', includeTrimMarks: false（初期）, metadata: { title, author（任意）, subject（任意） } }
- image: { formats: ['png','jpeg'], longEdgePx: 2048（SNS向け出力に利用）, quality: 0.92（JPEG） }

---

## 5. レイアウト仕様（名刺サンプル準拠）
- 表: Xプロフィール風
  - ヘッダー画像（上部広め）
  - 左上寄りにプロフィール円形サムネイル
  - 1行: 名前 + 絵文字 + @username（省略トリミング）
  - 自己紹介: 180文字上限。レイアウト優先で、はみ出しは省略記号でカット（Canvasレイアウト時に文字数を適応的に切詰）。
  - ウェブサイト: 左アイコン + URL（はみ出しは省略）
- 裏:
  - XプロフィールQR（必須）
  - ウェブサイトQR（任意）
- 推奨解像度（内部合成）
  - 仕上がり（91x55mm）+塗り足し（各3mm）= 97x61mm
  - 350DPI想定 → 1339px x 842px
  - 内部Canvasはこの解像度で作成（エディタプレビューは低DPI縮小）

---

## 6. 3D表示/インタラクション
- 1枚のみ配置。
- 反転操作: 端末の傾きとポインタの回転入力を継承し、「傾ける方向にグルンとY回転」で表⇄裏を反転。
  - 実装案: `CardController`を拡張し、一定閾値の傾斜/ドラッグ量でY回転を180°に補間（慣性/イージングは既存`easeOutCubic`系を踏襲）。
  - 反転時は前後のホログラム強度を微調整して見栄えを担保。
  - モバイル入力: Pointerイベントに統一。`setPointerCapture`でキャプチャし、境界跨ぎの入力欠落を防止。`touch-action: none` / `overscroll-behavior: none` / `-webkit-user-select: none` / `-webkit-tap-highlight-color: transparent` をインタラクティブコンテナに適用。
  - チルト仕様: 最大±12°、慣性減衰≈0.92、スナップバック≈360ms。Reduced Motion時は振幅50%（速度維持）。
- 背景: `SceneBackground`をプロップ化
  - colors/スパークル `count/size/speed/opacity` をUIから設定→R3Fに反映。

---

## 7. エディタUI（MVP）
- 基本編集（名刺サンプル準拠のMinimal UI）
  - 画像アップロード: ヘッダー/プロフィール
  - テキスト入力: 名前/ユーザー名/自己紹介/ウェブサイト
    - 自己紹介は180文字上限、Canvas合成時はみ出しカット
  - プリセット選択: ホログラム（weak/medium/strong）
  - 背景調整: グラデ3色とスパークル簡易パラメータ
  - 表/裏プレビュー切替、3D反転プレビュー
- 保存/読込
  - ローカル保存（`localStorage` + JSONエクスポート/インポート）
- 共有
  - 「公開」押下で静的な共有ページ用JSONを生成→URL（クエリ/fragment）にエンコード、または短縮ID（将来サーバ導入時に置換可能）
- 注意喚起
  - アップロード素材の権利/ライセンス遵守をモーダル/トーストで明示

---

## 8. 出力機能
### 8.1 PDF
- 2ページ（1ページ=表、2ページ=裏）。
- sRGBで埋め込み。印刷所のCMYK変換はユーザー側or外部サービス想定。
- 350DPIのCanvasをベースにベクターではなくラスター配置。
- メタデータ: title=名刺タイトル、author=ユーザー入力 or 空、subject=“Business Card”
- トンボ/面付け: MVPは無し。
- 実装: クライアント完結（`pdf-lib`または`jsPDF`）。Vercelで無問題。将来必要であればPlaywright/Chromiumを検討。

### 8.2 画像
- PNG/JPEG両対応。
- 長辺2048pxの縮小プリセット（SNS向け）。
- 透過は不要。

---

## 9. 技術設計（詳細）
### 9.1 ディレクトリ案
- `app/business-card/editor/*` エディタUI
- `app/business-card/viewer/*` 3Dビューワ（R3F）
- `app/business-card/export/*` PDF/画像出力
- `app/business-card/state/*` Zustand/Jotai（編集中データ、UI状態）
- `app/business-card/types/*` Spec/型定義

### 9.2 既存コンポーネントの再利用
- `CardCanvas`/`CardScene`/`HologramMaterial`/`SceneBackground` を名刺アスペクト/両面対応に拡張
  - カード実寸比: 表示用は任意のスケール、アスペクトは 91:55 準拠
  - 両面Plane: front/backメッシュ＋要素オーバーレイPlane
  - `CardController`拡張: 傾き→反転判定/補間

### 9.3 2D Canvas合成
- レイヤ順で描画（背景→ヘッダー→プロフィール→テキスト→装飾）
- テキストの省略処理: 計測しながら行末で切り、上限行数/高さを超えたら省略記号付与
- 出力DPI: 350（定数）
- 座標/寸法はmmベース→pxへ変換（`px = mm * dpi / 25.4`）
- ガイド（塗り足し/安全域）はエディタ表示のみ（PDF本体には描かない）

### 9.4 ホログラムプリセット
- weak: { intensity: 0.6, maskPower: 1.2, tint: #75c8ff, parallax: 0.02, burstGain: 0.4, kickGain: 0.3 }
- medium: { intensity: 1.0, maskPower: 1.35, tint: #6ab9ff, parallax: 0.03, burstGain: 0.6, kickGain: 0.45 }
- strong: { intensity: 1.4, maskPower: 1.6, tint: #5bb0ff, parallax: 0.04, burstGain: 0.8, kickGain: 0.6 }
- 既存`HologramMaterialImpl`の`uIntensity,uMaskPower,uTint,uParallax,uBurst,uKick`にマッピング

### 9.5 共有URL
- MVP: 「公開」操作でJSONをURLフラグメントにエンコード（`#data=...`）。
  - 長大化を避けるため、画像は含めず、外部URLまたはDataURL短縮（任意）。
  - 将来サーバ導入時に短縮IDを発行→`/v/{id}` で閲覧。

---

## 10. 既知の不確定事項/リスクと対応
- 印刷所仕様（CMYK/ICC/トンボ/面付け）
  - 現時点: sRGB/350DPIラスター2ページPDFで多くのオンライン印刷は受理されうるが、厳密な色再現/面付け要件は印刷所次第。
  - 推奨方針: MVPリリース後、利用想定の印刷所（例: ラクスル/グラフィック/プリントパックなど）の入稿仕様を確認。必要に応じてCMYK変換/トンボ/面付けオプションを追加。
- フォント
  - 現状: 指定無し。Google Fontsから視認性の高い汎用フォント（Noto Sans, Inter等）を想定。
  - 対応: MVPはWebフォント限定で実装。後続で選択肢拡充可。
- 端末依存の傾きセンサー精度
  - 対応: デスクトップではポインタ操作/ドラッグで反転。モバイルはDeviceOrientation APIの権限取得後に有効化。閾値/感度は設定可能に。

---

## 11. ライセンス/法務表示
- アップロード素材は利用者自身が権利を有するか、適正なライセンスのものを使用することを明示。
- 名刺サンプルに含まれる外部素材（Unsplash等）のライセンス注意書きをアプリ内の「クレジット」モーダルに掲示可能な構造を用意。

---

## 12. 画面一覧（MVP）
- エディタ画面
  - 左ペイン: 入力フォーム（画像/テキスト/プリセット/背景）
  - 右ペイン: プレビュー（2D/3D切替、表/裏、反転）
  - ヘッダー: 新規/保存/読み込み/公開/書き出し（PDF, PNG, JPEG）
- ビューワ（共有URL）
  - 3D表示のみ（編集不可）。反転操作は有効。

---

## 13. API/バックエンド
- MVPでは無し。

---

## 14. 将来拡張
- 品質自動調整（drei PerformanceMonitor）
- サーバ保存/短縮URL/公開ギャラリー
- 面付け/トンボ/ICCプロファイル指定
- 多言語対応
- テンプレ/バージョン履歴

---

## 15. 受け入れ条件（MVP）
- 名刺の表/裏をエディタで作成し、3Dで反転プレビューができる。
- PDF（2ページ、sRGB、350DPI相当）を書き出せる。
- PNG/JPEG（長辺2048pxプリセット）を書き出せる。
- ローカル保存/読み込みができる。
- 共有URL（フラグメント方式）で閲覧可能。
- アップロード素材のライセンス注意喚起を表示する。
 - モバイル操作要件を満たす:
   - iPhone 12 / Pixel 6 以降で 55fps 以上、LCP ≤ 2.0s（実機目安）。
   - Pointer Capture によりドラッグ操作が途切れない。
   - `touch-action: none` 等が適用され、WebKit既定ジェスチャに操作が奪われない。

---

## 16. 実装メモ（技術）
- mm→px変換: `px = Math.round(mm * dpi / 25.4)`
- 2D→3Dテクスチャ: `CanvasRenderingContext2D`で合成→`new THREE.CanvasTexture(canvas)`
- 反転補間: `quaternion.slerp`または`Euler`でY軸回転をイージング
- 低DPIプレビュー: 内部高DPIキャンバスから縮小描画（パフォーマンス確保）
- PDF: `pdf-lib`でページサイズをmm換算（仕上がりサイズ）に設定し、画像をピクセル等倍配置
 - モバイル入力: `pointerdown`で`setPointerCapture(pointerId)`、`pointermove/up/cancel`で一元処理。`touchmove`の`preventDefault`は非パッシブな最後の保険として1箇所のみ。
 - CSS: ルートコンテナに `touch-action: none; overscroll-behavior: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;` を適用。

---

## 17. 参考
- 既存コード: `app/components/card/*`（`CardScene`, `CardCanvas`, `HologramMaterial`, `SceneBackground`）
- 名刺サンプル: `/Users/keita.suezaki/Downloads/名刺デザインsample`