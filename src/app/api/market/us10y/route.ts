import { NextResponse } from "next/server";

import {
  getUs10yYield,
  isMarketServiceError,
} from "@/server/services/market-service";
import type { ApiErrorResponse } from "@/types/api";

export async function GET() {
  try {
    return NextResponse.json(await getUs10yYield());
  } catch (error) {
    const body: ApiErrorResponse = {
      error: isMarketServiceError(error)
        ? error.message
        : "米10年金利の取得中にエラーが発生しました。",
    };

    console.error("US10Y yield fetch failed.");

    return NextResponse.json(body, {
      status: isMarketServiceError(error) ? error.status : 502,
    });
  }
}
