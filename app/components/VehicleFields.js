"use client";

import { useEffect, useMemo, useState } from "react";

const MAKES = [
  "Acura","Alfa Romeo","Audi","BMW","Buick","Cadillac","Chevrolet","Chrysler",
  "Dodge","Fiat","Ford","Genesis","GMC","Honda","Hummer","Hyundai","Infiniti",
  "Isuzu","Jaguar","Jeep","Kia","Land Rover","Lexus","Lincoln","Mazda",
  "Mercedes-Benz","Mercury","MINI","Mitsubishi","Nissan","Oldsmobile","Pontiac",
  "Porsche","Ram","Saab","Saturn","Scion","Subaru","Suzuki","Tesla","Toyota",
  "Volkswagen","Volvo","Other / Not listed"
];

async function catalog(params) {
  const query = new URLSearchParams(params);
  const response = await fetch("/api/vehicle-catalog?" + query.toString(), {
    cache: "no-store"
  });

  if (!response.ok) throw new Error("Vehicle lookup failed.");

  const data = await response.json();
  if (data?.error && !Array.isArray(data.options)) throw new Error(data.error);

  return {
    options: Array.isArray(data?.options) ? data.options : [],
    error: data?.error || ""
  };
}

export default function VehicleFields({ value, onChange }) {
  const years = useMemo(() => {
    const newest = new Date().getFullYear() + 1;
    return Array.from({ length: newest - 1983 }, (_, i) => String(newest - i));
  }, []);

  const [models,setModels] = useState([]);
  const [configurations,setConfigurations] = useState([]);
  const [engines,setEngines] = useState([]);
  const [configurationId,setConfigurationId] = useState("");
  const [manualModel,setManualModel] = useState(false);
  const [manualConfiguration,setManualConfiguration] = useState(false);
  const [manualEngine,setManualEngine] = useState(false);
  const [loadingModels,setLoadingModels] = useState(false);
  const [loadingConfigurations,setLoadingConfigurations] = useState(false);
  const [loadingEngines,setLoadingEngines] = useState(false);
  const [message,setMessage] = useState("");

  useEffect(() => {
    setModels([]);
    setConfigurations([]);
    setEngines([]);
    setConfigurationId("");
    setManualModel(false);
    setManualConfiguration(false);
    setManualEngine(false);
    setMessage("");
  }, [value.year, value.make]);

  useEffect(() => {
    let active = true;

    async function loadModels() {
      setModels([]);
      setConfigurations([]);
      setEngines([]);
      setConfigurationId("");
      setManualModel(false);
      setManualConfiguration(false);
      setManualEngine(false);

      if (!value.year || !value.make || value.make === "Other / Not listed") {
        if (value.make === "Other / Not listed") {
          setManualModel(true);
          setManualConfiguration(true);
          setManualEngine(true);
          setMessage("Enter the complete vehicle information manually.");
        }
        return;
      }

      setLoadingModels(true);
      setMessage("");

      try {
        const result = await catalog({
          level: "models",
          year: value.year,
          make: value.make
        });

        if (!active) return;

        setModels(result.options);

        if (!result.options.length) {
          setManualModel(true);
          setManualConfiguration(true);
          setManualEngine(true);
          setMessage("No model list was returned. Enter the complete vehicle information manually.");
        }
      } catch {
        if (!active) return;
        setManualModel(true);
        setManualConfiguration(true);
        setManualEngine(true);
        setMessage("Vehicle model lookup is unavailable. Enter the complete vehicle information manually.");
      } finally {
        if (active) setLoadingModels(false);
      }
    }

    loadModels();
    return () => { active = false; };
  }, [value.year, value.make]);

  useEffect(() => {
    let active = true;

    async function loadConfigurations() {
      setConfigurations([]);
      setEngines([]);
      setConfigurationId("");
      setManualEngine(false);

      if (!value.year || !value.make || !value.model || manualModel) return;

      setLoadingConfigurations(true);
      setMessage("");

      try {
        const result = await catalog({
          level: "configurations",
          year: value.year,
          make: value.make,
          model: value.model
        });

        if (!active) return;

        setConfigurations(result.options);

        if (!result.options.length) {
          setManualConfiguration(true);
          setManualEngine(true);
          setMessage("No exact configuration was returned. Enter trim/configuration and engine manually.");
        } else {
          setManualConfiguration(false);
          setMessage("Select the exact configuration to load the matching engine.");
        }
      } catch {
        if (!active) return;
        setManualConfiguration(true);
        setManualEngine(true);
        setMessage("Exact configuration lookup is unavailable. Enter trim/configuration and engine manually.");
      } finally {
        if (active) setLoadingConfigurations(false);
      }
    }

    loadConfigurations();
    return () => { active = false; };
  }, [value.year, value.make, value.model, manualModel]);

  useEffect(() => {
    let active = true;

    async function loadEngine() {
      setEngines([]);
      if (!configurationId) return;

      setLoadingEngines(true);
      setManualEngine(false);
      setMessage("");

      try {
        const result = await catalog({
          level: "engine",
          vehicleId: configurationId
        });

        if (!active) return;

        setEngines(result.options);

        if (!result.options.length) {
          setManualEngine(true);
          setMessage("No engine was returned for this configuration. Enter the engine manually.");
          return;
        }

        if (result.options.length === 1) {
          onChange({ ...value, engine: result.options[0].value });
        }

        setMessage("Engine matched to the selected exact vehicle configuration.");
      } catch {
        if (!active) return;
        setManualEngine(true);
        setMessage("Engine lookup is unavailable. Enter the engine manually.");
      } finally {
        if (active) setLoadingEngines(false);
      }
    }

    loadEngine();
    return () => { active = false; };
  }, [configurationId]);

  function change(field,nextValue) {
    const next = { ...value, [field]: nextValue };

    if (field === "year") {
      next.make = "";
      next.model = "";
      next.trim = "";
      next.engine = "";
    }

    if (field === "make") {
      next.model = "";
      next.trim = "";
      next.engine = "";
    }

    if (field === "model") {
      next.trim = "";
      next.engine = "";
      setConfigurationId("");
      setManualConfiguration(false);
      setManualEngine(false);
    }

    if (field === "trim") {
      next.engine = "";
    }

    onChange(next);
  }

  function chooseModel(event) {
    const nextValue = event.target.value;

    if (nextValue === "__manual__") {
      setManualModel(true);
      setManualConfiguration(true);
      setManualEngine(true);
      setConfigurationId("");
      onChange({ ...value, model:"", trim:"", engine:"" });
      return;
    }

    setManualModel(false);
    change("model", nextValue);
  }

  function chooseConfiguration(event) {
    const id = event.target.value;

    if (id === "__manual__") {
      setManualConfiguration(true);
      setManualEngine(true);
      setConfigurationId("");
      onChange({ ...value, trim:"", engine:"" });
      return;
    }

    const selected = configurations.find((item) => item.value === id);
    setManualConfiguration(false);
    setManualEngine(false);
    setConfigurationId(id);
    onChange({ ...value, trim:selected?.label || "", engine:"" });
  }

  const selectedConfigurationValue =
    configurationId ||
    configurations.find((item) => item.label === value.trim)?.value ||
    "";

  return <>
    <label>
      Vehicle year <span aria-hidden="true">*</span>
      <select
        required
        value={value.year || ""}
        onChange={(e)=>change("year",e.target.value)}
      >
        <option value="">Select year</option>
        {years.map((year)=><option key={year} value={year}>{year}</option>)}
      </select>
    </label>

    <label>
      Vehicle make <span aria-hidden="true">*</span>
      <select
        required
        value={value.make || ""}
        onChange={(e)=>change("make",e.target.value)}
        disabled={!value.year}
      >
        <option value="">{value.year ? "Select make" : "Select year first"}</option>
        {MAKES.map((make)=><option key={make} value={make}>{make}</option>)}
      </select>
    </label>

    <label>
      Vehicle model <span aria-hidden="true">*</span>
      {!manualModel ? (
        <select
          required
          value={value.model || ""}
          onChange={chooseModel}
          disabled={!value.make || loadingModels}
        >
          <option value="">
            {!value.make
              ? "Select make first"
              : loadingModels
                ? "Loading models..."
                : models.length
                  ? "Select model"
                  : "No model list returned"}
          </option>
          {models.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}
          <option value="__manual__">Other / Enter manually</option>
        </select>
      ) : (
        <input
          required
          value={value.model || ""}
          onChange={(e)=>onChange({...value,model:e.target.value,trim:"",engine:""})}
          placeholder="Enter vehicle model"
        />
      )}
    </label>

    <label>
      Trim / exact configuration <span aria-hidden="true">*</span>
      {!manualConfiguration ? (
        <select
          required
          value={selectedConfigurationValue}
          onChange={chooseConfiguration}
          disabled={!value.model || loadingConfigurations}
        >
          <option value="">
            {!value.model
              ? "Select model first"
              : loadingConfigurations
                ? "Loading exact configurations..."
                : configurations.length
                  ? "Select exact configuration"
                  : "No exact configuration returned"}
          </option>
          {configurations.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}
          <option value="__manual__">Other / Enter manually</option>
        </select>
      ) : (
        <input
          required
          value={value.trim || ""}
          onChange={(e)=>onChange({...value,trim:e.target.value,engine:""})}
          placeholder="Enter trim / exact configuration"
        />
      )}
    </label>

    <label>
      Engine <span aria-hidden="true">*</span>
      {!manualEngine && configurationId ? (
        <select
          required
          value={value.engine || ""}
          onChange={(e)=>change("engine",e.target.value)}
          disabled={loadingEngines}
        >
          <option value="">{loadingEngines ? "Loading matching engine..." : "Select engine"}</option>
          {engines.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      ) : (
        <input
          required
          value={value.engine || ""}
          onChange={(e)=>change("engine",e.target.value)}
          placeholder={loadingEngines ? "Loading matching engine..." : "Enter engine"}
        />
      )}
    </label>

    {message && <div className="vehicle-cascade-note" aria-live="polite">{message}</div>}
  </>;
}
