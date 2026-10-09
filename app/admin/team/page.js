"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

export default function TeamPanel() {
  const supabase=useMemo(()=>getSupabase(),[]);
  const [authorized,setAuthorized]=useState(null);
  const [role,setRole]=useState(null);
  const [counts,setCounts]=useState({requests:0,jobs:0,today:0});

  useEffect(()=>{init();},[]);

  async function init(){
    const { data:sessionData }=await supabase.auth.getSession();
    const user=sessionData.session?.user;
    if(!user){window.location.href="/admin";return;}
    const { data:admin }=await supabase.from("admin_users").select("role,active").eq("user_id",user.id).maybeSingle();
    if(!admin || admin.active === false || !["owner","team_member"].includes(admin.role)){setAuthorized(false);return;}
    setRole(admin.role);
    setAuthorized(true);

    const [r,j]=await Promise.all([
      supabase.from("service_requests").select("id,status"),
      supabase.from("jobs").select("id,status,scheduled_for,archived_at")
    ]);

    const requestCount=(r.data||[]).filter(x=>["new","contacted","scheduled"].includes(x.status)).length;
    const jobCount=(j.data||[]).filter(x=>!x.archived_at && !["completed","cancelled"].includes(x.status)).length;
    const todayKey=new Date().toDateString();
    const todayCount=(j.data||[]).filter(x=>x.scheduled_for && new Date(x.scheduled_for).toDateString()===todayKey).length;
    setCounts({requests:requestCount,jobs:jobCount,today:todayCount});
  }

  async function signOut(){
    await supabase.auth.signOut();
    window.location.href="/admin";
  }

  if(authorized===null) return <main className="admin-loading">Opening Team Panel...</main>;
  if(authorized===false) return <main className="admin-auth-page"><div className="admin-login-card"><h1>Access not authorized</h1><button className="btn btn-primary" onClick={signOut}>Sign Out</button></div></main>;

  return <main className="admin-page admin-home-simple">
    <header className="admin-header admin-simple-header">
      <div>
        <div className="admin-kicker">Hanson Mobile Mechanics</div>
        <h1>Team Panel</h1>
        <p>Pick the job you need to do.</p>
      </div>
      <div className="admin-header-actions">
        {role==="owner" && <a className="btn btn-secondary" href="/admin/owner">Owner Panel</a>}
        <button className="btn btn-secondary" onClick={signOut}>Sign Out</button>
      </div>
    </header>

    <section className="admin-quick-grid team-quick-grid">
      <a className="admin-quick-card primary" href="/admin/call-intake">
        
        <strong>New Phone Call</strong>
        <small>Start customer intake</small>
      </a>
      <a className="admin-quick-card" href="/admin/requests">
        
        <strong>Requests</strong>
        <small>{counts.requests} waiting</small>
      </a>
      <a className="admin-quick-card" href="/admin/jobs">
        
        <strong>Jobs</strong>
        <small>{counts.jobs} active</small>
      </a>
      <a className="admin-quick-card" href="/admin/schedule">
        
        <strong>Schedule</strong>
        <small>{counts.today} scheduled today</small>
      </a>
    </section>
  </main>;
}
