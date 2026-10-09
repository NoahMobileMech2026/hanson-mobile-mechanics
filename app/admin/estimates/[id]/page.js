"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabase } from "../../../lib/supabaseClient";

const money = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" });

export default function EstimatePage() {
  const { id } = useParams();
  const supabase = useMemo(() => getSupabase(), []);
  const [authorized, setAuthorized] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => { init(); }, [id]);

  async function init() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { window.location.href="/admin"; return; }
    const { data: admin } = await supabase.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
    if (!admin) { setAuthorized(false); return; }
    setAuthorized(true);
    await load();
  }

  async function load() {
    const [estimateRes, itemsRes] = await Promise.all([
      supabase.from("estimates").select("*,jobs(*,customers(*),vehicles(*))").eq("id", id).single(),
      supabase.from("estimate_items").select("*").eq("estimate_id", id).order("sort_order")
    ]);
    setEstimate(estimateRes.data);
    setItems(itemsRes.data ?? []);
  }

  async function updateEstimate(field, value) {
    await supabase.from("estimates").update({ [field]: value }).eq("id", id);
    await load();
  }

  async function convertToInvoice() {
    const { data: invoice, error } = await supabase.from("invoices").insert({
      job_id: estimate.job_id,
      status: "draft",
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0,10),
      customer_notes: estimate.customer_notes || null
    }).select().single();
    if (error) { alert(error.message); return; }

    const rows = items.map((item, index) => ({
      invoice_id: invoice.id,
      item_type: item.item_type,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total),
      sort_order: index
    }));
    const result = await supabase.from("invoice_items").insert(rows);
    if (result.error) { alert(result.error.message); return; }

    await supabase.from("estimates").update({ status:"approved", approved_at:new Date().toISOString() }).eq("id", id);
    window.location.href = `/admin/invoices/${invoice.id}`;
  }

  if (authorized === false) return <main className="admin-loading">Not authorized.</main>;
  if (!estimate) return <main className="admin-loading">Loading estimate...</main>;

  const customer = estimate.jobs?.customers;
  const vehicle = estimate.jobs?.vehicles;

  return (
    <main className="admin-page invoice-admin-page">
      <header className="admin-header no-print">
        <div><a className="admin-back-link" href={`/admin/jobs/${estimate.job_id}`}>← Back to Job</a><h1>Estimate #{estimate.estimate_number}</h1></div>
        <div className="admin-header-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>Print / Save PDF</button>
          <button className="btn btn-primary" onClick={convertToInvoice}>Convert to Invoice</button>
        </div>
      </header>

      <section className="invoice-sheet">
        <div className="invoice-brand-row">
          <div><h1>Hanson Mobile Mechanics</h1><p>Mobile mechanic service made simple.</p></div>
          <div className="invoice-number-block"><strong>ESTIMATE</strong><span>#{estimate.estimate_number}</span></div>
        </div>

        <div className="invoice-meta-grid">
          <div><span className="invoice-label">Customer</span><strong>{customer?.full_name}</strong><span>{customer?.phone}</span>{customer?.email && <span>{customer.email}</span>}</div>
          <div><span className="invoice-label">Vehicle</span><strong>{[vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ")}</strong>{vehicle?.vin && <span>VIN: {vehicle.vin}</span>}</div>
          <div><span className="invoice-label">Status</span><strong>{estimate.status.toUpperCase()}</strong><span>Valid until: {estimate.valid_until || "Not set"}</span></div>
        </div>

        <table className="invoice-table">
          <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}><td><strong>{item.description}</strong><small>{item.item_type}</small></td><td>{item.quantity}</td><td>{money.format(Number(item.unit_price))}</td><td>{money.format(Number(item.line_total))}</td></tr>)}</tbody>
        </table>

        <div className="invoice-totals">
          <div><span>Subtotal</span><strong>{money.format(Number(estimate.subtotal))}</strong></div>
          <div><span>Tax</span><strong>{money.format(Number(estimate.tax_amount))}</strong></div>
          <div className="invoice-grand"><span>Estimated Total</span><strong>{money.format(Number(estimate.total))}</strong></div>
        </div>

        {estimate.customer_notes && <div className="invoice-note"><strong>Notes</strong><p>{estimate.customer_notes}</p></div>}
      </section>

      <section className="admin-panel no-print">
        <h2>Estimate Controls</h2>
        <div className="admin-form-grid">
          <label>Status
            <select value={estimate.status} onChange={(e)=>updateEstimate("status",e.target.value)}>
              <option value="draft">Draft</option><option value="sent">Sent</option><option value="approved">Approved</option><option value="declined">Declined</option><option value="expired">Expired</option>
            </select>
          </label>
          <label>Valid Until
            <input type="date" value={estimate.valid_until || ""} onChange={(e)=>updateEstimate("valid_until",e.target.value || null)} />
          </label>
          <label>Tax Amount
            <input type="number" step="0.01" value={estimate.tax_amount} onChange={(e)=>updateEstimate("tax_amount",Number(e.target.value || 0))} />
          </label>
          <label>Customer Notes
            <input value={estimate.customer_notes || ""} onChange={(e)=>updateEstimate("customer_notes",e.target.value)} />
          </label>
        </div>
      </section>
    </main>
  );
}
