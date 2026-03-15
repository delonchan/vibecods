import {
  refreshCompletedPredictionEvaluations,
  refreshUpcomingPredictions,
} from "@/lib/footballData";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") ?? "all";

    if (mode === "upcoming") {
      const upcoming = await refreshUpcomingPredictions();

      return NextResponse.json(
        {
          mode,
          upcoming,
        },
        { status: 200 },
      );
    }

    if (mode === "reconcile") {
      const reconcile = await refreshCompletedPredictionEvaluations();

      return NextResponse.json(
        {
          mode,
          reconcile,
        },
        { status: 200 },
      );
    }

    const [upcoming, reconcile] = await Promise.all([
      refreshUpcomingPredictions(),
      refreshCompletedPredictionEvaluations(),
    ]);

    return NextResponse.json(
      {
        mode: "all",
        upcoming,
        reconcile,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected scout refresh error";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
