import { NextResponse } from "next/server";

import { getNewsMapEvents } from "@/server/services/news-map-service";
import { isNewsServiceError } from "@/server/services/news-service";
import type {
  NewsMapEventsErrorResponse,
  NewsMapEventsResponse,
} from "@/types/map";

export const revalidate = 900;

export async function GET() {
  try {
    const payload = await getNewsMapEvents();

    return NextResponse.json<NewsMapEventsResponse>(payload);
  } catch (error) {
    const status = isNewsServiceError(error) ? error.status : 500;
    const message = isNewsServiceError(error)
      ? error.message
      : "ニュース由来の地図イベント取得中にエラーが発生しました。";

    return NextResponse.json<NewsMapEventsErrorResponse>(
      { error: message },
      { status },
    );
  }
}
