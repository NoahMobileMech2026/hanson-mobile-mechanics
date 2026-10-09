"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

const money = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" });

export default function ExpensesPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [authorized, setAuthorized] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ category:"parts", vendor:"", description:"", amount:"", expense_date:new Date().toISOString().slice(0,10), notes:"" });

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { window.location.href="/admin"; return; }
    const { data: admin } = await supabase.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
    if (!admin || admin.role !== "owner") { setAuthorized(false); return; }
    setAuthorized(true);
    await load();
  }

  async function load() {
    const { data } = await supabase.from("expenses").select("*").order("expense_date", { ascending:false });
    setExpenses(data ?? []);
  }

  async function addExpense(event) {
    event.preventDefault();
    const { error } = await supabase.from("expenses").insert({
      category:form.category,
      vendor:form.vendor || null,
      description:form.description,
      amount:Number(form.amount),
      expense_date:form.expense_date,
      notes:form.notes || null
    });
    if (error) { alert(error.message); return; }
    setForm({ category:"parts", vendor:"", description:"", amount:"", expense_date:new Date().toISOString().slice(0,10), notes:"" });
    await load();
  }

  async function removeExpense(id) {
    await supabase.from("expenses").delete().eq("id",id);
    await load();
  }

  if (authorized === false) return <main className="admin-loading">Not authorized.</main>;
  if (authorized === null) return <main className="admin-loading">Loading expenses...</main>;

  const total = expenses.reduce((sum,e) => sum + Number(e.amount),0);

  return (
    <main className="admin-page">
      <header className="admin-header"><div><a className="admin-back-link" href="/admin">← Command Center</a><h1>Expenses</h1><p>Total recorded: {money.format(total)}</p></div></header>
      <section className="admin-panel">
        <h2>Add Expense</h2>
        <form className="admin-form-grid" onSubmit={addExpense}>
          <label>Category<select value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}><option value="parts">Parts</option><option value="fuel">Fuel</option><option value="tools">Tools</option><option value="supplies">Supplies</option><option value="fees">Fees</option><option value="other">Other</option></select></label>
          <label>Vendor<input value={form.vendor} onChange={(e)=>setForm({...form,vendor:e.target.value})} /></label>
          <label>Description<input required value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} /></label>
          <label>Amount<input type="number" step="0.01" required value={form.amount} onChange={(e)=>setForm({...form,amount:e.target.value})} /></label>
          <label>Date<input type="date" required value={form.expense_date} onChange={(e)=>setForm({...form,expense_date:e.target.value})} /></label>
          <label>Notes<input value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} /></label>
          <div className="admin-form-action"><button className="btn btn-primary" type="submit">Save Expense</button></div>
        </form>
      </section>
      <section className="admin-panel">
        <h2>Expense History</h2>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th>Amount</th><th></th></tr></thead><tbody>{expenses.map(e=><tr key={e.id}><td>{e.expense_date}</td><td>{e.category}</td><td>{e.vendor || "—"}</td><td>{e.description}</td><td>{money.format(Number(e.amount))}</td><td><button className="danger-link" onClick={()=>removeExpense(e.id)}>Delete</button></td></tr>)}{!expenses.length && <tr><td colSpan="6">No expenses yet.</td></tr>}</tbody></table></div>
      </section>
    </main>
  );
}
