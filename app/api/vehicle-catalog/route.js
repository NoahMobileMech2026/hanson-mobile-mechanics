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

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function xmlTag(xml, name) {
  const match = String(xml || "").match(
    new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + name + ">", "i")
  );
  return match ? decodeXml(match[1].trim()) : "";
}

function parseXml(text) {
  if (/<menuItems[\s>]/i.test(text)) {
    const items = [...text.matchAll(/<menuItem(?:\s[^>]*)?>([\s\S]*?)<\/menuItem>/gi)]
      .map((match) => ({
        text: xmlTag(match[1], "text"),
        value: xmlTag(match[1], "value")
      }))
      .filter((item) => item.text && item.value);

    return { menuItems: { menuItem: items } };
  }

  if (/<vehicle[\s>]/i.test(text)) {
    return {
      vehicle: {
        displ: xmlTag(text, "displ"),
        cylinders: xmlTag(text, "cylinders"),
        fuelType1: xmlTag(text, "fuelType1"),
        fuelType: xmlTag(text, "fuelType"),
        drive: xmlTag(text, "drive"),
        trany: xmlTag(text, "trany")
      }
    };
  }

  throw new Error("Vehicle catalog returned an unknown format");
}

async function getData(path) {
  const response = await fetch(BASE + path, {
    headers: {
      Accept: "application/json, application/xml;q=0.9, text/xml;q=0.8"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Vehicle catalog request failed");
  }

  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed) throw new Error("Vehicle catalog returned an empty response");

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }

  return parseXml(trimmed);
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
      const data = await getData("/vehicle/menu/year");
      return NextResponse.json({ options: menuItems(data) });
    }

    if (level === "makes" && year) {
      const data = await getData("/vehicle/menu/make?year=" + encodeURIComponent(year));
      return NextResponse.json({ options: menuItems(data) });
    }

    if (level === "models" && year && make) {
      const data = await getData(
        "/vehicle/menu/model?year=" + encodeURIComponent(year) +
        "&make=" + encodeURIComponent(make)
      );
      return NextResponse.json({ options: menuItems(data) });
    }

    if (level === "configurations" && year && make && model) {
      const data = await getData(
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
      const data = await getData("/vehicle/" + encodeURIComponent(vehicleId));
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
