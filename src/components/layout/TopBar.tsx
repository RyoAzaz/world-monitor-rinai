"use client";

import { useEffect, useMemo, useState } from "react";
import { fallbackMarketTickers } from "@/data/mockMarket";
import type { ClientFetchStatus } from "@/types/api";
import type {
  MarketTicker,
  Nasdaq100QuoteResponse,
  Sp500ProxyQuoteResponse,
  Us10yYieldResponse,
  UsdJpyRateResponse,
  VixIndexResponse,
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

const sp500ProxyLoadingTicker: MarketTicker = {
  id: "sp500",
  label: "S&P500 Proxy",
  value: "取得中",
  change: "日次参照",
  direction: "flat",
  updatedAt: "--:--",
  dataKind: "real",
  note: "SPY ETF日次参照・リアルタイムではありません",
  priority: 15,
};

const sp500ProxyErrorTicker: MarketTicker = {
  id: "sp500",
  label: "S&P500 Proxy",
  value: "取得失敗",
  change: "再読込",
  direction: "flat",
  updatedAt: "--:--",
  dataKind: "real",
  note: "SPY ETF日次参照・リアルタイムではありません",
  priority: 15,
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

const vixLoadingTicker: MarketTicker = {
  id: "vix",
  label: "VIX",
  value: "取得中",
  change: "日次終値",
  direction: "flat",
  updatedAt: "--:--",
  dataKind: "real",
  note: "FRED日次終値・リアルタイムではありません",
  priority: 25,
};

const vixErrorTicker: MarketTicker = {
  id: "vix",
  label: "VIX",
  value: "取得失敗",
  change: "再読込",
  direction: "flat",
  updatedAt: "--:--",
  dataKind: "real",
  note: "FRED日次終値・リアルタイムではありません",
  priority: 25,
};

export function TopBar() {
  const [usdJpyTicker, setUsdJpyTicker] =
    useState<MarketTicker>(usdjpyLoadingTicker);
  const [usdJpyStatus, setUsdJpyStatus] =
    useState<ClientFetchStatus>("loading");
  const [sp500ProxyTicker, setSp500ProxyTicker] = useState<MarketTicker>(
    sp500ProxyLoadingTicker,
  );
  const [sp500ProxyStatus, setSp500ProxyStatus] =
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
  const [vixTicker, setVixTicker] =
    useState<MarketTicker>(vixLoadingTicker);
  const [vixStatus, setVixStatus] =
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

    async function loadSp500Proxy() {
      try {
        const response = await fetch("/api/market/sp500-proxy");

        if (!response.ok) {
          throw new Error("Failed to fetch S&P500 proxy.");
        }

        const data = (await response.json()) as Sp500ProxyQuoteResponse;

        if (!ignore) {
          setSp500ProxyTicker({
            ...data.ticker,
            dataKind: "real",
            note: sp500ProxyLoadingTicker.note,
            priority: sp500ProxyLoadingTicker.priority,
          });
          setSp500ProxyStatus("ready");
        }
      } catch {
        if (!ignore) {
          setSp500ProxyTicker(sp500ProxyErrorTicker);
          setSp500ProxyStatus("error");
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

    async function loadVix() {
      try {
        const response = await fetch("/api/market/vix");

        if (!response.ok) {
          throw new Error("Failed to fetch VIX.");
        }

        const data = (await response.json()) as VixIndexResponse;

        if (!ignore) {
          setVixTicker({
            ...data.ticker,
            dataKind: "real",
            note: vixLoadingTicker.note,
            priority: vixLoadingTicker.priority,
          });
          setVixStatus("ready");
        }
      } catch {
        if (!ignore) {
          setVixTicker(vixErrorTicker);
          setVixStatus("error");
        }
      }
    }

    void loadUsdJpy();
    void loadSp500Proxy();
    void loadNasdaq100();
    void loadVix();
    void loadUs10y();

    return () => {
      ignore = true;
    };
  }, []);

  const tickers = useMemo(
    () =>
      [
        usdJpyTicker,
        sp500ProxyTicker,
        nasdaq100Ticker,
        vixTicker,
        us10yTicker,
        ...fallbackMarketTickers,
      ].sort((tickerA, tickerB) => {
        const priorityA = tickerA.priority ?? Number.MAX_SAFE_INTEGER;
        const priorityB = tickerB.priority ?? Number.MAX_SAFE_INTEGER;

        return priorityA - priorityB;
      }),
    [nasdaq100Ticker, sp500ProxyTicker, us10yTicker, usdJpyTicker, vixTicker],
  );

  return (
    <header className="top-bar" aria-label="主要マーケット指標">
      {tickers.map((ticker) => {
        const isUsdJpy = ticker.id === "usdjpy";
        const isSp500Proxy = ticker.id === "sp500";
        const isNasdaq100 = ticker.id === "nasdaq";
        const isVix = ticker.id === "vix";
        const isUs10y = ticker.id === "us10y";
        const isLoading =
          (isUsdJpy && usdJpyStatus === "loading") ||
          (isSp500Proxy && sp500ProxyStatus === "loading") ||
          (isNasdaq100 && nasdaq100Status === "loading") ||
          (isVix && vixStatus === "loading") ||
          (isUs10y && us10yStatus === "loading");
        const isError =
          (isUsdJpy && usdJpyStatus === "error") ||
          (isSp500Proxy && sp500ProxyStatus === "error") ||
          (isNasdaq100 && nasdaq100Status === "error") ||
          (isVix && vixStatus === "error") ||
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
