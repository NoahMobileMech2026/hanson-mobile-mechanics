"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

export default function JobsPage(){
  const supabase=useMemo(()=>getSupabase(),[]);
  const [authorized,setAuthorized]=useState(null);
  const [role,setRole]=useState(null);
  const [jobs,setJobs]=useState([]);
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
    const { data,error }=await supabase.from("jobs").select("id,status,scheduled_for,service_location,created_at,archived_at,customers(full_name,phone),vehicles(year,make,model,trim,engine)").order("created_at",{ascending:false}).limit(200);
    if(error){alert(error.message);return;}
    setJobs(data||[]);
  }

  async function restore(id){
    setBusyId(id);
    const { error }=await supabase.from("jobs").update({archived_at:null}).eq("id",id);
    if(error) alert(error.message);
    await load();
    setBusyId(null);
  }

  if(authorized===null) return <main className="admin-loading">Loading Jobs...</main>;
  if(authorized===false) return <main className="admin-loading">Not authorized.</main>;

  const active=jobs.filter(j=>!j.archived_at && !["completed","cancelled"].includes(j.status));
  const completed=jobs.filter(j=>!j.archived_at && ["completed","cancelled"].includes(j.status));
  const archived=jobs.filter(j=>j.archived_at);

  return <main className="admin-page">
    <header className="admin-header">
      <div>
        <a className="admin-back-link" href={role==="owner"?"/admin/owner":"/admin/team"}>← Back</a>
        <h1>Jobs</h1>
        <p>Tap a customer to open the job.</p>
      </div>
    </header>

    <section className="admin-panel">
      <div className="admin-panel-heading"><div><h2>Active Jobs</h2><p>{active.length} open</p></div></div>
      <div className="admin-card-grid">
        {active.map(j=>(
          <a className="admin-record-card job-card-simple" href={"/admin/jobs/"+j.id} key={j.id}>
            <span className="status-pill">{j.status.replaceAll("_"," ")}</span>
            <h3>{j.customers?.full_name||"Customer"}</h3>
            <p>{[j.vehicles?.year,j.vehicles?.make,j.vehicles?.model,j.vehicles?.trim].filter(Boolean).join(" ")}</p>
            <small>{j.vehicles?.engine}</small>
            <p>{j.service_location||"No location entered"}</p>
          </a>
        ))}
        {!active.length && <p>No active jobs.</p>}
      </div>
    </section>

    <details className="admin-panel admin-simple-details">
      <summary><span><strong>Completed / Cancelled</strong><small>{completed.length} jobs</small></span><span>Open</span></summary>
      <div className="admin-details-body">
        <div className="admin-card-grid">
          {completed.map(j=><a className="admin-record-card" href={"/admin/jobs/"+j.id} key={j.id}><span className="status-pill">{j.status}</span><h3>{j.customers?.full_name||"Customer"}</h3><p>{[j.vehicles?.year,j.vehicles?.make,j.vehicles?.model].filter(Boolean).join(" ")}</p></a>)}
          {!completed.length && <p>No completed jobs yet.</p>}
        </div>
      </div>
    </details>

    {role==="owner" && <details className="admin-panel admin-simple-details">
      <summary><span><strong>Archive</strong><small>{archived.length} jobs</small></span><span>Open</span></summary>
      <div className="admin-details-body">
        <div className="admin-card-grid">
          {archived.map(j=>(
            <div className="admin-record-card" key={j.id}>
              <span className="status-pill">{j.status}</span>
              <h3>{j.customers?.full_name||"Customer"}</h3>
              <div className="archive-card-actions">
                <a className="admin-small-button" href={"/admin/jobs/"+j.id}>Open</a>
                <button className="admin-small-button secondary-admin-button" disabled={busyId===j.id} onClick={()=>restore(j.id)}>{busyId===j.id?"Restoring...":"Restore"}</button>
              </div>
            </div>
          ))}
          {!archived.length && <p>No archived jobs.</p>}
        </div>
      </div>
    </details>}
  </main>;
}
