"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";
import VehicleFields from "../../components/VehicleFields";

const BLANK = {
  full_name:"", phone:"", email:"", preferred_contact:"phone", service_location:"",
  vehicle_year:"", vehicle_make:"", vehicle_model:"", vehicle_trim:"", vehicle_engine:"",
  issue_description:"", vehicle_starts:"", vehicle_drivable:"", warning_lights:"",
  fluid_leaks:"", unusual_noises:"", issue_started:"", recent_repairs:"",
  urgency:"", availability:"", intake_notes:""
};

export default function CallIntakePage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [authorized,setAuthorized] = useState(null);
  const [form,setForm] = useState(BLANK);
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState("");

  useEffect(() => { init(); }, []);

  async function init() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) { window.location.href="/admin"; return; }
    const { data: admin } = await supabase.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();
    setAuthorized(!!admin);
  }

  function change(e){ setForm(v => ({...v,[e.target.name]:e.target.value})); }
  function changeVehicle(v){
    setForm(f => ({...f,vehicle_year:v.year,vehicle_make:v.make,vehicle_model:v.model,vehicle_trim:v.trim,vehicle_engine:v.engine}));
  }

  function complaint(){
    return [
      form.issue_description,
      form.vehicle_starts && "Starts: "+form.vehicle_starts,
      form.vehicle_drivable && "Drivable: "+form.vehicle_drivable,
      form.warning_lights && "Warning lights: "+form.warning_lights,
      form.fluid_leaks && "Leaks: "+form.fluid_leaks,
      form.unusual_noises && "Noises: "+form.unusual_noises,
      form.issue_started && "Started: "+form.issue_started,
      form.recent_repairs && "Recent work: "+form.recent_repairs,
      form.urgency && "Urgency: "+form.urgency,
      form.availability && "Availability: "+form.availability
    ].filter(Boolean).join("\n");
  }

  async function save(createJob){
    setMessage("");
    if(
      !form.full_name ||
      !form.phone ||
      !form.service_location ||
      !form.vehicle_year ||
      !form.vehicle_make ||
      !form.vehicle_model ||
      !form.vehicle_trim ||
      !form.vehicle_engine ||
      !form.issue_description
    ){
      setMessage("Complete the caller, location, Year, Make, Model, Trim/Configuration, Engine, and main problem first.");
      return;
    }
    setSaving(true);
    try {
      const { data:request,error } = await supabase.from("service_requests").insert({
        full_name:form.full_name, phone:form.phone, email:form.email||null,
        preferred_contact:form.preferred_contact, service_location:form.service_location,
        vehicle_year:form.vehicle_year, vehicle_make:form.vehicle_make, vehicle_model:form.vehicle_model,
        vehicle_trim:form.vehicle_trim, vehicle_engine:form.vehicle_engine,
        issue_description:form.issue_description, intake_source:"phone",
        vehicle_starts:form.vehicle_starts||null, vehicle_drivable:form.vehicle_drivable||null,
        warning_lights:form.warning_lights||null, fluid_leaks:form.fluid_leaks||null,
        unusual_noises:form.unusual_noises||null, issue_started:form.issue_started||null,
        recent_repairs:form.recent_repairs||null, urgency:form.urgency||null,
        availability:form.availability||null, intake_notes:form.intake_notes||null,
        status:createJob ? "converted" : "new"
      }).select().single();
      if(error) throw error;

      if(!createJob){
        setForm(BLANK);
        setMessage("Saved as a new service request.");
        return;
      }

      let customer;
      const { data:existing } = await supabase.from("customers").select("*").eq("phone",form.phone).limit(1).maybeSingle();
      if(existing){
        customer=existing;
        await supabase.from("customers").update({full_name:form.full_name,email:form.email||existing.email||null,address:form.service_location}).eq("id",existing.id);
      } else {
        const r=await supabase.from("customers").insert({full_name:form.full_name,phone:form.phone,email:form.email||null,address:form.service_location}).select().single();
        if(r.error) throw r.error;
        customer=r.data;
      }

      const vr=await supabase.from("vehicles").insert({
        customer_id:customer.id,year:form.vehicle_year,make:form.vehicle_make,model:form.vehicle_model,
        trim:form.vehicle_trim,engine:form.vehicle_engine
      }).select().single();
      if(vr.error) throw vr.error;

      const jr=await supabase.from("jobs").insert({
        service_request_id:request.id,customer_id:customer.id,vehicle_id:vr.data.id,
        service_location:form.service_location,complaint:complaint(),internal_notes:form.intake_notes||null,status:"new"
      }).select().single();
      if(jr.error) throw jr.error;

      window.location.href="/admin/jobs/"+jr.data.id;
    } catch(err){
      setMessage(err?.message || "Could not save intake.");
    } finally {
      setSaving(false);
    }
  }

  if(authorized===null) return <main className="admin-loading">Loading call intake...</main>;
  if(!authorized) return <main className="admin-auth-page"><div className="admin-login-card"><h1>Access not authorized</h1><a className="btn btn-primary" href="/admin">Back</a></div></main>;

  const vehicle={year:form.vehicle_year,make:form.vehicle_make,model:form.vehicle_model,trim:form.vehicle_trim,engine:form.vehicle_engine};

  return <main className="admin-page">
    <header className="admin-header">
      <div><div className="admin-kicker">Hanson Mobile Mechanics</div><h1>Phone Call Intake</h1><p>Follow this top to bottom while the customer is on the phone.</p></div>
      <div className="admin-header-actions"><a className="btn btn-secondary" href="/admin">Back to Command Center</a></div>
    </header>

    {message && <p className="form-message">{message}</p>}

    <section className="admin-panel">
      <h2>Opening Script</h2>
      <p><strong>Say:</strong> “Thanks for calling Hanson’s Mobile Mechanics. I’m going to get your contact, vehicle, location, and a few details about what it’s doing so we can figure out the best next step.”</p>
    </section>

    <section className="admin-panel">
      <h2>1. Caller Information</h2>
      <p><strong>Say:</strong> “Who am I speaking with and what’s the best number to reach you?”</p>
      <div className="admin-form-grid">
        <label>Name *<input name="full_name" value={form.full_name} onChange={change}/></label>
        <label>Phone *<input name="phone" value={form.phone} onChange={change}/></label>
        <label>Email<input name="email" value={form.email} onChange={change}/></label>
        <label>Preferred contact<select name="preferred_contact" value={form.preferred_contact} onChange={change}><option value="phone">Phone</option><option value="text">Text</option><option value="email">Email</option></select></label>
      </div>
      <label className="admin-full-label">Vehicle location *<textarea name="service_location" value={form.service_location} onChange={change}/></label>
    </section>

    <section className="admin-panel">
      <h2>2. Vehicle</h2>
      <p><strong>Ask:</strong> “What year, make, and model is it? Do you know the trim and engine?”</p>
      <div className="admin-form-grid"><VehicleFields value={vehicle} onChange={changeVehicle} required/></div>
    </section>

    <section className="admin-panel">
      <h2>3. Symptoms</h2>
      <p><strong>Say:</strong> “Tell me what happened in your own words. What made you call today?”</p>
      <label className="admin-full-label">Main problem *<textarea name="issue_description" value={form.issue_description} onChange={change}/></label>
      <div className="admin-form-grid">
        <label>Does it start?<select name="vehicle_starts" value={form.vehicle_starts} onChange={change}><option value="">Select</option><option>Yes</option><option>No</option><option>Sometimes / intermittent</option><option>Not sure</option></select></label>
        <label>Can it be driven safely?<select name="vehicle_drivable" value={form.vehicle_drivable} onChange={change}><option value="">Select</option><option>Yes</option><option>No</option><option>Runs but may be unsafe</option><option>Not sure</option></select></label>
        <label>Warning lights<input name="warning_lights" value={form.warning_lights} onChange={change}/></label>
        <label>Fluid leaks<input name="fluid_leaks" value={form.fluid_leaks} onChange={change}/></label>
        <label>Unusual noises<input name="unusual_noises" value={form.unusual_noises} onChange={change}/></label>
        <label>When did it start?<input name="issue_started" value={form.issue_started} onChange={change}/></label>
      </div>
      <label className="admin-full-label">Recent repairs or parts replaced?<textarea name="recent_repairs" value={form.recent_repairs} onChange={change}/></label>
    </section>

    <section className="admin-panel">
      <h2>4. Urgency & Scheduling</h2>
      <p><strong>Ask:</strong> “Are you stranded right now, or can this be scheduled? When are you available?”</p>
      <div className="admin-form-grid">
        <label>Urgency<select name="urgency" value={form.urgency} onChange={change}><option value="">Select</option><option>Stranded now</option><option>Needs same-day help</option><option>Needs help soon</option><option>Routine / can schedule</option><option>Not sure</option></select></label>
        <label>Best availability<input name="availability" value={form.availability} onChange={change}/></label>
      </div>
      <label className="admin-full-label">Internal notes<textarea name="intake_notes" value={form.intake_notes} onChange={change}/></label>
    </section>

    <section className="admin-panel">
      <h2>5. Repeat It Back & Save</h2>
      <p><strong>Say:</strong> “Let me make sure I have this right before we hang up.”</p>
      <p><strong>{form.full_name || "Customer"}</strong> • {form.phone || "phone"} • {[form.vehicle_year,form.vehicle_make,form.vehicle_model,form.vehicle_trim,form.vehicle_engine].filter(Boolean).join(" ") || "vehicle not finished"} • {form.service_location || "location not entered"}</p>
      <div className="admin-header-actions">
        <button className="btn btn-secondary" disabled={saving} onClick={()=>save(false)}>{saving?"Saving...":"Save as Service Request"}</button>
        <button className="btn btn-primary" disabled={saving} onClick={()=>save(true)}>{saving?"Creating...":"Save & Create Job"}</button>
      </div>
    </section>
  </main>;
}
