"use client";

import { useEffect, useMemo, useState } from "react";

const MAKES = [
  "Acura","Audi","BMW","Buick","Cadillac","Chevrolet","Chrysler","Dodge","Ford","GMC",
  "Honda","Hyundai","Infiniti","Jeep","Kia","Lexus","Lincoln","Mazda","Mercedes-Benz",
  "Mercury","MINI","Mitsubishi","Nissan","Pontiac","Ram","Saturn","Subaru","Tesla",
  "Toyota","Volkswagen","Volvo","Other / Not sure"
];

const MAKE_YEAR_RANGES = {
  Acura:[1986,2100], Infiniti:[1989,2100], Lexus:[1989,2100], Hyundai:[1986,2100],
  Kia:[1994,2100], MINI:[2002,2100], Ram:[2010,2100], Tesla:[2008,2100],
  Mercury:[1980,2011], Pontiac:[1980,2010], Saturn:[1991,2010]
};

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function engineLabel(optionText, make) {
  const text = String(optionText || "");
  const literMatch = text.match(/(\d+(?:\.\d+)?)\s*L\b/i);
  const cylinderMatch = text.match(/(\d+)\s*(?:cyl|cylinder)/i);
  const liter = literMatch ? literMatch[1] : "";
  const cylinders = cylinderMatch ? cylinderMatch[1] : "";

  if (liter && cylinders) return liter + "L " + cylinders + "-cylinder";
  if (liter) return liter + "L";
  if (cylinders) return cylinders + "-cylinder";
  if (/electric|\bev\b/i.test(text) || /tesla/i.test(make)) return "Electric";
  if (/diesel/i.test(text)) return "Diesel";
  if (/hybrid/i.test(text)) return "Hybrid";
  return "";
}

async function fuelMenu(path) {
  const response = await fetch("https://www.fueleconomy.gov/ws/rest" + path, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) throw new Error("Vehicle configuration lookup failed.");

  const json = await response.json();
  return asArray(json && json.menuItems ? json.menuItems.menuItem : null)
    .map((item) => ({
      label: String(item && item.text ? item.text : "").trim(),
      value: String(item && item.value ? item.value : "").trim()
    }))
    .filter((item) => item.label);
}

function matchingVariants(models, selectedModel) {
  const selected = normalize(selectedModel);
  if (!selected) return [];

  const exact = models.filter((item) => normalize(item.label) === selected);
  if (exact.length) return exact;

  return models.filter((item) => {
    const candidate = normalize(item.label);
    return candidate.startsWith(selected) || selected.startsWith(candidate);
  });
}

export default function VehicleFields({ value, onChange, required = false }) {
  const currentYear = new Date().getFullYear() + 1;
  const years = useMemo(
    () => Array.from({ length: currentYear - 1979 }, (_, i) => String(currentYear - i)),
    [currentYear]
  );

  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [trims, setTrims] = useState([]);
  const [engines, setEngines] = useState([]);
  const [loadingTrims, setLoadingTrims] = useState(false);
  const [loadingEngines, setLoadingEngines] = useState(false);
  const [vehicleMessage, setVehicleMessage] = useState("");

  const availableMakes = useMemo(() => {
    if (!value.year) return [];
    const selectedYear = Number(value.year);

    return MAKES.filter((make) => {
      if (make === "Other / Not sure") return true;
      const range = MAKE_YEAR_RANGES[make];
      return !range || (selectedYear >= range[0] && selectedYear <= range[1]);
    });
  }, [value.year]);

  useEffect(() => {
    let active = true;

    async function loadModels() {
      if (!value.year || !value.make || value.make === "Other / Not sure") {
        setModels([]);
        return;
      }

      setLoadingModels(true);
      try {
        const response = await fetch(
          "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/" +
          encodeURIComponent(value.make) +
          "/modelyear/" +
          encodeURIComponent(value.year) +
          "?format=json"
        );
        const json = await response.json();
        const next = [...new Set(
          (json.Results || []).map((item) => item.Model_Name).filter(Boolean)
        )].sort((a, b) => a.localeCompare(b));

        if (active) setModels(next);
      } catch {
        if (active) setModels([]);
      } finally {
        if (active) setLoadingModels(false);
      }
    }

    loadModels();
    return () => { active = false; };
  }, [value.year, value.make]);

  useEffect(() => {
    let active = true;

    async function loadTrims() {
      setTrims([]);
      setEngines([]);
      setVehicleMessage("");

      if (!value.year || !value.make || !value.model ||
          value.make === "Other / Not sure" || value.model === "Other / Not sure") {
        return;
      }

      if (Number(value.year) < 1984) {
        setVehicleMessage("Exact trim and engine matching is available for model years 1984 and newer.");
        return;
      }

      setLoadingTrims(true);

      try {
        const catalogModels = await fuelMenu(
          "/vehicle/menu/model?year=" +
          encodeURIComponent(value.year) +
          "&make=" +
          encodeURIComponent(value.make)
        );

        const variants = matchingVariants(catalogModels, value.model);
        if (!active) return;

        const exactTrims = variants.map((item) => ({
          label: item.label,
          value: item.label
        }));

        setTrims(exactTrims);

        if (!exactTrims.length) {
          setVehicleMessage("No exact trim/configuration was published for this year, make, and model.");
          return;
        }

        if (exactTrims.length === 1 && !value.trim) {
          onChange({ ...value, trim: exactTrims[0].value, engine: "" });
          return;
        }

        setVehicleMessage("Choose the exact trim/configuration to see only compatible engines.");
      } catch {
        if (active) {
          setTrims([]);
          setVehicleMessage("Exact trim lookup is temporarily unavailable.");
        }
      } finally {
        if (active) setLoadingTrims(false);
      }
    }

    loadTrims();
    return () => { active = false; };
  }, [value.year, value.make, value.model]);

  useEffect(() => {
    let active = true;

    async function loadEngines() {
      setEngines([]);

      if (!value.year || !value.make || !value.model || !value.trim) return;
      if (Number(value.year) < 1984) return;

      setLoadingEngines(true);

      try {
        const options = await fuelMenu(
          "/vehicle/menu/options?year=" +
          encodeURIComponent(value.year) +
          "&make=" +
          encodeURIComponent(value.make) +
          "&model=" +
          encodeURIComponent(value.trim)
        );

        const exactEngines = [...new Set(
          options.map((item) => engineLabel(item.label, value.make)).filter(Boolean)
        )].sort((a, b) => a.localeCompare(b));

        if (!active) return;

        setEngines(exactEngines);
        setVehicleMessage(
          exactEngines.length
            ? "Only engines published for this exact vehicle configuration are shown."
            : "No engine choices were published for this exact configuration."
        );
      } catch {
        if (active) {
          setEngines([]);
          setVehicleMessage("Exact engine lookup is temporarily unavailable.");
        }
      } finally {
        if (active) setLoadingEngines(false);
      }
    }

    loadEngines();
    return () => { active = false; };
  }, [value.year, value.make, value.model, value.trim]);

  function setField(field, nextValue) {
    const next = { ...value, [field]: nextValue };

    if (field === "year") {
      next.make = "";
      next.model = "";
      next.trim = "";
      next.engine = "";
      setModels([]);
      setTrims([]);
      setEngines([]);
    }

    if (field === "make") {
      next.model = "";
      next.trim = "";
      next.engine = "";
      setModels([]);
      setTrims([]);
      setEngines([]);
    }

    if (field === "model") {
      next.trim = "";
      next.engine = "";
      setTrims([]);
      setEngines([]);
    }

    if (field === "trim") {
      next.engine = "";
      setEngines([]);
    }

    onChange(next);
  }

  const modelOptions = value.model && !models.includes(value.model)
    ? [value.model, ...models]
    : models;

  return (
    <>
      <label>
        Vehicle year
        <select value={value.year || ""} onChange={(e) => setField("year", e.target.value)}>
          <option value="">Select year</option>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </label>

      <label>
        Vehicle make {required && <span aria-hidden="true">*</span>}
        <select
          value={value.make || ""}
          onChange={(e) => setField("make", e.target.value)}
          required={required}
          disabled={!value.year}
        >
          <option value="">{value.year ? "Select make" : "Select year first"}</option>
          {availableMakes.map((make) => <option key={make} value={make}>{make}</option>)}
        </select>
      </label>

      <label>
        Vehicle model {required && <span aria-hidden="true">*</span>}
        <select
          value={value.model || ""}
          onChange={(e) => setField("model", e.target.value)}
          required={required}
          disabled={!value.year || !value.make || loadingModels}
        >
          <option value="">
            {!value.make
              ? "Select make first"
              : loadingModels
                ? "Loading matching models..."
                : "Select model"}
          </option>
          {modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
          {!modelOptions.includes("Other / Not sure") && (
            <option value="Other / Not sure">Other / Not sure</option>
          )}
        </select>
      </label>

      <label>
        Trim / configuration
        <select
          value={value.trim || ""}
          onChange={(e) => setField("trim", e.target.value)}
          disabled={!value.model || loadingTrims || !trims.length}
        >
          <option value="">
            {!value.model
              ? "Select model first"
              : loadingTrims
                ? "Loading exact configurations..."
                : trims.length
                  ? "Select exact configuration"
                  : "No exact configuration listed"}
          </option>
          {trims.map((trim) => (
            <option key={trim.value} value={trim.value}>{trim.label}</option>
          ))}
        </select>
      </label>

      <label>
        Engine
        <select
          value={value.engine || ""}
          onChange={(e) => setField("engine", e.target.value)}
          disabled={!value.trim || loadingEngines || !engines.length}
        >
          <option value="">
            {!value.trim
              ? "Select trim/configuration first"
              : loadingEngines
                ? "Loading compatible engines..."
                : engines.length
                  ? "Select engine"
                  : "No engine option listed"}
          </option>
          {engines.map((engine) => <option key={engine} value={engine}>{engine}</option>)}
        </select>
      </label>

      {vehicleMessage && (
        <div className="vehicle-cascade-note" aria-live="polite">
          {vehicleMessage}
        </div>
      )}
    </>
  );
}
