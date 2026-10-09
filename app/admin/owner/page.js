"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

export default function OwnerCommandCenter() {
  const supabase=useMemo(()=>getSupabase(),[]);
  const [authorized,setAuthorized]=useState(null);
  const [counts,setCounts]=useState({requests:0,jobs:0,today:0});

  useEffect(()=>{init();},[]);

  async function init(){
    const { data:sessionData }=await supabase.auth.getSession();
    const user=sessionData.session?.user;
    if(!user){window.location.href="/admin";return;}
    const { data:admin }=await supabase.from("admin_users").select("role,active").eq("user_id",user.id).maybeSingle();
    if(!admin || admin.active === false || admin.role!=="owner"){setAuthorized(false);return;}
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

  if(authorized===null) return <main className="admin-loading">Opening Owner Panel...</main>;
  if(authorized===false) return <main className="admin-auth-page"><div className="admin-login-card"><h1>Owner access required</h1><button className="btn btn-primary" onClick={signOut}>Sign Out</button></div></main>;

  return <main className="admin-page admin-home-simple">
    <header className="admin-header admin-simple-header">
      <div>
        <div className="admin-kicker">Hanson Mobile Mechanics</div>
        <h1>Owner Panel</h1>
        <p>What do you need to do?</p>
      </div>
      <button className="btn btn-secondary" onClick={signOut}>Sign Out</button>
    </header>

    <section className="admin-quick-grid">
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
      <a className="admin-quick-card" href="/admin/owner-tools">
        
        <strong>Money & Paperwork</strong>
        <small>Invoices, estimates, expenses, reports</small>
      </a>
      <a className="admin-quick-card" href="/admin/team-management">
        
        <strong>Team Logins</strong>
        <small>Add or review staff access</small>
      </a>
    </section>

    <div className="admin-home-footer-links">
      <a href="/admin/notifications">New Request Alerts</a>\n      <a href="/admin/team">Preview Team Panel</a>
      <a href="/">View Website</a>
    </div>
  </main>;
}
