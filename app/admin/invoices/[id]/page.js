"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabase } from "../../../lib/supabaseClient";

const money = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" });

export default function InvoicePage() {
  const { id } = useParams();
  const supabase = useMemo(() => getSupabase(), []);
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [authorized, setAuthorized] = useState(null);
  const [invoiceFlyMessage, setInvoiceFlyMessage] = useState("");
  const [payment, setPayment] = useState({ amount:"", payment_method:"cash", reference:"", notes:"" });

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
    const [invoiceRes, itemRes, paymentRes] = await Promise.all([
      supabase.from("invoices").select("*,jobs(*,customers(*),vehicles(*))").eq("id", id).single(),
      supabase.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order"),
      supabase.from("payments").select("*").eq("invoice_id", id).order("paid_at", { ascending:false })
    ]);
    setInvoice(invoiceRes.data);
    setItems(itemRes.data ?? []);
    setPayments(paymentRes.data ?? []);
  }

  async function openInvoiceFly() {
    const target = window.open("https://app.invoicefly.com", "_blank", "noopener,noreferrer");
    const customer = invoice.jobs?.customers;
    const vehicle = invoice.jobs?.vehicles;
    const vehicleLine = [vehicle?.year, vehicle?.make, vehicle?.model, vehicle?.trim, vehicle?.engine].filter(Boolean).join(" ");
    const lines = [
      `HANSON'S MOBILE MECHANICS - INVOICE #${invoice.invoice_number}`,
      `Customer: ${customer?.full_name || ""}`,
      `Phone: ${customer?.phone || ""}`,
      `Email: ${customer?.email || ""}`,
      `Vehicle: ${vehicleLine}`,
      `Due date: ${invoice.due_date || ""}`,
      "",
      "ITEMS:",
      ...items.map((item) => `${item.description} | Qty ${item.quantity} | ${money.format(Number(item.unit_price))} each | ${money.format(Number(item.line_total))}`),
      "",
      `Subtotal: ${money.format(Number(invoice.subtotal || 0))}`,
      `Tax: ${money.format(Number(invoice.tax_amount || 0))}`,
      `Total: ${money.format(Number(invoice.total || 0))}`,
      `Paid: ${money.format(Number(invoice.amount_paid || 0))}`,
      `Balance: ${money.format(Number(invoice.balance_due || 0))}`,
      invoice.customer_notes ? `Notes: ${invoice.customer_notes}` : ""
    ].filter(Boolean).join("\n");

    try {
      await navigator.clipboard.writeText(lines);
      setInvoiceFlyMessage("Invoice details copied. Paste them into the InvoiceFly invoice you just opened.");
    } catch {
      setInvoiceFlyMessage("InvoiceFly opened. Copy the invoice details from this page if your browser blocked clipboard access.");
    }
    if (!target) setInvoiceFlyMessage("Your browser blocked the InvoiceFly window. Allow pop-ups and try again.");
  }

  async function recordPayment(event) {
    event.preventDefault();
    const amount = Number(payment.amount);
    if (!amount || amount <= 0) return;
    const { error } = await supabase.from("payments").insert({
      invoice_id:id,
      amount,
      payment_method:payment.payment_method,
      reference:payment.reference || null,
      notes:payment.notes || null
    });
    if (error) { alert(error.message); return; }
    setPayment({ amount:"", payment_method:"cash", reference:"", notes:"" });
    await load();
  }

  async function updateInvoice(field, value) {
    await supabase.from("invoices").update({ [field]:value }).eq("id", id);
    await load();
  }

  if (authorized === false) return <main className="admin-loading">Not authorized.</main>;
  if (!invoice) return <main className="admin-loading">Loading invoice...</main>;

  const customer = invoice.jobs?.customers;
  const vehicle = invoice.jobs?.vehicles;

  return (
    <main className="admin-page invoice-admin-page">
      <header className="admin-header no-print">
        <div><a className="admin-back-link" href={`/admin/jobs/${invoice.job_id}`}>← Back to Job</a><h1>Invoice #{invoice.invoice_number}</h1></div>
        <div className="admin-header-actions">
          <button className="btn btn-secondary" onClick={openInvoiceFly}>Copy + Open InvoiceFly</button>
          <button className="btn btn-secondary" onClick={() => window.print()}>Print / Save PDF</button>
        </div>
      </header>

      {invoiceFlyMessage && <div className="invoicefly-message no-print">{invoiceFlyMessage}</div>}
      <section className="invoice-sheet">
        <div className="invoice-brand-row">
          <div><h1>Hanson Mobile Mechanics</h1><p>Mobile mechanic service made simple.</p></div>
          <div className="invoice-number-block"><strong>INVOICE</strong><span>#{invoice.invoice_number}</span></div>
        </div>

        <div className="invoice-meta-grid">
          <div><span className="invoice-label">Bill To</span><strong>{customer?.full_name}</strong><span>{customer?.phone}</span>{customer?.email && <span>{customer.email}</span>}</div>
          <div><span className="invoice-label">Vehicle</span><strong>{[vehicle?.year, vehicle?.make, vehicle?.model, vehicle?.trim].filter(Boolean).join(" ")}{vehicle?.engine && <span>{vehicle.engine}</span>}</strong>{vehicle?.vin && <span>VIN: {vehicle.vin}</span>}</div>
          <div><span className="invoice-label">Status</span><strong>{invoice.status.toUpperCase()}</strong><span>Due: {invoice.due_date || "Not set"}</span></div>
        </div>

        <table className="invoice-table">
          <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}><td><strong>{item.description}</strong><small>{item.item_type}</small></td><td>{item.quantity}</td><td>{money.format(Number(item.unit_price))}</td><td>{money.format(Number(item.line_total))}</td></tr>)}</tbody>
        </table>

        <div className="invoice-totals">
          <div><span>Subtotal</span><strong>{money.format(Number(invoice.subtotal))}</strong></div>
          <div><span>Tax</span><strong>{money.format(Number(invoice.tax_amount))}</strong></div>
          <div className="invoice-grand"><span>Total</span><strong>{money.format(Number(invoice.total))}</strong></div>
          <div><span>Paid</span><strong>{money.format(Number(invoice.amount_paid))}</strong></div>
          <div className="invoice-balance"><span>Balance Due</span><strong>{money.format(Number(invoice.balance_due))}</strong></div>
        </div>

        {invoice.customer_notes && <div className="invoice-note"><strong>Notes</strong><p>{invoice.customer_notes}</p></div>}
      </section>

      <section className="admin-panel no-print">
        <h2>Invoice Controls</h2>
        <div className="admin-form-grid">
          <label>Status
            <select value={invoice.status} onChange={(e) => updateInvoice("status", e.target.value)}>
              <option value="draft">Draft</option><option value="sent">Sent</option><option value="partial">Partial</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="void">Void</option>
            </select>
          </label>
          <label>Due Date
            <input type="date" value={invoice.due_date || ""} onChange={(e) => updateInvoice("due_date", e.target.value || null)} />
          </label>
          <label>Tax Amount
            <input type="number" step="0.01" value={invoice.tax_amount} onChange={(e) => updateInvoice("tax_amount", Number(e.target.value || 0))} />
          </label>
          <label>Customer Notes
            <input value={invoice.customer_notes || ""} onChange={(e) => updateInvoice("customer_notes", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="admin-panel no-print">
        <h2>Record a Payment</h2>
        <form className="admin-form-grid" onSubmit={recordPayment}>
          <label>Amount<input type="number" step="0.01" required value={payment.amount} onChange={(e) => setPayment({...payment, amount:e.target.value})} /></label>
          <label>Payment Method
            <select value={payment.payment_method} onChange={(e) => setPayment({...payment, payment_method:e.target.value})}>
              <option value="cash">Cash</option><option value="check">Check</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option><option value="other">Other</option>
            </select>
          </label>
          <label>Reference<input value={payment.reference} onChange={(e) => setPayment({...payment, reference:e.target.value})} placeholder="Check #, receipt #, etc." /></label>
          <label>Notes<input value={payment.notes} onChange={(e) => setPayment({...payment, notes:e.target.value})} /></label>
          <div className="admin-form-action"><button className="btn btn-primary" type="submit">Record Payment</button></div>
        </form>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead>
            <tbody>{payments.map(p => <tr key={p.id}><td>{new Date(p.paid_at).toLocaleString()}</td><td>{p.payment_method.replaceAll("_"," ")}</td><td>{p.reference || "—"}</td><td>{money.format(Number(p.amount))}</td></tr>)}{!payments.length && <tr><td colSpan="4">No payments recorded yet.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
