import { readPredictionRecords } from "@/lib/predictionStore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const history = await readPredictionRecords();

    return NextResponse.json(
      {
        history,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected prediction history error";

    return NextResponse.json(
      {
        error: message,
        history: [],
      },
      { status: 500 },
    );
  }
}
