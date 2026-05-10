# World Monitor 投資・地政学ダッシュボード

World Monitor をベースにした、日本語の投資家向けダッシュボードです。Phase1では「世界地図 + マーケット + ニュース」を1画面に統合し、実API連携の前段としてダミーデータで動作する最小構成を実装しています。

## 起動方法

依存関係をインストールします。

```powershell
npm.cmd install
```

開発サーバーを起動します。

```powershell
npm.cmd run dev
```

起動後、ブラウザで次のURLを開きます。

```txt
http://localhost:3000
```

## 型チェック方法

```powershell
npm.cmd run typecheck
```

## ビルド方法

```powershell
npm.cmd run build
```

## 環境変数

NASDAQ100 Proxy（QQQ ETF）の取得にはAlpha Vantage APIキーが必要です。`.env.local` に次の値を設定します。

```txt
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

`.env.local` はGit管理対象に含めません。APIキーはサーバー側の `process.env.ALPHA_VANTAGE_API_KEY` からのみ読み込み、画面やAPIレスポンスには出しません。

## Phase1で実装済みの機能

- Next.js + TypeScript の基本構成
- App Router 構成
- ダークテーマの日本語UI
- レスポンシブ対応のダッシュボードレイアウト
- 上部マーケットバー
  - 日経平均
  - USDJPY
  - NASDAQ
  - SOX
- MapLibre GL JS を使った世界地図パネル
- ダミー地政学イベントの地図表示
- 日本語ニュース一覧パネル
- ダミーデータによる画面表示
- TypeScript strict mode 対応

## Phase2で追加した内容

- USDJPYのみ実データ接続
- サーバー側API Route: `/api/market/usdjpy`
- Frankfurter APIによるUSDJPY取得
- NASDAQ100 Proxy（QQQ ETF）の実データ接続
- サーバー側API Route: `/api/market/nasdaq100`
- Alpha Vantage APIによるQQQ ETF日次データ取得
- `src/server/services/market-service.ts` へのマーケット取得処理分離
- TopBarのUSDJPY/NASDAQ欄のみLoading/Error/更新時刻表示

Frankfurter APIのUSDJPYは日次参照レートです。リアルタイム為替レートではありません。
Alpha VantageのQQQ ETFは日次参照データです。リアルタイム価格ではありません。無料枠は25 requests/dayを前提に、サーバー側で3600秒以上の再検証間隔を設定しています。

当初はNASDAQ-100指数そのもの（NDX）の取得を検討しましたが、現在のAlpha Vantageキーでは `INDEX_DATA / NDX` が利用できませんでした。Phase2 MVPでは、Nasdaq-100 Indexを追跡するETFであるQQQを代替指標として採用しています。UIでは `NASDAQ100 Proxy` と表示し、NASDAQ-100指数そのものではないことを明示します。

## サーバー側マーケットデータ構造

```txt
src/server/services/market-service.ts
  USDJPY/NASDAQ100 Proxy取得処理、外部APIレスポンス検証、表示用データ整形

src/app/api/market/usdjpy/route.ts
  service呼び出しとHTTPレスポンス変換

src/app/api/market/nasdaq100/route.ts
  service呼び出しとHTTPレスポンス変換
```

将来、日経平均やNASDAQなどを追加する場合は、API Routeへ直接取得処理を書かず、`market-service.ts` に取得関数を追加してからRouteで呼び出します。

## Phase2以降の予定

- 実API連携の設計と段階的導入
- マーケットデータ取得方式の確定
- ニュース取得方式の確定
- 地図データとイベントデータの精度向上
- Watchlist、アラート、リアルタイム更新の検討
- RinAI 統合の設計

## Phase1では未実装のもの

- 認証
- DB
- Redis
- SSE
- WebSocket
- Watchlist保存
- アラート
- 有料API連携
- AI分析
- RinAI
- 発注機能
