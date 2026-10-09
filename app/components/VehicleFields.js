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

const DEFAULT_TRIMS = ["Base","S","SE","SEL","Sport","Limited","Touring","Premium","Luxury","Platinum","Other / Not sure"];

const TRIMS_BY_MAKE = {
  Acura:["Base","Technology","A-Spec","Advance","Type S","Other / Not sure"],
  Audi:["Premium","Premium Plus","Prestige","S line","Other / Not sure"],
  BMW:["Base","xDrive","M Sport","M","Other / Not sure"],
  Buick:["Preferred","Essence","Premium","Avenir","Sport Touring","Other / Not sure"],
  Cadillac:["Luxury","Premium Luxury","Sport","Platinum","V-Series","Other / Not sure"],
  Chevrolet:["LS","LT","LTZ","Premier","RST","High Country","Z71","Other / Not sure"],
  Chrysler:["LX","Touring","Touring L","Limited","S","Other / Not sure"],
  Dodge:["SE","SXT","GT","R/T","Citadel","Limited","Other / Not sure"],
  Ford:["S","SE","SEL","ST","XLT","Lariat","Limited","Platinum","King Ranch","Other / Not sure"],
  GMC:["SLE","SLT","AT4","Denali","Elevation","Other / Not sure"],
  Honda:["LX","Sport","EX","EX-L","Touring","Elite","Other / Not sure"],
  Hyundai:["SE","SEL","N Line","Limited","Calligraphy","Other / Not sure"],
  Infiniti:["Pure","Luxe","Sensory","Red Sport","Other / Not sure"],
  Jeep:["Sport","Latitude","Limited","Trailhawk","Overland","Rubicon","Sahara","Other / Not sure"],
  Kia:["LX","LXS","EX","SX","SX Prestige","GT-Line","GT","Other / Not sure"],
  Lexus:["Base","Premium","Luxury","F Sport","Other / Not sure"],
  Lincoln:["Standard","Reserve","Black Label","Other / Not sure"],
  Mazda:["Sport","Touring","Grand Touring","Select","Preferred","Premium","Carbon Edition","Other / Not sure"],
  "Mercedes-Benz":["Base","4MATIC","AMG Line","AMG","Other / Not sure"],
  Mitsubishi:["ES","LE","SE","SEL","GT","Other / Not sure"],
  Nissan:["S","SV","SR","SL","Platinum","PRO-4X","Other / Not sure"],
  Ram:["Tradesman","Big Horn","Laramie","Rebel","Limited","Longhorn","Other / Not sure"],
  Subaru:["Base","Premium","Sport","Limited","Touring","Wilderness","Other / Not sure"],
  Tesla:["Standard Range","Long Range","Performance","Plaid","Other / Not sure"],
  Toyota:["L","LE","SE","XLE","XSE","SR","SR5","Limited","Platinum","TRD","Other / Not sure"],
  Volkswagen:["S","SE","SEL","R-Line","GLI","GTI","Other / Not sure"],
  Volvo:["Core","Plus","Ultimate","Momentum","Inscription","R-Design","Other / Not sure"]
};

const DEFAULT_ENGINES = [
  "1.4L 4-cylinder","1.5L 4-cylinder","1.6L 4-cylinder","1.8L 4-cylinder",
  "2.0L 4-cylinder","2.4L 4-cylinder","2.5L 4-cylinder","2.7L V6","3.0L V6",
  "3.5L V6","3.6L V6","3.8L V6","4.0L 6-cylinder","4.6L V8","5.0L V8",
  "5.3L V8","5.7L V8","6.0L V8","6.2L V8","Diesel","Hybrid","Electric",
  "Other / Not sure"
];
function getEngineOptions(make, model) {
  const name = (model || "").toLowerCase();
  if (make === "Tesla") return ["Electric","Other / Not sure"];
  if (/(prius|ioniq|niro|insight)/i.test(name)) return ["1.5L 4-cylinder","1.6L 4-cylinder","1.8L 4-cylinder","2.0L 4-cylinder","Hybrid","Other / Not sure"];
  if (/(f-250|f-350|silverado 2500|silverado 3500|sierra 2500|sierra 3500|ram 2500|ram 3500)/i.test(name)) return ["5.0L V8","5.3L V8","5.7L V8","6.0L V8","6.2L V8","Diesel","Other / Not sure"];
  return DEFAULT_ENGINES;
}

export default function VehicleFields({ value, onChange, required = false }) {
  const currentYear = new Date().getFullYear() + 1;
  const years = useMemo(
    () => Array.from({ length: currentYear - 1979 }, (_, i) => String(currentYear - i)),
    [currentYear]
  );
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

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
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(value.make)}/modelyear/${value.year}?format=json`
        );
        const json = await response.json();
        const next = [...new Set((json.Results || []).map((item) => item.Model_Name).filter(Boolean))].sort();
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

  function setField(field, nextValue) {
    const next = { ...value, [field]: nextValue };
    if (field === "year") {
      next.make = "";
      next.model = "";
      next.trim = "";
      next.engine = "";
      setModels([]);
    }
    if (field === "make") {
      next.model = "";
      next.trim = "";
      next.engine = "";
      setModels([]);
    }
    if (field === "model") {
      next.trim = "";
      next.engine = "";
    }
    if (field === "trim") {
      next.engine = "";
    }
    onChange(next);
  }

  const modelOptions = value.model && !models.includes(value.model)
    ? [value.model, ...models]
    : models;

  const trimOptions = value.model ? (TRIMS_BY_MAKE[value.make] || DEFAULT_TRIMS) : [];
  const engineOptions = value.model ? getEngineOptions(value.make, value.model) : [];
  const shownTrims = value.trim && !trimOptions.includes(value.trim) ? [value.trim, ...trimOptions] : trimOptions;
  const shownEngines = value.engine && !engineOptions.includes(value.engine) ? [value.engine, ...engineOptions] : engineOptions;

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
        <select value={value.make || ""} onChange={(e) => setField("make", e.target.value)} required={required} disabled={!value.year}>
          <option value="">{value.year ? "Select make" : "Select year first"}</option>
          {availableMakes.map((make) => <option key={make} value={make}>{make}</option>)}
        </select>
      </label>

      <label>
        Vehicle model {required && <span aria-hidden="true">*</span>}
        <select value={value.model || ""} onChange={(e) => setField("model", e.target.value)} required={required} disabled={!value.year || !value.make || loadingModels}>
          <option value="">{!value.make ? "Select make first" : loadingModels ? "Loading matching models..." : "Select model"}</option>
          {modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
          {!modelOptions.includes("Other / Not sure") && <option value="Other / Not sure">Other / Not sure</option>}
        </select>
      </label>

      <label>
        Trim
        <select value={value.trim || ""} onChange={(e) => setField("trim", e.target.value)} disabled={!value.model}>
          <option value="">{value.model ? "Select trim" : "Select model first"}</option>
          {shownTrims.map((trim) => <option key={trim} value={trim}>{trim}</option>)}
        </select>
      </label>

      <label>
        Engine
        <select value={value.engine || ""} onChange={(e) => setField("engine", e.target.value)} disabled={!value.model}>
          <option value="">{value.model ? "Select engine" : "Select model first"}</option>
          {shownEngines.map((engine) => <option key={engine} value={engine}>{engine}</option>)}
        </select>
      </label>
    </>
  );
}
