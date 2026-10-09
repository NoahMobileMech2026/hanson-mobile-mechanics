"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

export default function TeamPanelPage() {
  const supabase=useMemo(()=>getSupabase(),[]);
  const [authorized,setAuthorized]=useState(null);
  const [role,setRole]=useState(null);
  const [requests,setRequests]=useState([]);
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
    const [reqRes,jobRes]=await Promise.all([
      supabase.from("service_requests").select("*").order("created_at",{ascending:false}).limit(100),
      supabase.from("jobs").select("id,status,scheduled_for,service_location,created_at,archived_at,customers(full_name,phone),vehicles(year,make,model,trim,engine)").is("archived_at",null).order("created_at",{ascending:false}).limit(100)
    ]);
    setRequests(reqRes.data??[]);
    setJobs(jobRes.data??[]);
  }

  async function updateRequestStatus(id,status){
    setBusyId(id);
    const { error }=await supabase.from("service_requests").update({status}).eq("id",id);
    if(error) alert(error.message);
    await load();
    setBusyId(null);
  }

  async function convertRequest(request){
    setBusyId(request.id);
    try{
      if(!request.vehicle_year || !request.vehicle_make || !request.vehicle_model || !request.vehicle_trim || !request.vehicle_engine){
        throw new Error("Vehicle information is incomplete. Finish Year, Make, Model, Trim, and Engine before creating the job.");
      }

      let customer;
      const { data:existing }=await supabase.from("customers").select("*").eq("phone",request.phone).limit(1).maybeSingle();

      if(existing){
        customer=existing;
        const u=await supabase.from("customers").update({
          full_name:request.full_name,
          email:request.email||existing.email||null,
          address:request.service_location||existing.address||null
        }).eq("id",existing.id);
        if(u.error) throw u.error;
      }else{
        const c=await supabase.from("customers").insert({
          full_name:request.full_name,
          phone:request.phone,
          email:request.email||null,
          address:request.service_location
        }).select().single();
        if(c.error) throw c.error;
        customer=c.data;
      }

      const v=await supabase.from("vehicles").insert({
        customer_id:customer.id,
        year:request.vehicle_year,
        make:request.vehicle_make,
        model:request.vehicle_model,
        trim:request.vehicle_trim,
        engine:request.vehicle_engine
      }).select().single();
      if(v.error) throw v.error;

      const j=await supabase.from("jobs").insert({
        service_request_id:request.id,
        customer_id:customer.id,
        vehicle_id:v.data.id,
        service_location:request.service_location,
        complaint:request.issue_description,
        status:"new"
      }).select().single();
      if(j.error) throw j.error;

      await supabase.from("service_requests").update({status:"converted"}).eq("id",request.id);
      window.location.href="/admin/jobs/"+j.data.id;
    }catch(err){
      alert(err?.message||"Could not create job.");
      setBusyId(null);
    }
  }

  async function signOut(){
    await supabase.auth.signOut();
    window.location.href="/admin";
  }

  if(authorized===null) return <main className="admin-loading">Loading Team Panel...</main>;
  if(authorized===false) return <main className="admin-auth-page"><div className="admin-login-card"><h1>Access not authorized</h1><button className="btn btn-primary" onClick={signOut}>Sign Out</button></div></main>;

  const activeJobs=jobs.filter(j=>!["completed","cancelled"].includes(j.status));
  const actionRequests=requests.filter(r=>["new","contacted","scheduled"].includes(r.status));
  const today=new Date().toDateString();
  const todayJobs=jobs.filter(j=>j.scheduled_for && new Date(j.scheduled_for).toDateString()===today);
  const newRequests=requests.filter(r=>r.status==="new").length;

  return <main className="admin-page">
    <header className="admin-header admin-simple-header">
      <div>
        <div className="admin-kicker">Hanson Mobile Mechanics</div>
        <h1>Team Panel</h1>
        <p>{role==="owner"?"Owner preview of the team workspace.":"Calls, requests, jobs, and schedule. Nothing else."}</p>
      </div>
      <div className="admin-header-actions">
        {role==="owner" && <a className="btn btn-secondary" href="/admin/owner">Owner Panel</a>}
        <a className="btn btn-primary" href="/admin/call-intake">+ New Call</a>
        <button className="btn btn-secondary" onClick={signOut}>Sign Out</button>
      </div>
    </header>

    <section className="admin-quick-grid team-quick-grid">
      <a className="admin-quick-card primary" href="/admin/call-intake"><strong>New Phone Call</strong><span>Start intake</span></a>
      <a className="admin-quick-card" href="#requests"><strong>Requests</strong><span>{newRequests} new</span></a>
      <a className="admin-quick-card" href="#jobs"><strong>Active Jobs</strong><span>{activeJobs.length} open</span></a>
      <a className="admin-quick-card" href="/admin/schedule"><strong>Schedule</strong><span>{todayJobs.length} today</span></a>
    </section>

    <section className="admin-panel" id="requests">
      <div className="admin-panel-heading"><div><h2>1. Requests</h2><p>Work these from top to bottom.</p></div></div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Customer</th><th>Vehicle</th><th>Problem</th><th>Status</th><th>Next Step</th></tr></thead>
          <tbody>
            {actionRequests.map(request=>(
              <tr key={request.id}>
                <td><strong>{request.full_name}</strong><br/><small>{request.phone}</small></td>
                <td>{[request.vehicle_year,request.vehicle_make,request.vehicle_model,request.vehicle_trim].filter(Boolean).join(" ")}{request.vehicle_engine?<><br/><small>{request.vehicle_engine}</small></>:null}</td>
                <td className="admin-wide-cell">{request.issue_description}</td>
                <td><select value={request.status} disabled={busyId===request.id} onChange={e=>updateRequestStatus(request.id,e.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="scheduled">Scheduled</option><option value="converted">Converted</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td>
                <td><button className="admin-small-button" disabled={busyId===request.id} onClick={()=>convertRequest(request)}>{busyId===request.id?"Working...":"Create Job"}</button></td>
              </tr>
            ))}
            {!actionRequests.length && <tr><td colSpan="5">Nothing waiting. You are caught up.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <section className="admin-panel" id="jobs">
      <div className="admin-panel-heading"><div><h2>2. Active Jobs</h2><p>Tap the customer to open the job.</p></div></div>
      <div className="admin-card-grid">
        {activeJobs.map(job=>(
          <a className="admin-record-card" href={"/admin/jobs/"+job.id} key={job.id}>
            <span className="status-pill">{job.status.replaceAll("_"," ")}</span>
            <h3>{job.customers?.full_name||"Customer"}</h3>
            <p>{[job.vehicles?.year,job.vehicles?.make,job.vehicles?.model,job.vehicles?.trim].filter(Boolean).join(" ")}</p>
            <small>{job.vehicles?.engine||"Engine not entered"}</small><br/>
            <small>{job.service_location||"No service location entered"}</small>
          </a>
        ))}
        {!activeJobs.length && <p>No active jobs.</p>}
      </div>
    </section>
  </main>;
}
