import { NextResponse } from "next/server";

import {
  getSp500ProxyQuote,
  isMarketServiceError,
} from "@/server/services/market-service";
import type { ApiErrorResponse } from "@/types/api";

export async function GET() {
  try {
    return NextResponse.json(await getSp500ProxyQuote());
  } catch (error) {
    const body: ApiErrorResponse = {
      error: isMarketServiceError(error)
        ? error.message
        : "S&P500 Proxyデータの取得中にエラーが発生しました。",
    };

    console.error("S&P500 proxy quote fetch failed.");

    return NextResponse.json(body, {
      status: isMarketServiceError(error) ? error.status : 502,
    });
  }
}
