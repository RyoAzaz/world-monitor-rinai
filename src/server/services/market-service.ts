import type {
  MarketDirection,
  Nasdaq100QuoteResponse,
  UsdJpyRateResponse,
} from "@/types/dashboard";

type FrankfurterLatestResponse = {
  amount: number;
  base: string;
  date: string;
  rates: {
    JPY: number;
  };
};

type AlphaVantageIndexBar = {
  "1. open"?: string;
  "2. high"?: string;
  "3. low"?: string;
  "4. close"?: string;
};

type AlphaVantageIndexDataResponse = {
  "Meta Data": {
    "2. Symbol"?: string;
    "3. Last Refreshed"?: string;
    "4. Interval"?: string;
  };
  "Time Series (daily)": Record<string, AlphaVantageIndexBar>;
};

const FRANKFURTER_REVALIDATE_SECONDS = 300;
const ALPHA_VANTAGE_REVALIDATE_SECONDS = 3600;
const FRANKFURTER_USDJPY_URL =
  "https://api.frankfurter.app/latest?amount=1&from=USD&to=JPY";
const ALPHA_VANTAGE_NASDAQ100_SOURCE_URL =
  "https://www.alphavantage.co/query?function=INDEX_DATA&symbol=NDX&interval=daily";

const USDJPY_FETCH_FAILED_MESSAGE = "USDJPYレートの取得に失敗しました。";
const USDJPY_INVALID_RESPONSE_MESSAGE =
  "USDJPYレートのレスポンス形式が不正です。";
const USDJPY_UNEXPECTED_ERROR_MESSAGE =
  "USDJPYレートの取得中にエラーが発生しました。";
const NASDAQ100_API_KEY_MISSING_MESSAGE =
  "ALPHA_VANTAGE_API_KEYが未設定です。";
const NASDAQ100_FETCH_FAILED_MESSAGE =
  "NASDAQ-100データの取得に失敗しました。";
const NASDAQ100_PROVIDER_LIMIT_MESSAGE =
  "NASDAQ-100データの取得がAlpha Vantage側の制限または権限により失敗しました。";
const NASDAQ100_INVALID_RESPONSE_MESSAGE =
  "NASDAQ-100データのレスポンス形式が不正です。";
const NASDAQ100_UNEXPECTED_ERROR_MESSAGE =
  "NASDAQ-100データの取得中にエラーが発生しました。";

export class MarketServiceError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "MarketServiceError";
    this.status = status;
  }
}

export function isMarketServiceError(
  error: unknown,
): error is MarketServiceError {
  return error instanceof MarketServiceError;
}

function formatJstTime(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatRate(rate: number) {
  return new Intl.NumberFormat("ja-JP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rate);
}

function formatIndexValue(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercentChange(latest: number, previous: number) {
  const changePercent = ((latest - previous) / previous) * 100;
  const sign = changePercent > 0 ? "+" : "";

  return `${sign}${changePercent.toFixed(2)}%`;
}

function getDirection(latest: number, previous: number): MarketDirection {
  if (latest > previous) {
    return "up";
  }

  if (latest < previous) {
    return "down";
  }

  return "flat";
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function isFrankfurterLatestResponse(
  value: unknown,
): value is FrankfurterLatestResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as {
    base?: unknown;
    date?: unknown;
    rates?: {
      JPY?: unknown;
    };
  };

  return (
    response.base === "USD" &&
    typeof response.date === "string" &&
    typeof response.rates?.JPY === "number"
  );
}

function isAlphaVantageIndexDataResponse(
  value: unknown,
): value is AlphaVantageIndexDataResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as {
    "Meta Data"?: unknown;
    "Time Series (daily)"?: unknown;
  };

  return (
    typeof response["Meta Data"] === "object" &&
    response["Meta Data"] !== null &&
    typeof response["Time Series (daily)"] === "object" &&
    response["Time Series (daily)"] !== null
  );
}

function hasAlphaVantageProviderMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as {
    "Error Message"?: unknown;
    Information?: unknown;
    Note?: unknown;
  };

  return (
    typeof response["Error Message"] === "string" ||
    typeof response.Information === "string" ||
    typeof response.Note === "string"
  );
}

function buildAlphaVantageNasdaq100Url(apiKey: string) {
  const params = new URLSearchParams({
    function: "INDEX_DATA",
    symbol: "NDX",
    interval: "daily",
    apikey: apiKey,
  });

  return `https://www.alphavantage.co/query?${params.toString()}`;
}

async function fetchFrankfurterUsdJpy() {
  const response = await fetch(FRANKFURTER_USDJPY_URL, {
    next: { revalidate: FRANKFURTER_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new MarketServiceError(USDJPY_FETCH_FAILED_MESSAGE);
  }

  const payload: unknown = await response.json();

  if (!isFrankfurterLatestResponse(payload)) {
    throw new MarketServiceError(USDJPY_INVALID_RESPONSE_MESSAGE);
  }

  return payload;
}

async function fetchAlphaVantageNasdaq100() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY?.trim();

  if (!apiKey) {
    throw new MarketServiceError(NASDAQ100_API_KEY_MISSING_MESSAGE, 503);
  }

  const response = await fetch(buildAlphaVantageNasdaq100Url(apiKey), {
    next: { revalidate: ALPHA_VANTAGE_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new MarketServiceError(NASDAQ100_FETCH_FAILED_MESSAGE);
  }

  const payload: unknown = await response.json();

  if (hasAlphaVantageProviderMessage(payload)) {
    throw new MarketServiceError(NASDAQ100_PROVIDER_LIMIT_MESSAGE);
  }

  if (!isAlphaVantageIndexDataResponse(payload)) {
    throw new MarketServiceError(NASDAQ100_INVALID_RESPONSE_MESSAGE);
  }

  return payload;
}

function getLatestIndexBars(payload: AlphaVantageIndexDataResponse) {
  const entries = Object.entries(payload["Time Series (daily)"]).sort(
    ([dateA], [dateB]) => dateB.localeCompare(dateA),
  );
  const latest = entries[0];
  const previous = entries[1];

  if (!latest) {
    throw new MarketServiceError(NASDAQ100_INVALID_RESPONSE_MESSAGE);
  }

  const latestClose = parseNumber(latest[1]["4. close"]);
  const previousClose = previous ? parseNumber(previous[1]["4. close"]) : null;

  if (latestClose === null) {
    throw new MarketServiceError(NASDAQ100_INVALID_RESPONSE_MESSAGE);
  }

  return {
    latestDate: latest[0],
    latestClose,
    previousClose,
  };
}

export async function getUsdJpyRate(): Promise<UsdJpyRateResponse> {
  try {
    const payload = await fetchFrankfurterUsdJpy();
    const fetchedAt = new Date();

    return {
      ticker: {
        id: "usdjpy",
        label: "USDJPY",
        value: formatRate(payload.rates.JPY),
        change: "日次参照",
        direction: "flat",
        updatedAt: formatJstTime(fetchedAt),
      },
      source: {
        name: "Frankfurter API",
        url: FRANKFURTER_USDJPY_URL,
        dataDate: payload.date,
        fetchedAt: fetchedAt.toISOString(),
        note: "Frankfurter APIの日次参照レートです。リアルタイム為替ではありません。",
      },
    };
  } catch (error) {
    if (isMarketServiceError(error)) {
      throw error;
    }

    throw new MarketServiceError(USDJPY_UNEXPECTED_ERROR_MESSAGE);
  }
}

export async function getNasdaq100Quote(): Promise<Nasdaq100QuoteResponse> {
  try {
    const payload = await fetchAlphaVantageNasdaq100();
    const { latestDate, latestClose, previousClose } = getLatestIndexBars(payload);
    const fetchedAt = new Date();

    return {
      ticker: {
        id: "nasdaq",
        label: "NASDAQ100",
        value: formatIndexValue(latestClose),
        change:
          previousClose === null
            ? "日次参照"
            : formatPercentChange(latestClose, previousClose),
        direction:
          previousClose === null
            ? "flat"
            : getDirection(latestClose, previousClose),
        updatedAt: formatJstTime(fetchedAt),
      },
      source: {
        name: "Alpha Vantage",
        url: ALPHA_VANTAGE_NASDAQ100_SOURCE_URL,
        dataDate: latestDate,
        fetchedAt: fetchedAt.toISOString(),
        note: "Alpha Vantage日次参照データです。リアルタイムではありません。",
      },
    };
  } catch (error) {
    if (isMarketServiceError(error)) {
      throw error;
    }

    throw new MarketServiceError(NASDAQ100_UNEXPECTED_ERROR_MESSAGE);
  }
}
