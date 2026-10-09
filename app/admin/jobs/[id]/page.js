"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabase } from "../../../lib/supabaseClient";
import VehicleFields from "../../../components/VehicleFields";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function JobDetailPage() {
  const { id } = useParams();
  const supabase = useMemo(() => getSupabase(), []);
  const [authorized, setAuthorized] = useState(null);
  const [job, setJob] = useState(null);
  const [charges, setCharges] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notes, setNotes] = useState([]);
  const [chargeForm, setChargeForm] = useState({ charge_type:"labor", description:"", quantity:"1", unit_cost:"0", unit_price:"0", part_number:"", supplier:"" });
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [vehicleDraft, setVehicleDraft] = useState({ year:"", make:"", model:"", trim:"", engine:"" });

  useEffect(() => { init(); }, [id]);

  async function init() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { window.location.href = "/admin"; return; }

    const { data: admin } = await supabase.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
    if (!admin) { setAuthorized(false); return; }
    setAuthorized(true);
    await load();
  }

  async function load() {
    const [jobRes, chargeRes, invoiceRes, noteRes] = await Promise.all([
      supabase.from("jobs").select("*,customers(*),vehicles(*)").eq("id", id).single(),
      supabase.from("job_charges").select("*").eq("job_id", id).order("created_at"),
      supabase.from("invoices").select("*").eq("job_id", id).order("created_at", { ascending:false }),
      supabase.from("job_notes").select("*").eq("job_id", id).order("created_at", { ascending:false })
    ]);
    setJob(jobRes.data);
    if (jobRes.data?.vehicles) {
      setVehicleDraft({
        year: jobRes.data.vehicles.year ? String(jobRes.data.vehicles.year) : "",
        make: jobRes.data.vehicles.make || "",
        model: jobRes.data.vehicles.model || "",
        trim: jobRes.data.vehicles.trim || "",
        engine: jobRes.data.vehicles.engine || ""
      });
    }
    setCharges(chargeRes.data ?? []);
    setInvoices(invoiceRes.data ?? []);
    setNotes(noteRes.data ?? []);
  }

  async function updateJob(field, value) {
    await supabase.from("jobs").update({ [field]: value }).eq("id", id);
    await load();
  }

  async function saveVehicle(event) {
    event.preventDefault();
    if (!job.vehicle_id) return;
    setSaving(true);
    const { error } = await supabase.from("vehicles").update({
      year: vehicleDraft.year || null,
      make: vehicleDraft.make || null,
      model: vehicleDraft.model || null,
      trim: vehicleDraft.trim || null,
      engine: vehicleDraft.engine || null
    }).eq("id", job.vehicle_id);
    if (error) alert(error.message);
    await load();
    setSaving(false);
  }

  async function toggleArchive() {
    setSaving(true);
    const next = job.archived_at ? null : new Date().toISOString();
    const { error } = await supabase.from("jobs").update({ archived_at: next }).eq("id", id);
    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }
    if (next) {
      window.location.href = "/admin#archive";
      return;
    }
    await load();
    setSaving(false);
  }

  async function addCharge(event) {
    event.preventDefault();
    setSaving(true);
    const qty = Number(chargeForm.quantity || 0);
    const unitCost = Number(chargeForm.unit_cost || 0);
    const unitPrice = Number(chargeForm.unit_price || 0);
    const { error } = await supabase.from("job_charges").insert({
      job_id:id,
      charge_type:chargeForm.charge_type,
      description:chargeForm.description,
      quantity:qty,
      unit_cost:unitCost,
      unit_price:unitPrice,
      part_number:chargeForm.part_number || null,
      supplier:chargeForm.supplier || null
    });
    if (error) alert(error.message);
    setChargeForm({ charge_type:"labor", description:"", quantity:"1", unit_cost:"0", unit_price:"0", part_number:"", supplier:"" });
    await load();
    setSaving(false);
  }

  async function deleteCharge(chargeId) {
    await supabase.from("job_charges").delete().eq("id", chargeId);
    await load();
  }

  async function addNote(event) {
    event.preventDefault();
    if (!note.trim()) return;
    const { data: sessionData } = await supabase.auth.getSession();
    await supabase.from("job_notes").insert({ job_id:id, note:note.trim(), created_by:sessionData.session?.user?.id || null });
    setNote("");
    await load();
  }

  async function createEstimate() {
    if (!charges.length) {
      alert("Add at least one labor, part, fee, or discount line first.");
      return;
    }
    setSaving(true);
    const { data: estimate, error } = await supabase.from("estimates").insert({
      job_id:id,
      status:"draft",
      valid_until:new Date(Date.now() + 14 * 86400000).toISOString().slice(0,10)
    }).select().single();
    if (error) { alert(error.message); setSaving(false); return; }

    const items = charges.map((charge, index) => ({
      estimate_id:estimate.id,
      item_type:charge.charge_type,
      description:charge.description,
      quantity:Number(charge.quantity),
      unit_price:Number(charge.unit_price),
      line_total:Number(charge.quantity) * Number(charge.unit_price),
      sort_order:index
    }));
    const result = await supabase.from("estimate_items").insert(items);
    if (result.error) { alert(result.error.message); setSaving(false); return; }
    window.location.href = `/admin/estimates/${estimate.id}`;
  }

  async function createInvoice() {
    if (!charges.length) {
      alert("Add at least one labor, part, fee, or discount line first.");
      return;
    }
    setSaving(true);
    const { data: invoice, error } = await supabase.from("invoices").insert({
      job_id:id,
      status:"draft",
      due_date:new Date(Date.now() + 14 * 86400000).toISOString().slice(0,10)
    }).select().single();
    if (error) { alert(error.message); setSaving(false); return; }

    const items = charges.map((charge, index) => ({
      invoice_id:invoice.id,
      item_type:charge.charge_type,
      description:charge.description,
      quantity:Number(charge.quantity),
      unit_price:Number(charge.unit_price),
      line_total:Number(charge.quantity) * Number(charge.unit_price),
      sort_order:index
    }));
    const itemResult = await supabase.from("invoice_items").insert(items);
    if (itemResult.error) { alert(itemResult.error.message); setSaving(false); return; }
    window.location.href = `/admin/invoices/${invoice.id}`;
  }

  if (authorized === false) return <main className="admin-loading">Not authorized.</main>;
  if (!job) return <main className="admin-loading">Loading job...</main>;

  const partsCost = charges.filter(c => c.charge_type === "part").reduce((sum,c) => sum + Number(c.quantity) * Number(c.unit_cost), 0);
  const quotedTotal = charges.reduce((sum,c) => sum + Number(c.quantity) * Number(c.unit_price), 0);
  const grossBeforeExpenses = quotedTotal - partsCost;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <a className="admin-back-link" href="/admin">← Command Center</a>
          <h1>Job: {job.customers?.full_name}</h1>
          <p>{[job.vehicles?.year, job.vehicles?.make, job.vehicles?.model, job.vehicles?.trim].filter(Boolean).join(" ")}{job.vehicles?.engine ? ` • ${job.vehicles.engine}` : ""}</p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-secondary" onClick={toggleArchive} disabled={saving}>{job.archived_at ? "Restore Job" : "Archive Job"}</button>
          <button className="btn btn-secondary" onClick={createEstimate} disabled={saving}>Create Estimate</button>
          <button className="btn btn-primary" onClick={createInvoice} disabled={saving}>Create Invoice</button>
        </div>
      </header>

      <section className="admin-stats">
        <div className="stat-card"><span>Customer</span><strong>{job.customers?.full_name}</strong></div>
        <div className="stat-card"><span>Phone</span><strong>{job.customers?.phone}</strong></div>
        <div className="stat-card"><span>Charges</span><strong>{money.format(quotedTotal)}</strong></div>
        <div className="stat-card"><span>Parts Cost</span><strong>{money.format(partsCost)}</strong></div>
        <div className="stat-card"><span>Gross Before Expenses</span><strong>{money.format(grossBeforeExpenses)}</strong></div>
      </section>

      <section className="admin-panel">
        <h2>Job Details</h2>
        <div className="admin-form-grid">
          <label>Status
            <select value={job.status} onChange={(e) => updateJob("status", e.target.value)}>
              <option value="new">New</option><option value="scheduled">Scheduled</option><option value="diagnosing">Diagnosing</option><option value="waiting_parts">Waiting for Parts</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label>Scheduled For
            <input type="datetime-local" value={job.scheduled_for ? new Date(job.scheduled_for).toISOString().slice(0,16) : ""} onChange={(e) => updateJob("scheduled_for", e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </label>
          <label>Odometer
            <input type="number" value={job.odometer ?? ""} onChange={(e) => updateJob("odometer", e.target.value ? Number(e.target.value) : null)} />
          </label>
          <label>Service Location
            <input value={job.service_location ?? ""} onChange={(e) => updateJob("service_location", e.target.value)} />
          </label>
        </div>
        <label className="admin-full-label">Customer Complaint
          <textarea rows="3" value={job.complaint ?? ""} onChange={(e) => updateJob("complaint", e.target.value)} />
        </label>
        <label className="admin-full-label">Diagnosis
          <textarea rows="3" value={job.diagnosis ?? ""} onChange={(e) => updateJob("diagnosis", e.target.value)} />
        </label>
        <label className="admin-full-label">Work Performed
          <textarea rows="3" value={job.work_performed ?? ""} onChange={(e) => updateJob("work_performed", e.target.value)} />
        </label>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><h2>Vehicle Details</h2><p>Use the dropdowns to keep vehicle information consistent.</p></div>
        </div>
        <form className="admin-form-grid vehicle-admin-grid" onSubmit={saveVehicle}>
          <VehicleFields value={vehicleDraft} onChange={setVehicleDraft} required />
          <div className="admin-form-action"><button className="btn btn-primary" type="submit" disabled={saving}>Save Vehicle</button></div>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Labor, Parts & Charges</h2>
        <form className="admin-form-grid" onSubmit={addCharge}>
          <label>Type
            <select value={chargeForm.charge_type} onChange={(e) => setChargeForm({...chargeForm, charge_type:e.target.value})}>
              <option value="labor">Labor</option><option value="part">Part</option><option value="fee">Fee</option><option value="discount">Discount</option>
            </select>
          </label>
          <label>Description
            <input required value={chargeForm.description} onChange={(e) => setChargeForm({...chargeForm, description:e.target.value})} />
          </label>
          <label>Quantity
            <input type="number" step="0.01" value={chargeForm.quantity} onChange={(e) => setChargeForm({...chargeForm, quantity:e.target.value})} />
          </label>
          <label>Cost Each
            <input type="number" step="0.01" value={chargeForm.unit_cost} onChange={(e) => setChargeForm({...chargeForm, unit_cost:e.target.value})} />
          </label>
          <label>Charge Each
            <input type="number" step="0.01" value={chargeForm.unit_price} onChange={(e) => setChargeForm({...chargeForm, unit_price:e.target.value})} />
          </label>
          <label>Part Number
            <input value={chargeForm.part_number} onChange={(e) => setChargeForm({...chargeForm, part_number:e.target.value})} />
          </label>
          <label>Supplier
            <input value={chargeForm.supplier} onChange={(e) => setChargeForm({...chargeForm, supplier:e.target.value})} />
          </label>
          <div className="admin-form-action"><button className="btn btn-primary" type="submit" disabled={saving}>Add Charge</button></div>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Type</th><th>Description</th><th>Qty</th><th>Cost</th><th>Charge</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {charges.map(c => (
                <tr key={c.id}><td>{c.charge_type}</td><td>{c.description}</td><td>{c.quantity}</td><td>{money.format(Number(c.unit_cost))}</td><td>{money.format(Number(c.unit_price))}</td><td>{money.format(Number(c.quantity)*Number(c.unit_price))}</td><td><button className="danger-link" onClick={() => deleteCharge(c.id)}>Remove</button></td></tr>
              ))}
              {!charges.length && <tr><td colSpan="7">No charges entered yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <h2>Invoices for This Job</h2>
        <div className="admin-card-grid">
          {invoices.map(inv => <a className="admin-record-card" key={inv.id} href={`/admin/invoices/${inv.id}`}><span className="status-pill">{inv.status}</span><h3>Invoice #{inv.invoice_number}</h3><p>{money.format(Number(inv.total || 0))}</p></a>)}
          {!invoices.length && <p>No invoices yet.</p>}
        </div>
      </section>

      <section className="admin-panel">
        <h2>Internal Notes</h2>
        <form className="admin-inline-form" onSubmit={addNote}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note..." />
          <button className="admin-small-button" type="submit">Add Note</button>
        </form>
        <div className="notes-list">
          {notes.map(n => <div className="note-card" key={n.id}><p>{n.note}</p><small>{new Date(n.created_at).toLocaleString()}</small></div>)}
          {!notes.length && <p>No notes yet.</p>}
        </div>
      </section>
    </main>
  );
}
