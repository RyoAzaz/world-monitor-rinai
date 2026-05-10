import { NextResponse } from "next/server";
import {
  getUsdJpyRate,
  isMarketServiceError,
} from "@/server/services/market-service";
import type { ApiErrorResponse } from "@/types/api";

export async function GET() {
  try {
    return NextResponse.json(await getUsdJpyRate());
  } catch (error) {
    console.error("USDJPY rate fetch failed.", error);

    const body: ApiErrorResponse = {
      error: isMarketServiceError(error)
        ? error.message
        : "USDJPYレートの取得中にエラーが発生しました。",
    };

    return NextResponse.json(body, {
      status: isMarketServiceError(error) ? error.status : 502,
    });
  }
}
