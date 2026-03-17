import { getPredictionMetrics, reconcileCompletedPredictions } from "@/lib/footballData";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await reconcileCompletedPredictions();
    const metrics = await getPredictionMetrics();

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected scout metrics error";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
