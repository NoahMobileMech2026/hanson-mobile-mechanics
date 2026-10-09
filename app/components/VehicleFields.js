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

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function parseMenuText(text) {
  const trimmed = String(text || "").trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const json = JSON.parse(trimmed);
    return asArray(json?.menuItems?.menuItem)
      .map((item) => ({
        label: String(item?.text ?? "").trim(),
        value: String(item?.value ?? "").trim()
      }))
      .filter((item) => item.label && item.value);
  }

  const doc = new DOMParser().parseFromString(trimmed, "application/xml");
  return [...doc.querySelectorAll("menuItem")]
    .map((item) => ({
      label: decodeXml(item.querySelector("text")?.textContent || "").trim(),
      value: decodeXml(item.querySelector("value")?.textContent || "").trim()
    }))
    .filter((item) => item.label && item.value);
}

function parseVehicleText(text) {
  const trimmed = String(text || "").trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const json = JSON.parse(trimmed);
    return json?.vehicle ?? json;
  }

  const doc = new DOMParser().parseFromString(trimmed, "application/xml");
  const read = (tag) => decodeXml(doc.querySelector(tag)?.textContent || "").trim();

  return {
    displ: read("displ"),
    cylinders: read("cylinders"),
    fuelType1: read("fuelType1"),
    fuelType: read("fuelType"),
    drive: read("drive"),
    trany: read("trany")
  };
}

async function fuelText(path) {
  const response = await fetch("https://www.fueleconomy.gov/ws/rest" + path, {
    headers: { Accept: "application/json, application/xml;q=0.9, text/xml;q=0.8" }
  });
  if (!response.ok) throw new Error("Fuel economy vehicle catalog unavailable.");
  return response.text();
}

async function fuelMenu(path) {
  return parseMenuText(await fuelText(path));
}

async function nhtsaModels(year, make) {
  const response = await fetch(
    "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/" +
      encodeURIComponent(make) +
      "/modelyear/" +
      encodeURIComponent(year) +
      "?format=json"
  );
  if (!response.ok) throw new Error("NHTSA model lookup unavailable.");
  const json = await response.json();
  return [...new Set((json.Results || []).map((item) => item.Model_Name).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b))
    .map((name)=>({ label:name, value:name }));
}

function engineLabel(vehicle) {
  const liters = String(vehicle?.displ || "").trim();
  const cylinders = String(vehicle?.cylinders || "").trim();
  const fuel = String(vehicle?.fuelType1 || vehicle?.fuelType || "").trim();
  const parts = [];

  if (liters && liters !== "0") parts.push(liters + "L");
  if (cylinders) parts.push(cylinders + "-cylinder");
  if (fuel) parts.push(fuel);

  if (!parts.length && /electric/i.test(fuel)) return "Electric";
  return parts.join(" • ") || "";
}

export default function VehicleFields({ value, onChange, required = false }) {
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
  const [loadingModels,setLoadingModels] = useState(false);
  const [loadingConfigurations,setLoadingConfigurations] = useState(false);
  const [loadingEngines,setLoadingEngines] = useState(false);
  const [message,setMessage] = useState("");

  useEffect(()=>{
    setModels([]);
    setConfigurations([]);
    setEngines([]);
    setConfigurationId("");
    setManualModel(false);
    setManualConfiguration(false);
    setMessage("");
  },[value.year,value.make]);

  useEffect(()=>{
    let active=true;

    async function loadModels(){
      setModels([]);
      setConfigurations([]);
      setEngines([]);
      setConfigurationId("");

      if(!value.year || !value.make || value.make==="Other / Not listed") return;

      setLoadingModels(true);
      setMessage("");

      try{
        let options=[];
        try{
          options=await fuelMenu(
            "/vehicle/menu/model?year="+encodeURIComponent(value.year)+
            "&make="+encodeURIComponent(value.make)
          );
        }catch{
          options=[];
        }

        if(!options.length){
          try{
            options=await nhtsaModels(value.year,value.make);
          }catch{
            options=[];
          }
        }

        if(!active) return;
        setModels(options);
        if(!options.length){
          setManualModel(true);
          setMessage("The vehicle catalog did not return models. Enter the model manually below.");
        }
      } finally {
        if(active) setLoadingModels(false);
      }
    }

    loadModels();
    return ()=>{active=false;};
  },[value.year,value.make]);

  useEffect(()=>{
    let active=true;

    async function loadConfigurations(){
      setConfigurations([]);
      setEngines([]);
      setConfigurationId("");

      if(!value.year || !value.make || !value.model || manualModel) return;

      setLoadingConfigurations(true);
      setMessage("");

      try{
        const options=await fuelMenu(
          "/vehicle/menu/options?year="+encodeURIComponent(value.year)+
          "&make="+encodeURIComponent(value.make)+
          "&model="+encodeURIComponent(value.model)
        );

        if(!active) return;
        setConfigurations(options);

        if(!options.length){
          setManualConfiguration(true);
          setMessage("No exact configuration was returned for this vehicle. Enter the trim/configuration manually.");
        } else {
          setManualConfiguration(false);
          setMessage("Select the exact configuration to narrow the engine.");
        }
      } catch {
        if(active){
          setManualConfiguration(true);
          setMessage("Exact configuration lookup is unavailable. Enter the trim/configuration manually.");
        }
      } finally {
        if(active) setLoadingConfigurations(false);
      }
    }

    loadConfigurations();
    return ()=>{active=false;};
  },[value.year,value.make,value.model,manualModel]);

  useEffect(()=>{
    let active=true;

    async function loadEngine(){
      setEngines([]);
      if(!configurationId) return;

      setLoadingEngines(true);
      try{
        const vehicle=parseVehicleText(await fuelText("/vehicle/"+encodeURIComponent(configurationId)));
        const label=engineLabel(vehicle);

        if(!active) return;
        setEngines(label ? [label] : []);
        setMessage(
          label
            ? "Engine matched to the selected exact configuration."
            : "The catalog did not publish an engine description. Enter it manually."
        );
      } catch {
        if(active){
          setEngines([]);
          setMessage("Engine lookup is unavailable. Enter the engine manually.");
        }
      } finally {
        if(active) setLoadingEngines(false);
      }
    }

    loadEngine();
    return ()=>{active=false;};
  },[configurationId]);

  function change(field,nextValue){
    const next={...value,[field]:nextValue};

    if(field==="year"){
      next.make=""; next.model=""; next.trim=""; next.engine="";
    }
    if(field==="make"){
      next.model=""; next.trim=""; next.engine="";
      setManualModel(nextValue==="Other / Not listed");
    }
    if(field==="model"){
      next.trim=""; next.engine="";
      setManualConfiguration(false);
      setConfigurationId("");
    }
    if(field==="trim"){
      next.engine="";
    }

    onChange(next);
  }

  function chooseModel(event){
    const nextValue=event.target.value;
    if(nextValue==="__manual__"){
      setManualModel(true);
      setManualConfiguration(true);
      setConfigurationId("");
      onChange({...value,model:"",trim:"",engine:""});
      return;
    }
    setManualModel(false);
    change("model",nextValue);
  }

  function chooseConfiguration(event){
    const id=event.target.value;
    if(id==="__manual__"){
      setManualConfiguration(true);
      setConfigurationId("");
      onChange({...value,trim:"",engine:""});
      return;
    }

    const selected=configurations.find((item)=>item.value===id);
    setManualConfiguration(false);
    setConfigurationId(id);
    onChange({...value,trim:selected?.label || "",engine:""});
  }

  const selectedConfigurationValue =
    configurationId ||
    configurations.find((item)=>item.label===value.trim)?.value ||
    "";

  return <>
    <label>
      Vehicle year
      <select value={value.year || ""} onChange={(e)=>change("year",e.target.value)}>
        <option value="">Select year</option>
        {years.map((year)=><option key={year} value={year}>{year}</option>)}
      </select>
    </label>

    <label>
      Vehicle make {required && <span aria-hidden="true">*</span>}
      <select
        value={value.make || ""}
        onChange={(e)=>change("make",e.target.value)}
        required={required}
        disabled={!value.year}
      >
        <option value="">{value.year ? "Select make" : "Select year first"}</option>
        {MAKES.map((make)=><option key={make} value={make}>{make}</option>)}
      </select>
    </label>

    <label>
      Vehicle model {required && <span aria-hidden="true">*</span>}
      {!manualModel ? (
        <select
          value={value.model || ""}
          onChange={chooseModel}
          required={required}
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
          {models.map((item)=><option key={item.value} value={item.label}>{item.label}</option>)}
          <option value="__manual__">Other / Enter manually</option>
        </select>
      ) : (
        <input
          required={required}
          value={value.model || ""}
          onChange={(e)=>onChange({...value,model:e.target.value,trim:"",engine:""})}
          placeholder="Enter vehicle model"
        />
      )}
    </label>

    <label>
      Trim / exact configuration
      {!manualModel && !manualConfiguration ? (
        <select
          value={selectedConfigurationValue}
          onChange={chooseConfiguration}
          disabled={!value.model || loadingConfigurations}
        >
          <option value="">
            {!value.model
              ? "Select model first"
              : loadingConfigurations
                ? "Loading configurations..."
                : configurations.length
                  ? "Select exact configuration"
                  : "No configuration list returned"}
          </option>
          {configurations.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}
          <option value="__manual__">Other / Enter manually</option>
        </select>
      ) : (
        <input
          value={value.trim || ""}
          onChange={(e)=>onChange({...value,trim:e.target.value,engine:""})}
          placeholder="Enter trim/configuration (optional)"
        />
      )}
    </label>

    <label>
      Engine
      {configurationId && engines.length ? (
        <select
          value={value.engine || ""}
          onChange={(e)=>change("engine",e.target.value)}
          disabled={loadingEngines}
        >
          <option value="">{loadingEngines ? "Loading engine..." : "Select engine"}</option>
          {engines.map((engine)=><option key={engine} value={engine}>{engine}</option>)}
        </select>
      ) : (
        <input
          value={value.engine || ""}
          onChange={(e)=>change("engine",e.target.value)}
          placeholder={loadingEngines ? "Loading engine..." : "Enter engine (optional)"}
        />
      )}
    </label>

    {message && <div className="vehicle-cascade-note" aria-live="polite">{message}</div>}
  </>;
}
