import { NextResponse } from "next/server";

const BASE = "https://www.fueleconomy.gov/ws/rest";

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function menuItems(json) {
  return asArray(json?.menuItems?.menuItem)
    .map((item) => ({
      label: String(item?.text ?? "").trim(),
      value: String(item?.value ?? "").trim()
    }))
    .filter((item) => item.label && item.value);
}

async function getJson(path) {
  const response = await fetch(BASE + path, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 }
  });

  if (!response.ok) {
    throw new Error("Vehicle catalog request failed");
  }

  return response.json();
}

function engineLabel(vehicle) {
  const liters = vehicle?.displ ? String(vehicle.displ).trim() : "";
  const cylinders = vehicle?.cylinders ? String(vehicle.cylinders).trim() : "";
  const fuel = vehicle?.fuelType1 ? String(vehicle.fuelType1).trim() : "";
  const parts = [];

  if (liters && liters !== "0") parts.push(liters + "L");
  if (cylinders) parts.push(cylinders + "-cylinder");
  if (fuel) parts.push(fuel);

  if (!parts.length && String(vehicle?.fuelType || "").toLowerCase().includes("electric")) {
    return "Electric";
  }

  return parts.join(" • ") || "Engine details not published";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const year = searchParams.get("year");
  const make = searchParams.get("make");
  const model = searchParams.get("model");
  const vehicleId = searchParams.get("vehicleId");

  try {
    if (level === "years") {
      const data = await getJson("/vehicle/menu/year");
      return NextResponse.json({ options: menuItems(data) });
    }

    if (level === "makes" && year) {
      const data = await getJson("/vehicle/menu/make?year=" + encodeURIComponent(year));
      return NextResponse.json({ options: menuItems(data) });
    }

    if (level === "models" && year && make) {
      const data = await getJson(
        "/vehicle/menu/model?year=" + encodeURIComponent(year) +
        "&make=" + encodeURIComponent(make)
      );
      return NextResponse.json({ options: menuItems(data) });
    }

    if (level === "configurations" && year && make && model) {
      const data = await getJson(
        "/vehicle/menu/options?year=" + encodeURIComponent(year) +
        "&make=" + encodeURIComponent(make) +
        "&model=" + encodeURIComponent(model)
      );

      const options = menuItems(data).map((item) => ({
        label: item.label,
        value: item.value
      }));

      return NextResponse.json({ options });
    }

    if (level === "engine" && vehicleId) {
      const data = await getJson("/vehicle/" + encodeURIComponent(vehicleId));
      const vehicle = data?.vehicle ?? data;
      return NextResponse.json({
        options: [{
          label: engineLabel(vehicle),
          value: engineLabel(vehicle)
        }],
        details: {
          drive: vehicle?.drive || "",
          transmission: vehicle?.trany || "",
          fuel: vehicle?.fuelType1 || ""
        }
      });
    }

    return NextResponse.json({ options: [], error: "Missing vehicle lookup parameters." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      options: [],
      error: "Exact vehicle configuration data is temporarily unavailable."
    }, { status: 200 });
  }
}
