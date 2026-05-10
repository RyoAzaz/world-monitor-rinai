import { NextResponse } from "next/server";
import {
  getUsdJpyRate,
  isMarketServiceError,
} from "@/server/services/market-service";
import type { MarketDataErrorResponse } from "@/types/dashboard";

export async function GET() {
  try {
    return NextResponse.json(await getUsdJpyRate());
  } catch (error) {
    console.error("USDJPY rate fetch failed.", error);

    const body: MarketDataErrorResponse = {
      error: isMarketServiceError(error)
        ? error.message
        : "USDJPYレートの取得中にエラーが発生しました。",
    };

    return NextResponse.json(body, {
      status: isMarketServiceError(error) ? error.status : 502,
    });
  }
}
