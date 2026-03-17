import { getScoutMatchesData, isSupportedLeagueCode } from "@/lib/footballData";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const league = request.nextUrl.searchParams.get("league");

    if (!league || !isSupportedLeagueCode(league)) {
      return NextResponse.json(
        {
          error:
            "A valid league query is required. Allowed: PL, PD, BL1, SA, CL.",
          matches: [],
        },
        { status: 400 },
      );
    }

    const data = await getScoutMatchesData(league);
import { getScoutMatchesData } from "@/lib/footballData";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getScoutMatchesData();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected scout data error";

    return NextResponse.json(
      {
        error: message,
        matches: [],
      },
      { status: 500 },
    );
  }
}
