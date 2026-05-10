"use client";

import { useEffect, useMemo, useState } from "react";
import { fallbackMarketTickers } from "@/data/mockMarket";
import type { ClientFetchStatus } from "@/types/api";
import type {
  MarketTicker,
  Nasdaq100QuoteResponse,
  UsdJpyRateResponse,
} from "@/types/dashboard";

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

const nasdaq100LoadingTicker: MarketTicker = {
  id: "nasdaq",
  label: "NASDAQ100 Proxy",
  value: "取得中",
  change: "日次参照",
  direction: "flat",
  updatedAt: "--:--",
};

const nasdaq100ErrorTicker: MarketTicker = {
  id: "nasdaq",
  label: "NASDAQ100 Proxy",
  value: "取得失敗",
  change: "再読込",
  direction: "flat",
  updatedAt: "--:--",
};

const dailyReferenceNote = "Frankfurter日次参照レート・リアルタイムではありません";
const nasdaq100ReferenceNote =
  "QQQ ETF日次参照・リアルタイムではありません";

export function TopBar() {
  const [usdJpyTicker, setUsdJpyTicker] =
    useState<MarketTicker>(usdjpyLoadingTicker);
  const [usdJpyStatus, setUsdJpyStatus] =
    useState<ClientFetchStatus>("loading");
  const [nasdaq100Ticker, setNasdaq100Ticker] = useState<MarketTicker>(
    nasdaq100LoadingTicker,
  );
  const [nasdaq100Status, setNasdaq100Status] =
    useState<ClientFetchStatus>("loading");

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

    async function loadNasdaq100() {
      try {
        const response = await fetch("/api/market/nasdaq100");

        if (!response.ok) {
          throw new Error("Failed to fetch NASDAQ-100 proxy.");
        }

        const data = (await response.json()) as Nasdaq100QuoteResponse;

        if (!ignore) {
          setNasdaq100Ticker(data.ticker);
          setNasdaq100Status("ready");
        }
      } catch {
        if (!ignore) {
          setNasdaq100Ticker(nasdaq100ErrorTicker);
          setNasdaq100Status("error");
        }
      }
    }

    void loadUsdJpy();
    void loadNasdaq100();

    return () => {
      ignore = true;
    };
  }, []);

  const tickers = useMemo(
    () =>
      fallbackMarketTickers.map((ticker) => {
        if (ticker.id === "usdjpy") {
          return usdJpyTicker;
        }

        if (ticker.id === "nasdaq") {
          return nasdaq100Ticker;
        }

        return ticker;
      }),
    [nasdaq100Ticker, usdJpyTicker],
  );

  return (
    <header className="top-bar" aria-label="主要マーケット指標">
      {tickers.map((ticker) => {
        const isUsdJpy = ticker.id === "usdjpy";
        const isNasdaq100 = ticker.id === "nasdaq";
        const isLoading =
          (isUsdJpy && usdJpyStatus === "loading") ||
          (isNasdaq100 && nasdaq100Status === "loading");
        const updatedText =
          isLoading ? "取得中" : `更新 ${ticker.updatedAt} JST`;
        const note = isUsdJpy
          ? dailyReferenceNote
          : isNasdaq100
            ? nasdaq100ReferenceNote
            : null;

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
              {note ? ` ・ ${note}` : null}
            </div>
          </section>
        );
      })}
    </header>
  );
}
