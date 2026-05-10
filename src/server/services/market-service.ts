import type { UsdJpyRateResponse } from "@/types/dashboard";

type FrankfurterLatestResponse = {
  amount: number;
  base: string;
  date: string;
  rates: {
    JPY: number;
  };
};

const MARKET_DATA_REVALIDATE_SECONDS = 300;
const FRANKFURTER_USDJPY_URL =
  "https://api.frankfurter.app/latest?amount=1&from=USD&to=JPY";

const USDJPY_FETCH_FAILED_MESSAGE = "USDJPYレートの取得に失敗しました。";
const USDJPY_INVALID_RESPONSE_MESSAGE =
  "USDJPYレートのレスポンス形式が不正です。";
const USDJPY_UNEXPECTED_ERROR_MESSAGE =
  "USDJPYレートの取得中にエラーが発生しました。";

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

async function fetchFrankfurterUsdJpy() {
  const response = await fetch(FRANKFURTER_USDJPY_URL, {
    next: { revalidate: MARKET_DATA_REVALIDATE_SECONDS },
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
