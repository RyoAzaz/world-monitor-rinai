import type {
  MarketDirection,
  Nasdaq100QuoteResponse,
  Us10yYieldResponse,
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

type AlphaVantageDailyBar = {
  "1. open"?: string;
  "2. high"?: string;
  "3. low"?: string;
  "4. close"?: string;
  "5. volume"?: string;
};

type AlphaVantageDailyTimeSeriesResponse = {
  "Meta Data": {
    "2. Symbol"?: string;
    "3. Last Refreshed"?: string;
  };
  "Time Series (Daily)": Record<string, AlphaVantageDailyBar>;
};

type FredObservation = {
  date?: string;
  value?: string;
};

type FredSeriesObservationsResponse = {
  observations?: FredObservation[];
};

const FRANKFURTER_REVALIDATE_SECONDS = 300;
const ALPHA_VANTAGE_REVALIDATE_SECONDS = 3600;
const FRED_REVALIDATE_SECONDS = 3600;
const FRANKFURTER_USDJPY_URL =
  "https://api.frankfurter.app/latest?amount=1&from=USD&to=JPY";
const ALPHA_VANTAGE_QQQ_PROXY_SOURCE_URL =
  "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=QQQ&outputsize=compact";
const FRED_DGS10_SOURCE_URL =
  "https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&file_type=json&sort_order=desc&limit=5";

const USDJPY_FETCH_FAILED_MESSAGE = "USDJPYレートの取得に失敗しました。";
const USDJPY_INVALID_RESPONSE_MESSAGE =
  "USDJPYレートのレスポンス形式が不正です。";
const USDJPY_UNEXPECTED_ERROR_MESSAGE =
  "USDJPYレートの取得中にエラーが発生しました。";
const NASDAQ100_API_KEY_MISSING_MESSAGE =
  "ALPHA_VANTAGE_API_KEYが未設定です。";
const NASDAQ100_FETCH_FAILED_MESSAGE =
  "QQQ proxyデータの取得に失敗しました。";
const NASDAQ100_PROVIDER_LIMIT_MESSAGE =
  "QQQ proxyデータの取得がAlpha Vantage側の制限または権限により失敗しました。";
const NASDAQ100_INVALID_RESPONSE_MESSAGE =
  "QQQ proxyデータのレスポンス形式が不正です。";
const NASDAQ100_UNEXPECTED_ERROR_MESSAGE =
  "QQQ proxyデータの取得中にエラーが発生しました。";
const US10Y_API_KEY_MISSING_MESSAGE = "FRED_API_KEYが未設定です。";
const US10Y_FETCH_FAILED_MESSAGE = "米10年金利の取得に失敗しました。";
const US10Y_INVALID_RESPONSE_MESSAGE =
  "米10年金利のレスポンス形式が不正です。";
const US10Y_UNEXPECTED_ERROR_MESSAGE =
  "米10年金利の取得中にエラーが発生しました。";

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

function formatYieldValue(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatPercentChange(latest: number, previous: number) {
  const changePercent = ((latest - previous) / previous) * 100;
  const sign = changePercent > 0 ? "+" : "";

  return `${sign}${changePercent.toFixed(2)}%`;
}

function formatYieldChange(latest: number, previous: number) {
  const changeBasisPoints = (latest - previous) * 100;
  const sign = changeBasisPoints > 0 ? "+" : "";

  return `${sign}${changeBasisPoints.toFixed(0)}bp`;
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

function isAlphaVantageDailyTimeSeriesResponse(
  value: unknown,
): value is AlphaVantageDailyTimeSeriesResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as {
    "Meta Data"?: unknown;
    "Time Series (Daily)"?: unknown;
  };

  return (
    typeof response["Meta Data"] === "object" &&
    response["Meta Data"] !== null &&
    typeof response["Time Series (Daily)"] === "object" &&
    response["Time Series (Daily)"] !== null
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

function isFredSeriesObservationsResponse(
  value: unknown,
): value is FredSeriesObservationsResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as {
    observations?: unknown;
  };

  return Array.isArray(response.observations);
}

function buildAlphaVantageQqqProxyUrl(apiKey: string) {
  const params = new URLSearchParams({
    function: "TIME_SERIES_DAILY",
    symbol: "QQQ",
    outputsize: "compact",
    apikey: apiKey,
  });

  return `https://www.alphavantage.co/query?${params.toString()}`;
}

function buildFredDgs10Url(apiKey: string) {
  const params = new URLSearchParams({
    series_id: "DGS10",
    api_key: apiKey,
    file_type: "json",
    sort_order: "desc",
    limit: "5",
  });

  return `https://api.stlouisfed.org/fred/series/observations?${params.toString()}`;
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

async function fetchAlphaVantageQqqProxy() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY?.trim();

  if (!apiKey) {
    throw new MarketServiceError(NASDAQ100_API_KEY_MISSING_MESSAGE, 503);
  }

  const response = await fetch(buildAlphaVantageQqqProxyUrl(apiKey), {
    next: { revalidate: ALPHA_VANTAGE_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new MarketServiceError(NASDAQ100_FETCH_FAILED_MESSAGE);
  }

  const payload: unknown = await response.json();

  if (hasAlphaVantageProviderMessage(payload)) {
    throw new MarketServiceError(NASDAQ100_PROVIDER_LIMIT_MESSAGE);
  }

  if (!isAlphaVantageDailyTimeSeriesResponse(payload)) {
    throw new MarketServiceError(NASDAQ100_INVALID_RESPONSE_MESSAGE);
  }

  return payload;
}

async function fetchFredDgs10() {
  const apiKey = process.env.FRED_API_KEY?.trim();

  if (!apiKey) {
    throw new MarketServiceError(US10Y_API_KEY_MISSING_MESSAGE, 503);
  }

  const response = await fetch(buildFredDgs10Url(apiKey), {
    next: { revalidate: FRED_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new MarketServiceError(US10Y_FETCH_FAILED_MESSAGE);
  }

  const payload: unknown = await response.json();

  if (!isFredSeriesObservationsResponse(payload)) {
    throw new MarketServiceError(US10Y_INVALID_RESPONSE_MESSAGE);
  }

  return payload;
}

function getLatestDailyBars(payload: AlphaVantageDailyTimeSeriesResponse) {
  const entries = Object.entries(payload["Time Series (Daily)"]).sort(
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

function getLatestFredObservations(payload: FredSeriesObservationsResponse) {
  const validObservations =
    payload.observations
      ?.map((observation) => ({
        date: observation.date,
        value: parseNumber(observation.value),
      }))
      .filter(
        (observation): observation is { date: string; value: number } =>
          typeof observation.date === "string" && observation.value !== null,
      ) ?? [];
  const latest = validObservations[0];
  const previous = validObservations[1];

  if (!latest) {
    throw new MarketServiceError(US10Y_INVALID_RESPONSE_MESSAGE);
  }

  return {
    latestDate: latest.date,
    latestValue: latest.value,
    previousValue: previous?.value ?? null,
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
    const payload = await fetchAlphaVantageQqqProxy();
    const { latestDate, latestClose, previousClose } = getLatestDailyBars(payload);
    const fetchedAt = new Date();

    return {
      ticker: {
        id: "nasdaq",
        label: "NASDAQ100 Proxy",
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
        url: ALPHA_VANTAGE_QQQ_PROXY_SOURCE_URL,
        dataDate: latestDate,
        fetchedAt: fetchedAt.toISOString(),
        note: "QQQ ETF日次参照データです。リアルタイムではありません。NASDAQ-100指数そのものではありません。",
      },
    };
  } catch (error) {
    if (isMarketServiceError(error)) {
      throw error;
    }

    throw new MarketServiceError(NASDAQ100_UNEXPECTED_ERROR_MESSAGE);
  }
}

export async function getUs10yYield(): Promise<Us10yYieldResponse> {
  try {
    const payload = await fetchFredDgs10();
    const { latestDate, latestValue, previousValue } =
      getLatestFredObservations(payload);
    const fetchedAt = new Date();

    return {
      ticker: {
        id: "us10y",
        label: "米10年金利",
        value: formatYieldValue(latestValue),
        change:
          previousValue === null
            ? "日次参照"
            : formatYieldChange(latestValue, previousValue),
        direction:
          previousValue === null
            ? "flat"
            : getDirection(latestValue, previousValue),
        updatedAt: formatJstTime(fetchedAt),
      },
      source: {
        name: "FRED",
        url: FRED_DGS10_SOURCE_URL,
        dataDate: latestDate,
        fetchedAt: fetchedAt.toISOString(),
        note: "FREDのDGS10日次参照データです。リアルタイム金利ではありません。",
      },
    };
  } catch (error) {
    if (isMarketServiceError(error)) {
      throw error;
    }

    throw new MarketServiceError(US10Y_UNEXPECTED_ERROR_MESSAGE);
  }
}
