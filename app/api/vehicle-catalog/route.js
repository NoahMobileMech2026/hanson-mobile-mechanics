import { NextResponse } from "next/server";

const BASE = "https://open.wenmarpro.com/v1/vehicles";

async function getCatalog(path) {
  const response = await fetch(BASE + path, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || "Vehicle catalog request failed.";
    throw new Error(message);
  }

  return data;
}

function option(label, value, meta = {}) {
  return { label: String(label), value: String(value), ...meta };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const year = searchParams.get("year");
  const make = searchParams.get("make");
  const model = searchParams.get("model");
  const trim = searchParams.get("trim");

  try {
    if (level === "years") {
      const rows = await getCatalog("/years?scope=light");
      return NextResponse.json({
        options: (Array.isArray(rows) ? rows : []).map((year) => option(year, year))
      });
    }

    if (level === "makes" && year) {
      const rows = await getCatalog(
        "/makes?scope=light&limit=500&year=" + encodeURIComponent(year)
      );
      return NextResponse.json({
        options: (Array.isArray(rows) ? rows : []).map((row) =>
          option(row.name, row.name, { id: row.id, popular: !!row.popular })
        )
      });
    }

    if (level === "models" && year && make) {
      const rows = await getCatalog(
        "/models?scope=light&limit=500&year=" + encodeURIComponent(year) +
        "&make=" + encodeURIComponent(make)
      );
      return NextResponse.json({
        options: (Array.isArray(rows) ? rows : []).map((row) =>
          option(row.name, row.name, { id: row.id })
        )
      });
    }

    if (level === "trims" && year && make && model) {
      const rows = await getCatalog(
        "/trims?year=" + encodeURIComponent(year) +
        "&make=" + encodeURIComponent(make) +
        "&model=" + encodeURIComponent(model)
      );
      return NextResponse.json({
        options: (Array.isArray(rows) ? rows : []).map((row) =>
          option(row.name, row.name, { id: row.id, kind: row.kind })
        )
      });
    }

    if (level === "engines" && year && make && model && trim) {
      const rows = await getCatalog(
        "/engines?year=" + encodeURIComponent(year) +
        "&make=" + encodeURIComponent(make) +
        "&model=" + encodeURIComponent(model) +
        "&submodel=" + encodeURIComponent(trim)
      );
      return NextResponse.json({
        options: (Array.isArray(rows) ? rows : []).map((row) =>
          option(row.label, row.label, { id: row.id, preset: !!row.preset, vin8: row.vin8 ?? null })
        )
      });
    }

    return NextResponse.json(
      { options: [], error: "Missing vehicle lookup parameters." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { options: [], error: error?.message || "Vehicle catalog is temporarily unavailable." },
      { status: 502 }
    );
  }
}
