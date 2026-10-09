"use client";
import { useEffect,useMemo,useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";
const money=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
export default function InvoicesPage(){
 const supabase=useMemo(()=>getSupabase(),[]);
 const [authorized,setAuthorized]=useState(null);
 const [rows,setRows]=useState([]);
 useEffect(()=>{init();},[]);
 async function init(){
  const {data:s}=await supabase.auth.getSession();
  const user=s.session?.user;
  if(!user){window.location.href="/admin";return;}
  const {data:a}=await supabase.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();
  if(!a||a.role!=="owner"){setAuthorized(false);return;}
  setAuthorized(true);
  const {data,error}=await supabase.from("invoices").select("id,invoice_number,status,balance_due,jobs(customers(full_name))").order("created_at",{ascending:false});
  if(error) alert(error.message);
  setRows(data||[]);
 }
 if(authorized===null)return <main className="admin-loading">Loading Invoices...</main>;
 if(authorized===false)return <main className="admin-loading">Owner access required.</main>;
 return <main className="admin-page">
  <header className="admin-header"><div><a className="admin-back-link" href="/admin/owner-tools">← Money & Paperwork</a><h1>Invoices</h1></div></header>
  <section className="admin-panel"><div className="admin-card-grid">
   {rows.map(i=><a className="admin-record-card" href={"/admin/invoices/"+i.id} key={i.id}><span className="status-pill">{i.status}</span><h3>Invoice #{i.invoice_number}</h3><p>{i.jobs?.customers?.full_name||"Customer"}</p><strong>{money.format(Number(i.balance_due||0))} due</strong></a>)}
   {!rows.length&&<p>No invoices yet. Create one from a Job.</p>}
  </div></section>
 </main>;
}
