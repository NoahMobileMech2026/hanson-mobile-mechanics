"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

const money = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" });

export default function OwnerCommandCenter() {
  const supabase = useMemo(() => getSupabase(), []);
  const [session,setSession] = useState(null);
  const [authorized,setAuthorized] = useState(null);
  const [loading,setLoading] = useState(true);
  const [requests,setRequests] = useState([]);
  const [jobs,setJobs] = useState([]);
  const [invoices,setInvoices] = useState([]);
  const [payments,setPayments] = useState([]);
  const [expenses,setExpenses] = useState([]);
  const [customers,setCustomers] = useState([]);
  const [busyId,setBusyId] = useState(null);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session ?? null));
    const { data:listener } = supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
    return ()=>listener.subscription.unsubscribe();
  },[supabase]);

  useEffect(()=>{
    if(!session?.user){
      setAuthorized(null);
      setLoading(false);
      return;
    }
    checkAuthorization();
  },[session]);

  async function checkAuthorization(){
    setLoading(true);
    const { data,error } = await supabase.from("admin_users").select("role").eq("user_id",session.user.id).maybeSingle();
    if(error || !data || data.role!=="owner"){
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);
    await loadDashboard();
  }

  async function loadDashboard(){
    setLoading(true);
    const [reqRes,jobRes,invRes,payRes,expRes,customerRes] = await Promise.all([
      supabase.from("service_requests").select("*").order("created_at",{ascending:false}).limit(100),
      supabase.from("jobs").select("id,status,scheduled_for,service_location,created_at,archived_at,customers(full_name),vehicles(year,make,model,trim,engine)").order("created_at",{ascending:false}).limit(100),
      supabase.from("invoices").select("id,invoice_number,status,total,amount_paid,balance_due,due_date,created_at,jobs(customers(full_name))").order("created_at",{ascending:false}).limit(100),
      supabase.from("payments").select("id,amount,paid_at").order("paid_at",{ascending:false}).limit(500),
      supabase.from("expenses").select("id,amount,expense_date,category,description,vendor").order("expense_date",{ascending:false}).limit(500),
      supabase.from("customers").select("id,full_name,phone,email,created_at").order("created_at",{ascending:false}).limit(100)
    ]);
    setRequests(reqRes.data ?? []);
    setJobs(jobRes.data ?? []);
    setInvoices(invRes.data ?? []);
    setPayments(payRes.data ?? []);
    setExpenses(expRes.data ?? []);
    setCustomers(customerRes.data ?? []);
    setLoading(false);
  }

  async function signOut(){
    await supabase.auth.signOut();
    window.location.href="/admin";
  }

  async function updateRequestStatus(id,status){
    setBusyId(id);
    const { error } = await supabase.from("service_requests").update({status}).eq("id",id);
    if(error) alert(error.message);
    await loadDashboard();
    setBusyId(null);
  }

  async function convertRequest(request){
    setBusyId(request.id);
    try{
      if(!request.vehicle_year || !request.vehicle_make || !request.vehicle_model || !request.vehicle_trim || !request.vehicle_engine){
        throw new Error("This request is missing complete vehicle information. Open a phone intake and finish Year, Make, Model, Trim, and Engine first.");
      }

      let customer;
      const { data:existing } = await supabase.from("customers").select("*").eq("phone",request.phone).limit(1).maybeSingle();

      if(existing){
        customer=existing;
        const update=await supabase.from("customers").update({
          full_name:request.full_name,
          email:request.email || existing.email || null,
          address:request.service_location || existing.address || null
        }).eq("id",existing.id);
        if(update.error) throw update.error;
      } else {
        const created=await supabase.from("customers").insert({
          full_name:request.full_name,
          phone:request.phone,
          email:request.email || null,
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
    } catch(err){
      alert(err?.message || "Could not create job.");
      setBusyId(null);
    }
  }

  async function restoreJob(id){
    setBusyId(id);
    const { error }=await supabase.from("jobs").update({archived_at:null}).eq("id",id);
    if(error) alert(error.message);
    await loadDashboard();
    setBusyId(null);
  }

  if(!session && !loading){
    window.location.href="/admin";
    return <main className="admin-loading">Opening sign in...</main>;
  }
  if(loading && authorized!==false) return <main className="admin-loading">Loading Owner Command Center...</main>;
  if(authorized===false) return <main className="admin-auth-page"><div className="admin-login-card"><h1>Owner access required</h1><button className="btn btn-primary" onClick={signOut}>Sign Out</button></div></main>;

  const visibleJobs=jobs.filter(j=>!j.archived_at);
  const archivedJobs=jobs.filter(j=>j.archived_at);
  const activeJobs=visibleJobs.filter(j=>!["completed","cancelled"].includes(j.status));
  const actionRequests=requests.filter(r=>["new","contacted","scheduled"].includes(r.status));
  const newRequests=requests.filter(r=>r.status==="new").length;
  const revenue=payments.reduce((s,p)=>s+Number(p.amount||0),0);
  const expenseTotal=expenses.reduce((s,e)=>s+Number(e.amount||0),0);
  const outstanding=invoices.reduce((s,i)=>s+Number(i.balance_due||0),0);

  return <main className="admin-page">
    <header className="admin-header admin-simple-header">
      <div>
        <div className="admin-kicker">Hanson Mobile Mechanics</div>
        <h1>Owner Command Center</h1>
        <p>Choose what you need. Everything else stays out of the way.</p>
      </div>
      <div className="admin-header-actions">
        <a className="btn btn-primary" href="/admin/call-intake">+ New Call</a>
        <button className="btn btn-secondary" onClick={signOut}>Sign Out</button>
      </div>
    </header>

    <section className="admin-quick-grid">
      <a className="admin-quick-card primary" href="/admin/call-intake"><strong>New Phone Call</strong><span>Start a guided intake</span></a>
      <a className="admin-quick-card" href="#requests"><strong>Requests</strong><span>{newRequests} new waiting</span></a>
      <a className="admin-quick-card" href="#jobs"><strong>Active Jobs</strong><span>{activeJobs.length} open</span></a>
      <a className="admin-quick-card" href="/admin/schedule"><strong>Schedule</strong><span>See upcoming jobs</span></a>
      <a className="admin-quick-card" href="/admin/team-management"><strong>Team</strong><span>Create and manage logins</span></a>
      <a className="admin-quick-card" href="#money"><strong>Money & Reports</strong><span>Invoices, expenses, reports</span></a>
    </section>

    <section className="admin-stats admin-simple-stats">
      <div className="stat-card"><span>New Requests</span><strong>{newRequests}</strong></div>
      <div className="stat-card"><span>Active Jobs</span><strong>{activeJobs.length}</strong></div>
      <div className="stat-card"><span>Money Owed</span><strong>{money.format(outstanding)}</strong></div>
    </section>

    <section className="admin-panel" id="requests">
      <div className="admin-panel-heading">
        <div><h2>1. Requests That Need Attention</h2><p>Contact them, schedule them, or turn them into a job.</p></div>
        <a className="admin-small-button" href="/admin/call-intake">New Call Intake</a>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Customer</th><th>Vehicle</th><th>Problem</th><th>Status</th><th>Next Step</th></tr></thead>
          <tbody>
            {actionRequests.map(request=>(
              <tr key={request.id}>
                <td><strong>{request.full_name}</strong><br/><small>{request.phone}</small></td>
                <td>{[request.vehicle_year,request.vehicle_make,request.vehicle_model,request.vehicle_trim].filter(Boolean).join(" ")}{request.vehicle_engine?<><br/><small>{request.vehicle_engine}</small></>:null}</td>
                <td className="admin-wide-cell">{request.issue_description}</td>
                <td>
                  <select value={request.status} disabled={busyId===request.id} onChange={e=>updateRequestStatus(request.id,e.target.value)}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="converted">Converted</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td><button className="admin-small-button" disabled={busyId===request.id} onClick={()=>convertRequest(request)}>{busyId===request.id?"Working...":"Create Job"}</button></td>
              </tr>
            ))}
            {!actionRequests.length && <tr><td colSpan="5">Nothing waiting. You are caught up.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <section className="admin-panel" id="jobs">
      <div className="admin-panel-heading"><div><h2>2. Active Jobs</h2><p>Tap a job to update status, schedule, vehicle, diagnosis, work, or notes.</p></div></div>
      <div className="admin-card-grid">
        {activeJobs.map(job=>(
          <a className="admin-record-card" href={"/admin/jobs/"+job.id} key={job.id}>
            <span className="status-pill">{job.status.replaceAll("_"," ")}</span>
            <h3>{job.customers?.full_name || "Customer"}</h3>
            <p>{[job.vehicles?.year,job.vehicles?.make,job.vehicles?.model,job.vehicles?.trim].filter(Boolean).join(" ")}</p>
            <small>{job.vehicles?.engine || "Engine not entered"}</small><br/>
            <small>{job.service_location || "No service location entered"}</small>
          </a>
        ))}
        {!activeJobs.length && <p>No active jobs.</p>}
      </div>
    </section>

    <details className="admin-panel admin-simple-details" id="money">
      <summary><span><strong>3. Money & Reports</strong><small>Open only when you need invoices, expenses, or reports.</small></span><span>Open</span></summary>
      <div className="admin-details-body">
        <section className="admin-stats admin-inner-stats">
          <div className="stat-card"><span>Payments Received</span><strong>{money.format(revenue)}</strong></div>
          <div className="stat-card"><span>Expenses</span><strong>{money.format(expenseTotal)}</strong></div>
          <div className="stat-card"><span>Net Cash</span><strong>{money.format(revenue-expenseTotal)}</strong></div>
        </section>
        <div className="admin-big-actions">
          <a className="admin-big-action" href="/admin/expenses"><strong>Expenses</strong><span>Add or review business expenses</span></a>
          <a className="admin-big-action" href="/admin/reports"><strong>Reports</strong><span>See totals and job history</span></a>
        </div>
        <h3>Recent Invoices</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Balance</th></tr></thead>
            <tbody>
              {invoices.slice(0,15).map(inv=>(
                <tr key={inv.id} className="clickable-row" onClick={()=>{window.location.href="/admin/invoices/"+inv.id}}>
                  <td>#{inv.invoice_number}</td>
                  <td>{inv.jobs?.customers?.full_name || "Customer"}</td>
                  <td><span className="status-pill">{inv.status}</span></td>
                  <td><strong>{money.format(Number(inv.balance_due||0))}</strong></td>
                </tr>
              ))}
              {!invoices.length && <tr><td colSpan="4">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </details>

    <details className="admin-panel admin-simple-details">
      <summary><span><strong>Customers</strong><small>{customers.length} saved customers</small></span><span>Open</span></summary>
      <div className="admin-details-body">
        <div className="admin-card-grid">
          {customers.map(customer=>(
            <div className="admin-record-card" key={customer.id}>
              <h3>{customer.full_name}</h3>
              <p>{customer.phone}</p>
              <small>{customer.email || "No email"}</small>
            </div>
          ))}
          {!customers.length && <p>No customers yet.</p>}
        </div>
      </div>
    </details>

    <details className="admin-panel admin-simple-details" id="archive">
      <summary><span><strong>Archived Jobs</strong><small>{archivedJobs.length} archived</small></span><span>Open</span></summary>
      <div className="admin-details-body">
        <div className="admin-card-grid">
          {archivedJobs.map(job=>(
            <div className="admin-record-card archived-record-card" key={job.id}>
              <span className="status-pill">{job.status.replaceAll("_"," ")}</span>
              <h3>{job.customers?.full_name || "Customer"}</h3>
              <p>{[job.vehicles?.year,job.vehicles?.make,job.vehicles?.model,job.vehicles?.trim].filter(Boolean).join(" ")}</p>
              <div className="archive-card-actions">
                <a className="admin-small-button" href={"/admin/jobs/"+job.id}>Open Job</a>
                <button className="admin-small-button secondary-admin-button" disabled={busyId===job.id} onClick={()=>restoreJob(job.id)}>{busyId===job.id?"Restoring...":"Restore"}</button>
              </div>
            </div>
          ))}
          {!archivedJobs.length && <p>No archived jobs.</p>}
        </div>
      </div>
    </details>

    <div className="admin-bottom-links">
      <a href="/admin/team">Preview Team Panel</a>
      <a href="/">View Public Website</a>
    </div>
  </main>;
}
