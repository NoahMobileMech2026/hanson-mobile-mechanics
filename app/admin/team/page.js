"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

export default function TeamPanelPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [authorized,setAuthorized] = useState(null);
  const [role,setRole] = useState(null);
  const [requests,setRequests] = useState([]);
  const [jobs,setJobs] = useState([]);
  const [busyId,setBusyId] = useState(null);

  useEffect(()=>{ init(); },[]);

  async function init(){
    const { data:sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if(!user){ window.location.href="/admin"; return; }

    const { data:admin } = await supabase.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();
    if(!admin || !["owner","team_member"].includes(admin.role)){ setAuthorized(false); return; }
    setRole(admin.role);
    setAuthorized(true);
    await load();
  }

  async function load(){
    const [reqRes,jobRes] = await Promise.all([
      supabase.from("service_requests").select("*").order("created_at",{ascending:false}).limit(50),
      supabase.from("jobs").select("id,status,scheduled_for,service_location,created_at,archived_at,customers(full_name,phone),vehicles(year,make,model,trim,engine)").is("archived_at",null).order("created_at",{ascending:false}).limit(50)
    ]);
    setRequests(reqRes.data ?? []);
    setJobs(jobRes.data ?? []);
  }

  async function updateRequestStatus(id,status){
    setBusyId(id);
    const { error } = await supabase.from("service_requests").update({status}).eq("id",id);
    if(error) alert(error.message);
    await load();
    setBusyId(null);
  }

  async function convertRequest(request){
    setBusyId(request.id);
    try{
      let customer;
      const { data:existing } = await supabase.from("customers").select("*").eq("phone",request.phone).limit(1).maybeSingle();

      if(existing){
        customer=existing;
        await supabase.from("customers").update({
          full_name:request.full_name,
          email:request.email || existing.email || null,
          address:request.service_location || existing.address || null
        }).eq("id",existing.id);
      } else {
        const c = await supabase.from("customers").insert({
          full_name:request.full_name,
          phone:request.phone,
          email:request.email || null,
          address:request.service_location
        }).select().single();
        if(c.error) throw c.error;
        customer=c.data;
      }

      const v = await supabase.from("vehicles").insert({
        customer_id:customer.id,
        year:request.vehicle_year || null,
        make:request.vehicle_make,
        model:request.vehicle_model,
        trim:request.vehicle_trim || null,
        engine:request.vehicle_engine || null
      }).select().single();
      if(v.error) throw v.error;

      const j = await supabase.from("jobs").insert({
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
    } catch(err){
      alert(err?.message || "Could not create job.");
      setBusyId(null);
    }
  }

  async function signOut(){
    await supabase.auth.signOut();
    window.location.href="/admin";
  }

  if(authorized===null) return <main className="admin-loading">Loading team panel...</main>;
  if(authorized===false) return <main className="admin-auth-page"><div className="admin-login-card"><h1>Access not authorized</h1><button className="btn btn-primary" onClick={signOut}>Sign Out</button></div></main>;

  const activeJobs = jobs.filter(j=>!["completed","cancelled"].includes(j.status));
  const today = new Date().toDateString();
  const todayJobs = jobs.filter(j=>j.scheduled_for && new Date(j.scheduled_for).toDateString()===today);
  const newRequests = requests.filter(r=>r.status==="new");

  return <main className="admin-page">
    <header className="admin-header">
      <div>
        <div className="admin-kicker">Hanson Mobile Mechanics</div>
        <h1>Team Member Panel</h1>
        <p>{role === "owner" ? "Owner preview of what team members can access." : "Calls, customers, active jobs, and today’s schedule."}</p>
      </div>
      <div className="admin-header-actions">
        <span className="status-pill">{role === "owner" ? "Owner Preview" : "Team Member"}</span>
        {role === "owner" && <a className="btn btn-secondary" href="/admin/owner">Owner Panel</a>}
        <a className="btn btn-primary" href="/admin/call-intake">New Call Intake</a>
        <a className="btn btn-secondary" href="/admin/schedule">Schedule</a>
        <button className="btn btn-secondary" onClick={signOut}>Sign Out</button>
      </div>
    </header>

    <section className="admin-stats">
      <div className="stat-card"><span>New Requests</span><strong>{newRequests.length}</strong></div>
      <div className="stat-card"><span>Active Jobs</span><strong>{activeJobs.length}</strong></div>
      <div className="stat-card"><span>Scheduled Today</span><strong>{todayJobs.length}</strong></div>
    </section>

    <nav className="admin-section-nav">
      <a href="/admin/call-intake">Call Intake</a>
      <a href="#requests">Requests</a>
      <a href="#jobs">Active Jobs</a>
      <a href="/admin/schedule">Schedule</a>
    </nav>

    <section className="admin-panel" id="requests">
      <div className="admin-panel-heading"><div><h2>Service Requests</h2><p>Handle new website and phone requests.</p></div></div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Customer</th><th>Vehicle</th><th>Problem</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {requests.map(request=>(
              <tr key={request.id}>
                <td><strong>{request.full_name}</strong><br/><small>{request.phone}</small></td>
                <td>{[request.vehicle_year,request.vehicle_make,request.vehicle_model,request.vehicle_trim].filter(Boolean).join(" ")}{request.vehicle_engine ? <><br/><small>{request.vehicle_engine}</small></> : null}</td>
                <td className="admin-wide-cell">{request.issue_description}</td>
                <td><select value={request.status} disabled={busyId===request.id} onChange={e=>updateRequestStatus(request.id,e.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="scheduled">Scheduled</option><option value="converted">Converted</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td>
                <td>{request.status!=="converted" && <button className="admin-small-button" disabled={busyId===request.id} onClick={()=>convertRequest(request)}>{busyId===request.id ? "Working..." : "Create Job"}</button>}</td>
              </tr>
            ))}
            {!requests.length && <tr><td colSpan="5">No service requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <section className="admin-panel" id="jobs">
      <div className="admin-panel-heading"><div><h2>Active Jobs</h2><p>Open a job to update status, schedule, vehicle information, and notes.</p></div></div>
      <div className="admin-card-grid">
        {activeJobs.map(job=>(
          <a className="admin-record-card" href={"/admin/jobs/"+job.id} key={job.id}>
            <span className="status-pill">{job.status.replaceAll("_"," ")}</span>
            <h3>{job.customers?.full_name || "Customer"}</h3>
            <p>{[job.vehicles?.year,job.vehicles?.make,job.vehicles?.model,job.vehicles?.trim].filter(Boolean).join(" ")}{job.vehicles?.engine ? " • "+job.vehicles.engine : ""}</p>
            <small>{job.service_location || "No service location entered"}</small>
          </a>
        ))}
        {!activeJobs.length && <p>No active jobs.</p>}
      </div>
    </section>
  </main>;
}
