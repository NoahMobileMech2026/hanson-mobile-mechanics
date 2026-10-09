"use client";

import { useEffect, useMemo, useState } from "react";

function addCurrent(options, current, label) {
  if (!current) return options;
  if (options.some((item) => item.label === current || item.value === current)) return options;
  return [{ label: current + " (saved)", value: current }, ...options];
}

async function loadLevel(params) {
  try {
    const query = new URLSearchParams(params);
    const response = await fetch("/api/vehicle-catalog?" + query.toString(), { cache: "no-store" });
    if (!response.ok) throw new Error("Vehicle lookup request failed.");
    const data = await response.json();
    return {
      options: Array.isArray(data.options) ? data.options : [],
      error: data.error || "",
      details: data.details || null
    };
  } catch {
    return {
      options: [],
      error: "Vehicle data could not load. Please try the selection again.",
      details: null
    };
  }
}

export default function VehicleFields({ value, onChange, required = false }) {
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1983 }, (_, i) => {
      const year = String(currentYear - i);
      return { label: year, value: year };
    });
  }, []);
  const [makes,setMakes] = useState([]);
  const [models,setModels] = useState([]);
  const [configs,setConfigs] = useState([]);
  const [engines,setEngines] = useState([]);
  const [loading,setLoading] = useState("");
  const [message,setMessage] = useState("");
  const [configId,setConfigId] = useState("");

  useEffect(() => {
    let active=true;
    setMakes([]); setModels([]); setConfigs([]); setEngines([]); setConfigId("");
    if(!value.year) return ()=>{active=false;};
    setLoading("make");
    loadLevel({ level:"makes", year:value.year }).then((r)=>{
      if(!active) return;
      setMakes(addCurrent(r.options,value.make,"make"));
      setMessage(r.error);
      setLoading("");
    }).catch(()=>{
      if(!active) return;
      setMessage("Vehicle makes could not load. Select the year again to retry.");
      setLoading("");
    });
    return ()=>{active=false;};
  },[value.year]);

  useEffect(() => {
    let active=true;
    setModels([]); setConfigs([]); setEngines([]); setConfigId("");
    if(!value.year || !value.make) return ()=>{active=false;};
    setLoading("model");
    loadLevel({ level:"models", year:value.year, make:value.make }).then((r)=>{
      if(!active) return;
      setModels(addCurrent(r.options,value.model,"model"));
      setMessage(r.error);
      setLoading("");
    }).catch(()=>{
      if(!active) return;
      setMessage("Vehicle models could not load. Select the make again to retry.");
      setLoading("");
    });
    return ()=>{active=false;};
  },[value.year,value.make]);

  useEffect(() => {
    let active=true;
    setConfigs([]); setEngines([]); setConfigId("");
    if(!value.year || !value.make || !value.model) return ()=>{active=false;};
    setLoading("configuration");
    loadLevel({
      level:"configurations",
      year:value.year,
      make:value.make,
      model:value.model
    }).then((r)=>{
      if(!active) return;
      const opts=r.options;
      setConfigs(addCurrent(opts,value.trim,"configuration"));
      if(!opts.length && !r.error) {
        setMessage("No exact EPA configuration is published for this vehicle. Do not guess the trim or engine.");
      } else {
        setMessage(r.error || "Choose the exact configuration. The engine list will then be limited to that vehicle record.");
      }
      setLoading("");
    });
    return ()=>{active=false;};
  },[value.year,value.make,value.model]);

  useEffect(() => {
    let active=true;
    setEngines([]);
    if(!configId) return ()=>{active=false;};
    setLoading("engine");
    loadLevel({ level:"engine", vehicleId:configId }).then((r)=>{
      if(!active) return;
      const opts=addCurrent(r.options,value.engine,"engine");
      setEngines(opts);
      setMessage(r.error || "Only the engine published for the selected exact configuration is shown.");
      setLoading("");
    });
    return ()=>{active=false;};
  },[configId]);

  function setField(field,nextValue) {
    const next={...value,[field]:nextValue};

    if(field==="year"){
      next.make=""; next.model=""; next.trim=""; next.engine="";
      setConfigId("");
    }
    if(field==="make"){
      next.model=""; next.trim=""; next.engine="";
      setConfigId("");
    }
    if(field==="model"){
      next.trim=""; next.engine="";
      setConfigId("");
    }
    if(field==="trim"){
      next.engine="";
      const selected=configs.find((item)=>item.label===nextValue || item.value===nextValue);
      setConfigId(selected && /^\d+$/.test(selected.value) ? selected.value : "");
    }

    onChange(next);
  }

  function chooseConfiguration(event) {
    const id=event.target.value;
    const selected=configs.find((item)=>item.value===id);
    setConfigId(id);
    onChange({...value,trim:selected?.label || "",engine:""});
  }

  return <>
    <label>
      Vehicle year
      <select value={value.year || ""} onChange={(e)=>setField("year",e.target.value)}>
        <option value="">Select year</option>
        {years.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>

    <label>
      Vehicle make {required && <span aria-hidden="true">*</span>}
      <select value={value.make || ""} onChange={(e)=>setField("make",e.target.value)} required={required} disabled={!value.year || loading==="make"}>
        <option value="">{!value.year ? "Select year first" : loading==="make" ? "Loading makes..." : "Select make"}</option>
        {makes.map((item)=><option key={item.value} value={item.label}>{item.label}</option>)}
      </select>
    </label>

    <label>
      Vehicle model {required && <span aria-hidden="true">*</span>}
      <select value={value.model || ""} onChange={(e)=>setField("model",e.target.value)} required={required} disabled={!value.make || loading==="model"}>
        <option value="">{!value.make ? "Select make first" : loading==="model" ? "Loading models..." : "Select model"}</option>
        {models.map((item)=><option key={item.value} value={item.label}>{item.label}</option>)}
      </select>
    </label>

    <label>
      Trim / exact configuration
      <select
        value={configId || (configs.find((item)=>item.label===value.trim)?.value || "")}
        onChange={chooseConfiguration}
        disabled={!value.model || loading==="configuration" || !configs.length}
      >
        <option value="">
          {!value.model ? "Select model first" : loading==="configuration" ? "Loading exact configurations..." : configs.length ? "Select exact configuration" : "No verified configuration listed"}
        </option>
        {configs.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>

    <label>
      Engine
      <select value={value.engine || ""} onChange={(e)=>setField("engine",e.target.value)} disabled={!configId || loading==="engine" || !engines.length}>
        <option value="">
          {!configId ? "Select configuration first" : loading==="engine" ? "Loading exact engine..." : engines.length ? "Select engine" : "No verified engine listed"}
        </option>
        {engines.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>

    {message && <div className="vehicle-cascade-note" aria-live="polite">{message}</div>}
  </>;
}
