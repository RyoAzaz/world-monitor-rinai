import { NextResponse } from "next/server";
import {
  getNasdaq100Quote,
  isMarketServiceError,
} from "@/server/services/market-service";
import type { MarketDataErrorResponse } from "@/types/dashboard";

export async function GET() {
  try {
    return NextResponse.json(await getNasdaq100Quote());
  } catch (error) {
    const body: MarketDataErrorResponse = {
      error: isMarketServiceError(error)
        ? error.message
        : "NASDAQ-100データの取得中にエラーが発生しました。",
    };

    console.error("NASDAQ-100 quote fetch failed.");

    return NextResponse.json(body, {
      status: isMarketServiceError(error) ? error.status : 502,
    });
  }
}
