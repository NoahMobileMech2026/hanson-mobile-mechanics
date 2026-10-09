"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function AdminPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [session, setSession] = useState(null);
  const [authorized, setAuthorized] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session?.user) {
      setAuthorized(null);
      setLoading(false);
      return;
    }
    checkAuthorization();
  }, [session]);

  async function checkAuthorization() {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error || !data) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);
    await loadDashboard();
  }

  async function loadDashboard() {
    setLoading(true);
    const [
      reqRes,
      jobRes,
      invRes,
      payRes,
      expRes,
      customerRes
    ] = await Promise.all([
      supabase.from("service_requests").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("jobs").select("id,status,scheduled_for,service_location,created_at,archived_at,customers(full_name),vehicles(year,make,model,trim,engine)").order("created_at", { ascending: false }).limit(50),
      supabase.from("invoices").select("id,invoice_number,status,total,amount_paid,balance_due,due_date,created_at,jobs(customers(full_name))").order("created_at", { ascending: false }).limit(50),
      supabase.from("payments").select("id,amount,paid_at").order("paid_at", { ascending: false }).limit(500),
      supabase.from("expenses").select("id,amount,expense_date,category,description,vendor").order("expense_date", { ascending: false }).limit(500),
      supabase.from("customers").select("id,full_name,phone,email,created_at").order("created_at", { ascending: false }).limit(50)
    ]);

    setRequests(reqRes.data ?? []);
    setJobs(jobRes.data ?? []);
    setInvoices(invRes.data ?? []);
    setPayments(payRes.data ?? []);
    setExpenses(expRes.data ?? []);
    setCustomers(customerRes.data ?? []);
    setLoading(false);
  }

  async function signIn(event) {
    event.preventDefault();
    setLoginMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginMessage(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updateRequestStatus(id, status) {
    setBusyId(id);
    await supabase.from("service_requests").update({ status }).eq("id", id);
    await loadDashboard();
    setBusyId(null);
  }

  async function convertRequest(request) {
    setBusyId(request.id);

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        full_name: request.full_name,
        phone: request.phone,
        email: request.email || null,
        address: request.service_location
      })
      .select()
      .single();

    if (customerError) {
      alert(customerError.message);
      setBusyId(null);
      return;
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .insert({
        customer_id: customer.id,
        year: request.vehicle_year || null,
        make: request.vehicle_make,
        model: request.vehicle_model,
        trim: request.vehicle_trim || null,
        engine: request.vehicle_engine || null
      })
      .select()
      .single();

    if (vehicleError) {
      alert(vehicleError.message);
      setBusyId(null);
      return;
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        service_request_id: request.id,
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        service_location: request.service_location,
        complaint: request.issue_description,
        status: "new"
      })
      .select()
      .single();

    if (jobError) {
      alert(jobError.message);
      setBusyId(null);
      return;
    }

    await supabase.from("service_requests").update({ status: "converted" }).eq("id", request.id);
    window.location.href = `/admin/jobs/${job.id}`;
  }

  async function restoreJob(id) {
    setBusyId(id);
    const { error } = await supabase.from("jobs").update({ archived_at: null }).eq("id", id);
    if (error) alert(error.message);
    await loadDashboard();
    setBusyId(null);
  }

  const visibleJobs = jobs.filter((item) => !item.archived_at);
  const archivedJobs = jobs.filter((item) => item.archived_at);

  const revenue = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const outstanding = invoices.reduce((sum, item) => sum + Number(item.balance_due || 0), 0);
  const activeJobs = visibleJobs.filter((job) => !["completed", "cancelled"].includes(job.status)).length;
  const newRequests = requests.filter((request) => request.status === "new").length;

  if (!session) {
    return (
      <main className="admin-auth-page">
        <form className="admin-login-card" onSubmit={signIn}>
          <h1>Hanson Mobile Mechanics</h1>
          <h2>Admin Sign In</h2>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button className="btn btn-primary" type="submit">Sign In</button>
          {loginMessage && <p className="form-message error">{loginMessage}</p>}
          <a className="text-link" href="/">Back to website</a>
        </form>
      </main>
    );
  }

  if (loading && authorized !== false) {
    return <main className="admin-loading">Loading Hanson Mobile Mechanics admin...</main>;
  }

  if (authorized === false) {
    return (
      <main className="admin-auth-page">
        <div className="admin-login-card">
          <h1>Access not authorized</h1>
          <p>This account is signed in, but it has not been added as a Hanson Mobile Mechanics administrator.</p>
          <button className="btn btn-primary" onClick={signOut}>Sign Out</button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <div className="admin-kicker">Hanson Mobile Mechanics</div>
          <h1>Business Command Center</h1>
        </div>
        <div className="admin-header-actions">
          <a className="btn btn-secondary" href="/">View Website</a>
          <button className="btn btn-primary" onClick={signOut}>Sign Out</button>
        </div>
      </header>

      <section className="admin-stats">
        <div className="stat-card"><span>New Requests</span><strong>{newRequests}</strong></div>
        <div className="stat-card"><span>Active Jobs</span><strong>{activeJobs}</strong></div>
        <div className="stat-card"><span>Outstanding</span><strong>{money.format(outstanding)}</strong></div>
        <div className="stat-card"><span>Payments Received</span><strong>{money.format(revenue)}</strong></div>
        <div className="stat-card"><span>Expenses</span><strong>{money.format(expenseTotal)}</strong></div>
        <div className="stat-card"><span>Net Cash</span><strong>{money.format(revenue - expenseTotal)}</strong></div>
      </section>

      <nav className="admin-section-nav">
        <a href="#requests">Requests</a>
        <a href="#jobs">Jobs</a>
        <a href="#archive">Archive</a>
        <a href="#invoices">Invoices</a>
        <a href="#customers">Customers</a>
        <a href="#expenses">Expenses</a>
        <a href="/admin/schedule">Schedule</a>
        <a href="/admin/reports">Reports</a>
      </nav>

      <section className="admin-panel" id="requests">
        <div className="admin-panel-heading">
          <div><h2>Service Requests</h2><p>New customer requests from the website.</p></div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Customer</th><th>Vehicle</th><th>Problem</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td><strong>{request.full_name}</strong><br /><small>{request.phone}</small></td>
                  <td>{[request.vehicle_year, request.vehicle_make, request.vehicle_model, request.vehicle_trim].filter(Boolean).join(" ")}{request.vehicle_engine ? <><br /><small>{request.vehicle_engine}</small></> : null}</td>
                  <td className="admin-wide-cell">{request.issue_description}</td>
                  <td>
                    <select value={request.status} disabled={busyId === request.id} onChange={(e) => updateRequestStatus(request.id, e.target.value)}>
                      <option value="new">New</option><option value="contacted">Contacted</option><option value="scheduled">Scheduled</option><option value="converted">Converted</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    {request.status !== "converted" && (
                      <button className="admin-small-button" disabled={busyId === request.id} onClick={() => convertRequest(request)}>
                        {busyId === request.id ? "Working..." : "Create Job"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!requests.length && <tr><td colSpan="5">No service requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel" id="jobs">
        <div className="admin-panel-heading"><div><h2>Jobs</h2><p>Track every repair from intake through completion.</p></div></div>
        <div className="admin-card-grid">
          {visibleJobs.map((job) => (
            <a className="admin-record-card" href={`/admin/jobs/${job.id}`} key={job.id}>
              <span className="status-pill">{job.status.replaceAll("_", " ")}</span>
              <h3>{job.customers?.full_name || "Customer"}</h3>
              <p>{[job.vehicles?.year, job.vehicles?.make, job.vehicles?.model, job.vehicles?.trim].filter(Boolean).join(" ")}{job.vehicles?.engine ? ` • ${job.vehicles.engine}` : ""}</p>
              <small>{job.service_location || "No service location entered"}</small>
            </a>
          ))}
          {!visibleJobs.length && <p>No active jobs. Archived jobs stay in the section below.</p>}
        </div>
      </section>

      <details className="admin-panel archive-panel" id="archive">
        <summary>
          <span><strong>Archived Jobs</strong><small>{archivedJobs.length} archived</small></span>
          <span className="archive-summary-action">Show / Hide</span>
        </summary>
        <p className="archive-help">Completed or older jobs can live here without cluttering the active job list.</p>
        <div className="admin-card-grid">
          {archivedJobs.map((job) => (
            <div className="admin-record-card archived-record-card" key={job.id}>
              <span className="status-pill">{job.status.replaceAll("_", " ")}</span>
              <h3>{job.customers?.full_name || "Customer"}</h3>
              <p>{[job.vehicles?.year, job.vehicles?.make, job.vehicles?.model, job.vehicles?.trim].filter(Boolean).join(" ")}{job.vehicles?.engine ? ` • ${job.vehicles.engine}` : ""}</p>
              <small>{job.archived_at ? `Archived ${new Date(job.archived_at).toLocaleDateString()}` : ""}</small>
              <div className="archive-card-actions">
                <a className="admin-small-button" href={`/admin/jobs/${job.id}`}>Open Job</a>
                <button className="admin-small-button secondary-admin-button" disabled={busyId === job.id} onClick={() => restoreJob(job.id)}>
                  {busyId === job.id ? "Restoring..." : "Restore"}
                </button>
              </div>
            </div>
          ))}
          {!archivedJobs.length && <p>No archived jobs yet.</p>}
        </div>
      </details>

      <section className="admin-panel" id="invoices">
        <div className="admin-panel-heading"><div><h2>Invoices</h2><p>Balances and payment status update from your manual payment entries.</p></div></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Total</th><th>Paid</th><th>Balance</th></tr></thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="clickable-row" onClick={() => { window.location.href = `/admin/invoices/${invoice.id}`; }}>
                  <td>#{invoice.invoice_number}</td>
                  <td>{invoice.jobs?.customers?.full_name || "Customer"}</td>
                  <td><span className="status-pill">{invoice.status}</span></td>
                  <td>{money.format(Number(invoice.total || 0))}</td>
                  <td>{money.format(Number(invoice.amount_paid || 0))}</td>
                  <td><strong>{money.format(Number(invoice.balance_due || 0))}</strong></td>
                </tr>
              ))}
              {!invoices.length && <tr><td colSpan="6">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel" id="customers">
        <div className="admin-panel-heading"><div><h2>Customers</h2><p>Customer records created from service requests and jobs.</p></div></div>
        <div className="admin-card-grid">
          {customers.map((customer) => (
            <div className="admin-record-card" key={customer.id}>
              <h3>{customer.full_name}</h3>
              <p>{customer.phone}</p>
              <small>{customer.email || "No email"}</small>
            </div>
          ))}
          {!customers.length && <p>No customers yet.</p>}
        </div>
      </section>

      <section className="admin-panel" id="expenses">
        <div className="admin-panel-heading"><div><h2>Expenses</h2><p>Parts, fuel, tools, supplies, fees, and other business costs.</p></div><a className="admin-small-button" href="/admin/expenses">Manage Expenses</a></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Vendor</th><th>Amount</th></tr></thead>
            <tbody>
              {expenses.slice(0, 20).map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.expense_date}</td><td>{expense.category}</td><td>{expense.description}</td><td>{expense.vendor || "—"}</td><td>{money.format(Number(expense.amount || 0))}</td>
                </tr>
              ))}
              {!expenses.length && <tr><td colSpan="5">No expenses entered yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
