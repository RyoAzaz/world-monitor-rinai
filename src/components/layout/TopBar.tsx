"use client";

import { useEffect, useMemo, useState } from "react";
import { mockMarketTickers } from "@/data/mockMarket";
import type { MarketTicker, UsdJpyRateResponse } from "@/types/dashboard";

type UsdJpyStatus = "loading" | "ready" | "error";

const usdjpyLoadingTicker: MarketTicker = {
  id: "usdjpy",
  label: "USDJPY",
  value: "取得中",
  change: "日次参照",
  direction: "flat",
  updatedAt: "--:--",
};

const usdjpyErrorTicker: MarketTicker = {
  id: "usdjpy",
  label: "USDJPY",
  value: "取得失敗",
  change: "再読込",
  direction: "flat",
  updatedAt: "--:--",
};

const dailyReferenceNote = "Frankfurter日次参照レート・リアルタイムではありません";

export function TopBar() {
  const [usdJpyTicker, setUsdJpyTicker] =
    useState<MarketTicker>(usdjpyLoadingTicker);
  const [usdJpyStatus, setUsdJpyStatus] = useState<UsdJpyStatus>("loading");

  useEffect(() => {
    let ignore = false;

    async function loadUsdJpy() {
      try {
        const response = await fetch("/api/market/usdjpy");

        if (!response.ok) {
          throw new Error("Failed to fetch USDJPY.");
        }

        const data = (await response.json()) as UsdJpyRateResponse;

        if (!ignore) {
          setUsdJpyTicker(data.ticker);
          setUsdJpyStatus("ready");
        }
      } catch {
        if (!ignore) {
          setUsdJpyTicker(usdjpyErrorTicker);
          setUsdJpyStatus("error");
        }
      }
    }

    void loadUsdJpy();

    return () => {
      ignore = true;
    };
  }, []);

  const tickers = useMemo(
    () =>
      mockMarketTickers.map((ticker) =>
        ticker.id === "usdjpy" ? usdJpyTicker : ticker,
      ),
    [usdJpyTicker],
  );

  return (
    <header className="top-bar" aria-label="主要マーケット指標">
      {tickers.map((ticker) => {
        const isUsdJpy = ticker.id === "usdjpy";
        const updatedText =
          isUsdJpy && usdJpyStatus === "loading"
            ? "取得中"
            : `更新 ${ticker.updatedAt} JST`;

        return (
          <section className="ticker" key={ticker.id}>
            <div className="ticker__label">{ticker.label}</div>
            <div className="ticker__main">
              <div className="ticker__value">{ticker.value}</div>
              <div className={`ticker__change ticker__change--${ticker.direction}`}>
                {ticker.change}
              </div>
            </div>
            <div className="ticker__updated">
              {updatedText}
              {isUsdJpy ? ` ・ ${dailyReferenceNote}` : null}
            </div>
          </section>
        );
      })}
    </header>
  );
}
