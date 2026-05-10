import { NextResponse } from "next/server";

import {
  getVixIndex,
  isMarketServiceError,
} from "@/server/services/market-service";
import type { ApiErrorResponse } from "@/types/api";

export async function GET() {
  try {
    return NextResponse.json(await getVixIndex());
  } catch (error) {
    const body: ApiErrorResponse = {
      error: isMarketServiceError(error)
        ? error.message
        : "VIXの取得中にエラーが発生しました。",
    };

    console.error("VIX fetch failed.");

    return NextResponse.json(body, {
      status: isMarketServiceError(error) ? error.status : 502,
    });
  }
}
