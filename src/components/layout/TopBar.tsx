import { mockMarketTickers } from "@/data/mockMarket";

export function TopBar() {
  return (
    <header className="top-bar" aria-label="主要マーケット指標">
      {mockMarketTickers.map((ticker) => (
        <section className="ticker" key={ticker.id}>
          <div className="ticker__label">{ticker.label}</div>
          <div className="ticker__main">
            <div className="ticker__value">{ticker.value}</div>
            <div className={`ticker__change ticker__change--${ticker.direction}`}>
              {ticker.change}
            </div>
          </div>
          <div className="ticker__updated">更新 {ticker.updatedAt} JST</div>
        </section>
      ))}
    </header>
  );
}
