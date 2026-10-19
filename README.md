# ぷるぷるゼリータワー

スマートフォンでゼリーを左右にドラッグし、指を離してお皿に積み上げる2Dバランスゲームです。Matter.js の重力・衝突・摩擦・回転と、Canvas の変形アニメーションを組み合わせています。iPhone / Android の縦画面とPCに対応します。

## 開発

Node.js 24 と npm を使用します。

```sh
npm ci
npm run dev
```

表示される開発サーバーをブラウザで開きます。PCではゲーム領域をクリックしてから左右キーで移動、スペースキーで落下できます。タッチ・マウスでも操作できます。ゼリーがお皿の下まで落ちるとゲームオーバーです。最高スコアと効果音設定は端末の localStorage に保存します。プライベートモード等で保存できなくてもプレイ可能です。音は最初の操作後に有効になります。

```sh
npm run build
npm run preview
```

`dist/` が公開対象です。APIキー・バックエンド・外部フォント・実行時CDNは不要です。依存ライブラリはビルドに含まれます。

## 自動テスト

```sh
npm ci
npx playwright install --with-deps chromium
npm run build
npm test
```

システムの Chromium を使う場合は `CHROMIUM_PATH=/usr/bin/chromium npm test`。テストは `/jelly-tower/` 配下で、タッチによる2個の積み上げ、落下とゲームオーバー、リトライ、ベスト記録保存、効果音設定保存、キーボード操作、オフライン再読み込み後のプレイを確認します。

## GitHub Pages で公開

1. GitHub の `tomotrp522-arch/jelly-tower` を開き、**Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。
2. `main` に push すると `.github/workflows/pages.yml` がビルド・ブラウザテスト・公開を実行します。設定を切り替えた後、必要なら **Actions → Test and deploy GitHub Pages → Run workflow** を実行してください。
3. Actions の deploy が成功したら、`https://tomotrp522-arch.github.io/jelly-tower/` で遊べます。無料の GitHub Pages が利用できるリポジトリ／プランで使用してください。

Vite の `base: './'`、manifest と Service Worker の相対URLにより、サブディレクトリでも動作します。公開URLの確定は Pages のデプロイ結果で確認してください。

## ホーム画面・オフライン

- iPhone: Safari で公開URLを開き、共有メニュー → **ホーム画面に追加**。
- Android: Chrome のメニュー → **ホーム画面に追加** または **アプリをインストール**。
- 初回はオンラインで開き、Service Worker のアセット保存完了後にオフラインで遊べます。HTTPS（開発時は localhost）が必要です。端末のキャッシュ削除後は再取得が必要です。
- 更新時にキャッシュ対象を変更した場合は `public/sw.js` の `VERSION` を更新してください。更新版のインストール後、開いているゲームをすべて閉じて再度開くと切り替わります。

## 構成

- `src.js`: 入力・Matter.js・カメラ・描画・Web Audio・スコア保存
- `style.css` / `index.html`: レスポンシブUI
- `public/`: PWA manifest・Service Worker・アイコン
- `tests/`: Playwright の実ブラウザテスト

柔らかさは剛体物理に重ねた視覚表現です。物理モデルそのものはソフトボディではありません。ブラウザの実機ごとの差は iPhone / Android でも確認してください。
