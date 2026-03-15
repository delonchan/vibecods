import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { PredictionRecord } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const PREDICTIONS_FILE = path.join(DATA_DIR, "predictions.json");

async function ensureStore(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(PREDICTIONS_FILE, "utf8");
  } catch {
    await writeFile(PREDICTIONS_FILE, "[]\n", "utf8");
  }
}

export async function readPredictionRecords(): Promise<PredictionRecord[]> {
  await ensureStore();

  try {
    const raw = await readFile(PREDICTIONS_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as PredictionRecord[];
  } catch {
    return [];
  }
}

export async function writePredictionRecords(
  records: PredictionRecord[],
): Promise<void> {
  await ensureStore();

  const serialized = JSON.stringify(records, null, 2);
  await writeFile(PREDICTIONS_FILE, `${serialized}\n`, "utf8");
}

export async function appendPredictionRecords(
  nextRecords: PredictionRecord[],
): Promise<void> {
  if (!nextRecords.length) {
    return;
  }

  const existing = await readPredictionRecords();
  const existingIds = new Set(existing.map((record) => record.match_id));

  const deduped = nextRecords.filter((record) => !existingIds.has(record.match_id));

  if (!deduped.length) {
    return;
  }

  await writePredictionRecords([...existing, ...deduped]);
}
