"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

export default function SchedulePage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [authorized,setAuthorized] = useState(null);
  const [role,setRole] = useState(null);
  const [jobs,setJobs] = useState([]);

  useEffect(()=>{ init(); },[]);

  async function init() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user=sessionData.session?.user;
    if(!user){ window.location.href="/admin"; return; }
    const { data: admin }=await supabase.from("admin_users").select("role,active").eq("user_id",user.id).maybeSingle();
    if(!admin || admin.active === false || !["owner","team_member"].includes(admin.role)){ setAuthorized(false); return; }
    setRole(admin.role);
    setAuthorized(true);
    const { data }=await supabase.from("jobs").select("id,status,scheduled_for,service_location,customers(full_name,phone),vehicles(year,make,model,trim,engine)").is("archived_at", null).not("scheduled_for","is",null).order("scheduled_for");
    setJobs(data??[]);
  }

  if(authorized===false) return <main className="admin-loading">Not authorized.</main>;
  if(authorized===null) return <main className="admin-loading">Loading schedule...</main>;

  return (
    <main className="admin-page">
      <header className="admin-header"><div><a className="admin-back-link" href={role==="owner"?"/admin/owner":"/admin/team"}>← Command Center</a><h1>Schedule</h1><p>Upcoming mobile service appointments.</p></div></header>
      <section className="admin-panel">
        <div className="schedule-list">
          {jobs.map(job=>(
            <a className="schedule-card" href={`/admin/jobs/${job.id}`} key={job.id}>
              <div className="schedule-date"><strong>{new Date(job.scheduled_for).toLocaleDateString()}</strong><span>{new Date(job.scheduled_for).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</span></div>
              <div><span className="status-pill">{job.status.replaceAll("_"," ")}</span><h3>{job.customers?.full_name}</h3><p>{[job.vehicles?.year,job.vehicles?.make,job.vehicles?.model,job.vehicles?.trim].filter(Boolean).join(" ")}{job.vehicles?.engine ? ` • ${job.vehicles.engine}` : ""}</p><small>{job.service_location}</small></div>
            </a>
          ))}
          {!jobs.length && <p>No scheduled jobs yet.</p>}
        </div>
      </section>
    </main>
  );
}
