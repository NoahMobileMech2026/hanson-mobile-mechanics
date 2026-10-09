"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

export default function OwnerToolsPage(){
  const supabase=useMemo(()=>getSupabase(),[]);
  const [authorized,setAuthorized]=useState(null);

  useEffect(()=>{init();},[]);

  async function init(){
    const { data:sessionData }=await supabase.auth.getSession();
    const user=sessionData.session?.user;
    if(!user){window.location.href="/admin";return;}
    const { data:admin }=await supabase.from("admin_users").select("role,active").eq("user_id",user.id).maybeSingle();
    setAuthorized(!!admin && admin.active !== false && admin.role==="owner");
  }

  if(authorized===null) return <main className="admin-loading">Loading Owner Tools...</main>;
  if(!authorized) return <main className="admin-loading">Owner access required.</main>;

  return <main className="admin-page admin-home-simple">
    <header className="admin-header">
      <div>
        <a className="admin-back-link" href="/admin/owner">← Owner Panel</a>
        <h1>Money & Paperwork</h1>
        <p>Only open what you need.</p>
      </div>
    </header>

    <section className="admin-quick-grid team-quick-grid">
      <a className="admin-quick-card" href="/admin/invoices"><strong>Invoices</strong><small>Balances and payments</small></a>
      <a className="admin-quick-card" href="/admin/estimates"><strong>Estimates</strong><small>Customer estimates</small></a>
      <a className="admin-quick-card" href="/admin/expenses"><strong>Expenses</strong><small>Add business costs</small></a>
      <a className="admin-quick-card" href="/admin/reports"><strong>Reports</strong><small>Totals and history</small></a>
    </section>
  </main>;
}
