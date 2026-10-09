"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

const money = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" });

export default function ReportsPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [authorized,setAuthorized] = useState(null);
  const [payments,setPayments] = useState([]);
  const [expenses,setExpenses] = useState([]);
  const [jobs,setJobs] = useState([]);
  const [charges,setCharges] = useState([]);

  useEffect(()=>{ init(); },[]);

  async function init() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { window.location.href="/admin"; return; }
    const { data: admin } = await supabase.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();
    if (!admin) { setAuthorized(false); return; }
    setAuthorized(true);
    const [p,e,j,c] = await Promise.all([
      supabase.from("payments").select("*").order("paid_at",{ascending:false}),
      supabase.from("expenses").select("*").order("expense_date",{ascending:false}),
      supabase.from("jobs").select("id,status,created_at,completed_at,customers(full_name),vehicles(year,make,model)").order("created_at",{ascending:false}),
      supabase.from("job_charges").select("*")
    ]);
    setPayments(p.data ?? []);
    setExpenses(e.data ?? []);
    setJobs(j.data ?? []);
    setCharges(c.data ?? []);
  }

  if (authorized === false) return <main className="admin-loading">Not authorized.</main>;
  if (authorized === null) return <main className="admin-loading">Loading reports...</main>;

  const revenue = payments.reduce((s,p)=>s+Number(p.amount||0),0);
  const expenseTotal = expenses.reduce((s,e)=>s+Number(e.amount||0),0);
  const partsCost = charges.filter(c=>c.charge_type==="part").reduce((s,c)=>s+(Number(c.quantity)*Number(c.unit_cost)),0);
  const completed = jobs.filter(j=>j.status==="completed").length;
  const active = jobs.filter(j=>!["completed","cancelled"].includes(j.status)).length;

  const byMethod = payments.reduce((acc,p)=>{
    acc[p.payment_method]=(acc[p.payment_method]||0)+Number(p.amount||0);
    return acc;
  },{});

  const byExpenseCategory = expenses.reduce((acc,e)=>{
    acc[e.category]=(acc[e.category]||0)+Number(e.amount||0);
    return acc;
  },{});

  return (
    <main className="admin-page">
      <header className="admin-header"><div><a className="admin-back-link" href="/admin">← Command Center</a><h1>Business Reports</h1></div></header>
      <section className="admin-stats">
        <div className="stat-card"><span>Payments Received</span><strong>{money.format(revenue)}</strong></div>
        <div className="stat-card"><span>Business Expenses</span><strong>{money.format(expenseTotal)}</strong></div>
        <div className="stat-card"><span>Recorded Parts Cost</span><strong>{money.format(partsCost)}</strong></div>
        <div className="stat-card"><span>Net Cash</span><strong>{money.format(revenue-expenseTotal)}</strong></div>
        <div className="stat-card"><span>Active Jobs</span><strong>{active}</strong></div>
        <div className="stat-card"><span>Completed Jobs</span><strong>{completed}</strong></div>
      </section>
      <section className="admin-panel">
        <h2>Payments by Method</h2>
        <div className="report-list">{Object.entries(byMethod).map(([k,v])=><div key={k}><span>{k.replaceAll("_"," ")}</span><strong>{money.format(v)}</strong></div>)}{!Object.keys(byMethod).length && <p>No payments yet.</p>}</div>
      </section>
      <section className="admin-panel">
        <h2>Expenses by Category</h2>
        <div className="report-list">{Object.entries(byExpenseCategory).map(([k,v])=><div key={k}><span>{k}</span><strong>{money.format(v)}</strong></div>)}{!Object.keys(byExpenseCategory).length && <p>No expenses yet.</p>}</div>
      </section>
      <section className="admin-panel">
        <h2>Job History</h2>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Vehicle</th><th>Status</th><th>Created</th><th>Completed</th></tr></thead><tbody>{jobs.map(j=><tr key={j.id}><td>{j.customers?.full_name||"Customer"}</td><td>{[j.vehicles?.year,j.vehicles?.make,j.vehicles?.model].filter(Boolean).join(" ")}</td><td>{j.status.replaceAll("_"," ")}</td><td>{new Date(j.created_at).toLocaleDateString()}</td><td>{j.completed_at?new Date(j.completed_at).toLocaleDateString():"—"}</td></tr>)}</tbody></table></div>
      </section>
    </main>
  );
}
