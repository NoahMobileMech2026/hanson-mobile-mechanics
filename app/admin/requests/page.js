"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

export default function RequestsPage(){
  const supabase=useMemo(()=>getSupabase(),[]);
  const [authorized,setAuthorized]=useState(null);
  const [role,setRole]=useState(null);
  const [requests,setRequests]=useState([]);
  const [busyId,setBusyId]=useState(null);

  useEffect(()=>{init();},[]);

  async function init(){
    const { data:sessionData }=await supabase.auth.getSession();
    const user=sessionData.session?.user;
    if(!user){window.location.href="/admin";return;}
    const { data:admin }=await supabase.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();
    if(!admin || !["owner","team_member"].includes(admin.role)){setAuthorized(false);return;}
    setRole(admin.role);
    setAuthorized(true);
    await load();
  }

  async function load(){
    const { data,error }=await supabase.from("service_requests").select("*").order("created_at",{ascending:false}).limit(100);
    if(error){alert(error.message);return;}
    setRequests(data||[]);
  }

  async function updateStatus(id,status){
    setBusyId(id);
    const { error }=await supabase.from("service_requests").update({status}).eq("id",id);
    if(error) alert(error.message);
    await load();
    setBusyId(null);
  }

  async function createJob(request){
    setBusyId(request.id);
    try{
      if(!request.vehicle_year || !request.vehicle_make || !request.vehicle_model || !request.vehicle_trim || !request.vehicle_engine){
        throw new Error("Finish Year, Make, Model, Trim, and Engine before creating the job.");
      }

      let customer;
      const { data:existing }=await supabase.from("customers").select("*").eq("phone",request.phone).limit(1).maybeSingle();

      if(existing){
        customer=existing;
        const update=await supabase.from("customers").update({
          full_name:request.full_name,
          email:request.email||existing.email||null,
          address:request.service_location||existing.address||null
        }).eq("id",existing.id);
        if(update.error) throw update.error;
      }else{
        const created=await supabase.from("customers").insert({
          full_name:request.full_name,
          phone:request.phone,
          email:request.email||null,
          address:request.service_location
        }).select().single();
        if(created.error) throw created.error;
        customer=created.data;
      }

      const vehicle=await supabase.from("vehicles").insert({
        customer_id:customer.id,
        year:request.vehicle_year,
        make:request.vehicle_make,
        model:request.vehicle_model,
        trim:request.vehicle_trim,
        engine:request.vehicle_engine
      }).select().single();
      if(vehicle.error) throw vehicle.error;

      const job=await supabase.from("jobs").insert({
        service_request_id:request.id,
        customer_id:customer.id,
        vehicle_id:vehicle.data.id,
        service_location:request.service_location,
        complaint:request.issue_description,
        status:"new"
      }).select().single();
      if(job.error) throw job.error;

      await supabase.from("service_requests").update({status:"converted"}).eq("id",request.id);
      window.location.href="/admin/jobs/"+job.data.id;
    }catch(err){
      alert(err?.message||"Could not create job.");
      setBusyId(null);
    }
  }

  if(authorized===null) return <main className="admin-loading">Loading Requests...</main>;
  if(authorized===false) return <main className="admin-loading">Not authorized.</main>;

  const active=requests.filter(r=>["new","contacted","scheduled"].includes(r.status));
  const finished=requests.filter(r=>!["new","contacted","scheduled"].includes(r.status));

  return <main className="admin-page">
    <header className="admin-header">
      <div>
        <a className="admin-back-link" href={role==="owner"?"/admin/owner":"/admin/team"}>← Back</a>
        <h1>Requests</h1>
        <p>Work the top section first.</p>
      </div>
      <a className="btn btn-primary" href="/admin/call-intake">+ New Call</a>
    </header>

    <section className="admin-panel">
      <div className="admin-panel-heading"><div><h2>Needs Attention</h2><p>{active.length} waiting</p></div></div>
      <div className="admin-card-grid">
        {active.map(r=>(
          <div className="admin-record-card request-card-simple" key={r.id}>
            <span className="status-pill">{r.status}</span>
            <h3>{r.full_name}</h3>
            <p><strong>{r.phone}</strong></p>
            <p>{[r.vehicle_year,r.vehicle_make,r.vehicle_model,r.vehicle_trim].filter(Boolean).join(" ")}</p>
            <small>{r.vehicle_engine}</small>
            <p>{r.issue_description}</p>
            <label>Status
              <select value={r.status} disabled={busyId===r.id} onChange={e=>updateStatus(r.id,e.target.value)}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="scheduled">Scheduled</option>
                <option value="converted">Converted</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <button className="btn btn-primary simple-full-button" disabled={busyId===r.id} onClick={()=>createJob(r)}>
              {busyId===r.id?"Working...":"Create Job"}
            </button>
          </div>
        ))}
        {!active.length && <p>Nothing waiting. You are caught up.</p>}
      </div>
    </section>

    <details className="admin-panel admin-simple-details">
      <summary><span><strong>Finished Requests</strong><small>{finished.length} completed/converted/cancelled</small></span><span>Open</span></summary>
      <div className="admin-details-body">
        <div className="admin-card-grid">
          {finished.map(r=><div className="admin-record-card" key={r.id}><span className="status-pill">{r.status}</span><h3>{r.full_name}</h3><p>{[r.vehicle_year,r.vehicle_make,r.vehicle_model].filter(Boolean).join(" ")}</p></div>)}
          {!finished.length && <p>No finished requests yet.</p>}
        </div>
      </div>
    </details>
  </main>;
}
