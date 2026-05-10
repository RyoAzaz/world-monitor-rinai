import { NextResponse } from "next/server";
import type { UsdJpyRateResponse } from "@/types/dashboard";

type FrankfurterLatestResponse = {
  amount: number;
  base: string;
  date: string;
  rates: {
    JPY: number;
  };
};

const FRANKFURTER_USDJPY_URL =
  "https://api.frankfurter.app/latest?amount=1&from=USD&to=JPY";

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

export async function GET() {
  try {
    const response = await fetch(FRANKFURTER_USDJPY_URL, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "USDJPYレートの取得に失敗しました。" },
        { status: 502 },
      );
    }

    const payload: unknown = await response.json();

    if (!isFrankfurterLatestResponse(payload)) {
      return NextResponse.json(
        { error: "USDJPYレートのレスポンス形式が不正です。" },
        { status: 502 },
      );
    }

    const fetchedAt = new Date();
    const body: UsdJpyRateResponse = {
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

    return NextResponse.json(body);
  } catch (error) {
    console.error("USDJPY rate fetch failed.", error);

    return NextResponse.json(
      { error: "USDJPYレートの取得中にエラーが発生しました。" },
      { status: 502 },
    );
  }
}
