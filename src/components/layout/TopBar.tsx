"use client";

import { useEffect, useMemo, useState } from "react";
import { fallbackMarketTickers } from "@/data/mockMarket";
import type { ClientFetchStatus } from "@/types/api";
import type {
  MarketTicker,
  Nasdaq100QuoteResponse,
  Us10yYieldResponse,
  UsdJpyRateResponse,
} from "@/types/dashboard";

const usdjpyLoadingTicker: MarketTicker = {
  id: "usdjpy",
  label: "USDJPY",
  value: "取得中",
  change: "日次参照",
  direction: "flat",
  updatedAt: "--:--",
  dataKind: "real",
  note: "Frankfurter日次参照レート・リアルタイムではありません",
  priority: 10,
};

const usdjpyErrorTicker: MarketTicker = {
  id: "usdjpy",
  label: "USDJPY",
  value: "取得失敗",
  change: "再読込",
  direction: "flat",
  updatedAt: "--:--",
  dataKind: "real",
  note: "Frankfurter日次参照レート・リアルタイムではありません",
  priority: 10,
};

const nasdaq100LoadingTicker: MarketTicker = {
  id: "nasdaq",
  label: "NASDAQ100 Proxy",
  value: "取得中",
  change: "日次参照",
  direction: "flat",
  updatedAt: "--:--",
  dataKind: "real",
  note: "QQQ ETF日次参照・リアルタイムではありません",
  priority: 20,
};

const nasdaq100ErrorTicker: MarketTicker = {
  id: "nasdaq",
  label: "NASDAQ100 Proxy",
  value: "取得失敗",
  change: "再読込",
  direction: "flat",
  updatedAt: "--:--",
  dataKind: "real",
  note: "QQQ ETF日次参照・リアルタイムではありません",
  priority: 20,
};

const us10yLoadingTicker: MarketTicker = {
  id: "us10y",
  label: "米10年金利",
  value: "取得中",
  change: "日次参照",
  direction: "flat",
  updatedAt: "--:--",
  dataKind: "real",
  note: "FRED日次参照・リアルタイムではありません",
  priority: 30,
};

const us10yErrorTicker: MarketTicker = {
  id: "us10y",
  label: "米10年金利",
  value: "取得失敗",
  change: "再読込",
  direction: "flat",
  updatedAt: "--:--",
  dataKind: "real",
  note: "FRED日次参照・リアルタイムではありません",
  priority: 30,
};

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
  const [us10yTicker, setUs10yTicker] =
    useState<MarketTicker>(us10yLoadingTicker);
  const [us10yStatus, setUs10yStatus] =
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
          setUsdJpyTicker({
            ...data.ticker,
            dataKind: "real",
            note: usdjpyLoadingTicker.note,
            priority: usdjpyLoadingTicker.priority,
          });
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
          setNasdaq100Ticker({
            ...data.ticker,
            dataKind: "real",
            note: nasdaq100LoadingTicker.note,
            priority: nasdaq100LoadingTicker.priority,
          });
          setNasdaq100Status("ready");
        }
      } catch {
        if (!ignore) {
          setNasdaq100Ticker(nasdaq100ErrorTicker);
          setNasdaq100Status("error");
        }
      }
    }

    async function loadUs10y() {
      try {
        const response = await fetch("/api/market/us10y");

        if (!response.ok) {
          throw new Error("Failed to fetch US10Y yield.");
        }

        const data = (await response.json()) as Us10yYieldResponse;

        if (!ignore) {
          setUs10yTicker({
            ...data.ticker,
            dataKind: "real",
            note: us10yLoadingTicker.note,
            priority: us10yLoadingTicker.priority,
          });
          setUs10yStatus("ready");
        }
      } catch {
        if (!ignore) {
          setUs10yTicker(us10yErrorTicker);
          setUs10yStatus("error");
        }
      }
    }

    void loadUsdJpy();
    void loadNasdaq100();
    void loadUs10y();

    return () => {
      ignore = true;
    };
  }, []);

  const tickers = useMemo(
    () =>
      [
        usdJpyTicker,
        nasdaq100Ticker,
        us10yTicker,
        ...fallbackMarketTickers,
      ].sort((tickerA, tickerB) => {
        const priorityA = tickerA.priority ?? Number.MAX_SAFE_INTEGER;
        const priorityB = tickerB.priority ?? Number.MAX_SAFE_INTEGER;

        return priorityA - priorityB;
      }),
    [nasdaq100Ticker, us10yTicker, usdJpyTicker],
  );

  return (
    <header className="top-bar" aria-label="主要マーケット指標">
      {tickers.map((ticker) => {
        const isUsdJpy = ticker.id === "usdjpy";
        const isNasdaq100 = ticker.id === "nasdaq";
        const isUs10y = ticker.id === "us10y";
        const isLoading =
          (isUsdJpy && usdJpyStatus === "loading") ||
          (isNasdaq100 && nasdaq100Status === "loading") ||
          (isUs10y && us10yStatus === "loading");
        const isError =
          (isUsdJpy && usdJpyStatus === "error") ||
          (isNasdaq100 && nasdaq100Status === "error") ||
          (isUs10y && us10yStatus === "error");
        const updatedText =
          isLoading
            ? "取得中"
            : isError
              ? "取得失敗"
              : `更新 ${ticker.updatedAt} JST`;
        const metaText = [
          updatedText,
          ticker.dataKind === "mock" ? "参考値" : null,
          ticker.note,
        ]
          .filter(Boolean)
          .join(" ・ ");

        return (
          <section className="ticker" key={ticker.id}>
            <div className="ticker__label">{ticker.label}</div>
            <div className="ticker__main">
              <div className="ticker__value">{ticker.value}</div>
              <div className={`ticker__change ticker__change--${ticker.direction}`}>
                {ticker.change}
              </div>
            </div>
            <div className="ticker__updated">{metaText}</div>
          </section>
        );
      })}
    </header>
  );
}
