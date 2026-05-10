# RinAI Market Monitor α版

World Monitor をベースにした、日本語の投資・地政学ダッシュボードです。α版では「世界地図 + マーケットProxy + 公式RSSニュース」を1画面に統合し、NY市場後、東京寄り前、日中確認で使うための最小構成を実装しています。

このリポジトリは投資判断を支援する情報表示ツールです。投資助言、売買推奨、発注、AI分析は行いません。

## 起動手順

依存関係をインストールします。

```powershell
npm.cmd install
```

`.env.local` を作成し、必要なAPIキーを設定します。

```txt
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
FRED_API_KEY=your_fred_api_key_here
```

開発サーバーを起動します。

```powershell
npm.cmd run dev
```

ブラウザで次のURLを開きます。

```txt
http://localhost:3000
```

## 確認コマンド

型チェック:

```powershell
npm.cmd run typecheck
```

ビルド:

```powershell
npm.cmd run build
```

## 必要な環境変数

| 変数名 | 用途 | 備考 |
|---|---|---|
| `ALPHA_VANTAGE_API_KEY` | SPY / QQQ の日次ETFデータ取得 | サーバー側のみで使用。画面/APIレスポンスには出しません |
| `FRED_API_KEY` | VIXCLS / DGS10 の日次データ取得 | サーバー側のみで使用。画面/APIレスポンスには出しません |

`.env.local` はGit管理対象に含めません。

## α版で実装済みの範囲

### 基本UI

- Next.js + TypeScript
- App Router
- TypeScript strict mode
- 日本語UI
- ダークテーマ
- レスポンシブ対応
- TopBar横スクロール表示
- 左: MapLibre GL JS の世界地図
- 右: ニュース一覧

### マーケット表示

| 表示名 | データ元 | 性質 |
|---|---|---|
| `USDJPY` | Frankfurter API | 日次参照レート。リアルタイム為替ではありません |
| `S&P500 Proxy` | Alpha Vantage / SPY ETF | S&P500指数そのものではなく、SPY ETFの日次参照データです |
| `NASDAQ100 Proxy` | Alpha Vantage / QQQ ETF | NASDAQ-100指数そのものではなく、QQQ ETFの日次参照データです |
| `VIX` | FRED / VIXCLS | VIXの日次終値です。リアルタイムではありません |
| `米10年金利` | FRED / DGS10 | 米10年国債利回りの日次参照データです |
| `日経平均` | mock | 実データ未接続の参考値です |
| `SOX` | mock | 実データ未接続の参考値です |

Alpha Vantage無料枠は25 requests/dayを前提にしています。SPY/QQQは過剰リクエストを避けるため、サーバー側で3600秒以上の再検証間隔を設定しています。

### ニュース表示

- 公式RSS集約API: `/api/news`
- 初期RSSソース:
  - JPX: `https://www.jpx.co.jp/rss/markets_news.xml`
  - 金融庁: `https://www.fsa.go.jp/fsaNewsListAll_rss2.xml`
  - 財務省: `https://www.mof.go.jp/news.rss`
- 表示項目:
  - source
  - title
  - url
  - publishedAt
  - short summary
  - regionTags
  - marketImpact
- 一部RSS取得失敗時は、取得できたitemsを返し、`sourceStatuses` と `partialFailure` を表示します。
- 記事本文スクレイピング、長文本文保存、AI要約は行っていません。

### 地図イベント表示

- ニュース由来地図イベントAPI: `/api/map-events/news`
- `/api/news` の `regionTags` と `marketImpact` を使って、地図上に代表点を表示します。
- 同一 `regionTag` は集約し、件数と最大影響度を表示します。
- 地図上の点は関連地域の代表点であり、正確な発生地点ではありません。
- 地図イベント取得に失敗した場合はfallback mockを使用します。

## API Route一覧

```txt
/api/market/usdjpy
/api/market/sp500-proxy
/api/market/nasdaq100
/api/market/vix
/api/market/us10y
/api/news
/api/map-events/news
```

## α版の利用手順

### NYクローズ後

- `S&P500 Proxy` と `NASDAQ100 Proxy` で米国株式市場の方向感を確認します。
- `VIX` でリスクオン/オフの変化を確認します。
- `米10年金利` で金利環境の変化を確認します。
- 公式RSSニュースと地図イベントで背景材料を確認します。

### 東京寄り前

- `USDJPY`、米国株Proxy、`VIX`、`米10年金利` をまとめて確認します。
- 日本関連ニュース、金融庁/財務省/JPXの更新を確認します。
- 地図上の代表点で、地域別にニュースが偏っていないか確認します。

### 日中確認

- ニュース一覧の更新と一部RSS取得失敗表示を確認します。
- 地図イベントの件数、最大影響度、代表ニュースタイトルを確認します。
- マーケットカードは日次参照データ中心のため、日中のリアルタイム監視用途ではなく、背景確認として扱います。

## Known Issues / 未実装機能

- RinAI統合は未実装です。
- AI分析、AI要約、重要度のAI判定は未実装です。
- 認証、DB、Redis、SSE、WebSocketは未実装です。
- Watchlist保存、アラート、発注機能は未実装です。
- 日経平均とSOXはまだmock表示です。
- SPY/QQQはETF Proxyであり、指数そのものではありません。
- Frankfurter、Alpha Vantage、FREDはいずれもリアルタイム表示ではありません。
- Alpha Vantage無料枠が少ないため、頻繁なリロードで制限に当たる可能性があります。
- RSSニュースは公式RSSの範囲に限定しており、網羅的なニュース取得ではありません。
- 地図イベントは代表点表示であり、正確な発生地点や取引所所在地を表すものではありません。

## 今後の改善候補

1. SOX ProxyとしてSOXXまたはSMHを追加する。
2. 日本市場Proxyとして日経平均またはTOPIX連動ETFを追加する。
3. RSS/地図イベントの分類ルールを改善し、低影響ニュースのノイズをさらに下げる。
