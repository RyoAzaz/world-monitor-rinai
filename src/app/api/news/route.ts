import { NextResponse } from "next/server";

import { getLatestNews, isNewsServiceError } from "@/server/services/news-service";
import type { ApiErrorResponse } from "@/types/api";
import type { NewsResponse } from "@/types/news";

export const revalidate = 900;

export async function GET() {
  try {
    const payload = await getLatestNews();

    return NextResponse.json<NewsResponse>(payload);
  } catch (error) {
    const status = isNewsServiceError(error) ? error.status : 500;
    const message = isNewsServiceError(error)
      ? error.message
      : "ニュースの取得中にエラーが発生しました。";

    return NextResponse.json<ApiErrorResponse>({ error: message }, { status });
  }
}
