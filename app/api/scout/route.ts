import { getScoutDashboardData } from "@/lib/footballData";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getScoutDashboardData();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected scout data error";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
