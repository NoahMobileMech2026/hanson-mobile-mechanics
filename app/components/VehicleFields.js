"use client";

import { useEffect, useState } from "react";

async function loadOptions(params) {
  const query = new URLSearchParams(params);
  const response = await fetch("/api/vehicle-catalog?" + query.toString(), {
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Vehicle lookup failed.");
  }

  return Array.isArray(data?.options) ? data.options : [];
}

export default function VehicleFields({ value, onChange }) {
  const [years,setYears] = useState([]);
  const [makes,setMakes] = useState([]);
  const [models,setModels] = useState([]);
  const [trims,setTrims] = useState([]);
  const [engines,setEngines] = useState([]);
  const [loading,setLoading] = useState("years");
  const [message,setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading("years");
    setMessage("");

    loadOptions({ level:"years" })
      .then((options) => {
        if (!active) return;
        setYears(options);
        if (!options.length) setMessage("No vehicle years were returned.");
      })
      .catch((error) => {
        if (!active) return;
        setYears([]);
        setMessage(error.message);
      })
      .finally(() => {
        if (active) setLoading("");
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setMakes([]);
    setModels([]);
    setTrims([]);
    setEngines([]);

    if (!value.year) return () => { active = false; };

    setLoading("makes");
    setMessage("");

    loadOptions({ level:"makes", year:value.year })
      .then((options) => {
        if (!active) return;
        setMakes(options);
        if (!options.length) setMessage("No makes were found for that year.");
      })
      .catch((error) => {
        if (!active) return;
        setMessage(error.message);
      })
      .finally(() => {
        if (active) setLoading("");
      });

    return () => { active = false; };
  }, [value.year]);

  useEffect(() => {
    let active = true;
    setModels([]);
    setTrims([]);
    setEngines([]);

    if (!value.year || !value.make) return () => { active = false; };

    setLoading("models");
    setMessage("");

    loadOptions({ level:"models", year:value.year, make:value.make })
      .then((options) => {
        if (!active) return;
        setModels(options);
        if (!options.length) setMessage("No models were found for that year and make.");
      })
      .catch((error) => {
        if (!active) return;
        setMessage(error.message);
      })
      .finally(() => {
        if (active) setLoading("");
      });

    return () => { active = false; };
  }, [value.year, value.make]);

  useEffect(() => {
    let active = true;
    setTrims([]);
    setEngines([]);

    if (!value.year || !value.make || !value.model) return () => { active = false; };

    setLoading("trims");
    setMessage("");

    loadOptions({
      level:"trims",
      year:value.year,
      make:value.make,
      model:value.model
    })
      .then((options) => {
        if (!active) return;
        setTrims(options);
        if (!options.length) setMessage("No trims were found for that exact vehicle.");
      })
      .catch((error) => {
        if (!active) return;
        setMessage(error.message);
      })
      .finally(() => {
        if (active) setLoading("");
      });

    return () => { active = false; };
  }, [value.year, value.make, value.model]);

  useEffect(() => {
    let active = true;
    setEngines([]);

    if (!value.year || !value.make || !value.model || !value.trim) {
      return () => { active = false; };
    }

    setLoading("engines");
    setMessage("");

    loadOptions({
      level:"engines",
      year:value.year,
      make:value.make,
      model:value.model,
      trim:value.trim
    })
      .then((options) => {
        if (!active) return;
        setEngines(options);

        if (options.length === 1) {
          onChange({ ...value, engine: options[0].value });
        } else if (!options.length) {
          setMessage("No engine choices were found for that exact trim.");
        }
      })
      .catch((error) => {
        if (!active) return;
        setMessage(error.message);
      })
      .finally(() => {
        if (active) setLoading("");
      });

    return () => { active = false; };
  }, [value.year, value.make, value.model, value.trim]);

  function change(field,nextValue) {
    const next = { ...value, [field]: nextValue };

    if (field === "year") {
      next.make = "";
      next.model = "";
      next.trim = "";
      next.engine = "";
    } else if (field === "make") {
      next.model = "";
      next.trim = "";
      next.engine = "";
    } else if (field === "model") {
      next.trim = "";
      next.engine = "";
    } else if (field === "trim") {
      next.engine = "";
    }

    onChange(next);
  }

  return <>
    <label>
      Vehicle year <span aria-hidden="true">*</span>
      <select
        required
        value={value.year || ""}
        onChange={(e)=>change("year",e.target.value)}
      >
        <option value="">{loading==="years" ? "Loading years..." : "Select year"}</option>
        {years.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>

    <label>
      Vehicle make <span aria-hidden="true">*</span>
      <select
        required
        value={value.make || ""}
        onChange={(e)=>change("make",e.target.value)}
        disabled={!value.year || loading==="makes"}
      >
        <option value="">
          {!value.year ? "Select year first" : loading==="makes" ? "Loading makes..." : "Select make"}
        </option>
        {makes.map((item)=><option key={item.id || item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>

    <label>
      Vehicle model <span aria-hidden="true">*</span>
      <select
        required
        value={value.model || ""}
        onChange={(e)=>change("model",e.target.value)}
        disabled={!value.make || loading==="models"}
      >
        <option value="">
          {!value.make ? "Select make first" : loading==="models" ? "Loading models..." : "Select model"}
        </option>
        {models.map((item)=><option key={item.id || item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>

    <label>
      Vehicle trim <span aria-hidden="true">*</span>
      <select
        required
        value={value.trim || ""}
        onChange={(e)=>change("trim",e.target.value)}
        disabled={!value.model || loading==="trims"}
      >
        <option value="">
          {!value.model ? "Select model first" : loading==="trims" ? "Loading trims..." : "Select trim"}
        </option>
        {trims.map((item)=><option key={item.id || item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>

    <label>
      Engine <span aria-hidden="true">*</span>
      <select
        required
        value={value.engine || ""}
        onChange={(e)=>change("engine",e.target.value)}
        disabled={!value.trim || loading==="engines"}
      >
        <option value="">
          {!value.trim ? "Select trim first" : loading==="engines" ? "Loading engines..." : "Select engine"}
        </option>
        {engines.map((item)=><option key={item.id || item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>

    {message && <div className="vehicle-cascade-note" aria-live="polite">{message}</div>}
  </>;
}
