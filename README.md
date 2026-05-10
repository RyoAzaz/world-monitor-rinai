# World Monitor 投資・地政学ダッシュボード

World Monitor をベースにした、日本語の投資家向けダッシュボードです。「世界地図 + マーケット + ニュース」を1画面に統合し、市場データと背景ニュースを同じ画面で確認できる構成を段階的に実装しています。

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

## Phase3で追加した内容

- 公式RSSによるニュース取得
- サーバー側API Route: `/api/news`
- JPX、金融庁、財務省RSSの集約
- RSS XMLの取得、正規化、重複除去
- `regionTags` のルールベース付与
- `marketImpact: high / medium / low` のルールベース判定
- NewsPanelのLoading/Error表示
- ニュース由来の地図イベントAPI: `/api/map-events/news`
- ニュースの `regionTags` と `marketImpact` を使った地図上の代表点表示

ニュースは公式RSSに含まれる `title / source / url / publishedAt / summary` 程度の短い情報だけを表示します。記事本文のスクレイピング、長文本文の保存・再配布、AI要約、DB保存は行っていません。
summaryはRSS itemの `description` または `summary` のみを使用します。本文に近い `content:encoded` は再配布リスクを避けるため使用しません。summaryが空の場合、NewsPanelでは「概要なし」と控えめに表示します。

金融庁RSSのように `JST` 表記の日時が含まれる場合は、サーバー側で `+0900` として正規化します。`regionTags` は日本に加え、アジア、ASEAN、ADB、G7、G20、IMFをルールベースで付与します。`marketImpact` は採用、職員募集、調達、入札公告、メンテナンスなどを低影響として優先判定します。

地図上のニュース点は、ニュースに関連する地域の代表点です。正確な発生地点、取引所所在地、当局所在地、または記事本文から抽出した位置情報ではありません。同一 `regionTag` のニュースは地図イベントとして集約し、件数と最大影響度を表示します。

初期RSSソース:

- JPX: `https://www.jpx.co.jp/rss/markets_news.xml`
- 金融庁: `https://www.fsa.go.jp/fsaNewsListAll_rss2.xml`
- 財務省: `https://www.mof.go.jp/news.rss`

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

## サーバー側ニュースデータ構造

```txt
src/server/providers/news/rss-sources.ts
  公式RSSソース定義

src/server/providers/news/rss-provider.ts
  RSS XML取得、解析、ニュース項目への正規化

src/server/services/news-service.ts
  複数RSSの集約、重複除去、並び替え

src/app/api/news/route.ts
  service呼び出しとHTTPレスポンス変換

src/server/providers/map/region-coordinates.ts
  regionTagsと地図上の代表座標の対応表

src/server/services/news-map-service.ts
  NewsItemからニュース由来の地図イベントへの集約

src/app/api/map-events/news/route.ts
  ニュース由来地図イベントのHTTPレスポンス変換
```

## Phase2以降の予定

- 実API連携の設計と段階的導入
- マーケットデータ取得方式の確定
- ニュース取得方式の確定
- 地図イベントとニュースの接続
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
