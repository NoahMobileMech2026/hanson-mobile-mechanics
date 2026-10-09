"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

export default function NotificationSettingsPage(){
  const supabase=useMemo(()=>getSupabase(),[]);
  const [authorized,setAuthorized]=useState(null);
  const [userId,setUserId]=useState("");
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [form,setForm]=useState({
    email_enabled:false,
    sms_enabled:false,
    notification_email:"",
    notification_phone:""
  });

  useEffect(()=>{init();},[]);

  async function init(){
    const { data:sessionData }=await supabase.auth.getSession();
    const user=sessionData.session?.user;
    if(!user){window.location.href="/admin";return;}

    const { data:admin }=await supabase
      .from("admin_users")
      .select("role,active")
      .eq("user_id",user.id)
      .maybeSingle();

    if(!admin || admin.active===false || admin.role!=="owner"){
      setAuthorized(false);
      return;
    }

    setUserId(user.id);
    setAuthorized(true);

    const { data:prefs }=await supabase
      .from("owner_notification_preferences")
      .select("*")
      .eq("user_id",user.id)
      .maybeSingle();

    setForm({
      email_enabled:prefs?.email_enabled ?? false,
      sms_enabled:prefs?.sms_enabled ?? false,
      notification_email:prefs?.notification_email || user.email || "",
      notification_phone:prefs?.notification_phone || ""
    });
  }

  function normalizePhone(value){
    return value.replace(/[^0-9+()\-\s]/g,"");
  }

  async function save(event){
    event.preventDefault();
    setMessage("");

    if(form.email_enabled && !form.notification_email.includes("@")){
      setMessage("Enter a valid email address for email alerts.");
      return;
    }

    const digits=form.notification_phone.replace(/\D/g,"");
    if(form.sms_enabled && digits.length<10){
      setMessage("Enter a valid mobile number for text alerts.");
      return;
    }

    setSaving(true);
    const { error }=await supabase
      .from("owner_notification_preferences")
      .upsert({
        user_id:userId,
        email_enabled:form.email_enabled,
        sms_enabled:form.sms_enabled,
        notification_email:form.notification_email.trim() || null,
        notification_phone:form.notification_phone.trim() || null,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id"});

    if(error) setMessage(error.message);
    else setMessage("Notification preferences saved.");
    setSaving(false);
  }

  if(authorized===null) return <main className="admin-loading">Loading notification settings...</main>;
  if(authorized===false) return <main className="admin-loading">Owner access required.</main>;

  return <main className="admin-page">
    <header className="admin-header">
      <div>
        <a className="admin-back-link" href="/admin/owner">← Owner Panel</a>
        <h1>New Request Alerts</h1>
        <p>Choose how you want to be notified when a new service request comes in.</p>
      </div>
    </header>

    <section className="admin-panel">
      <form className="admin-form-grid" onSubmit={save}>
        <label className="notification-toggle-card">
          <span>
            <strong>Email Alerts</strong>
            <small>Send a new-request notice to your email.</small>
          </span>
          <input
            type="checkbox"
            checked={form.email_enabled}
            onChange={e=>setForm({...form,email_enabled:e.target.checked})}
          />
        </label>

        <label>
          Alert email
          <input
            type="email"
            value={form.notification_email}
            onChange={e=>setForm({...form,notification_email:e.target.value})}
            disabled={!form.email_enabled}
            placeholder="you@example.com"
          />
        </label>

        <label className="notification-toggle-card">
          <span>
            <strong>Text Message Alerts</strong>
            <small>Send a text when a new request arrives.</small>
          </span>
          <input
            type="checkbox"
            checked={form.sms_enabled}
            onChange={e=>setForm({...form,sms_enabled:e.target.checked})}
          />
        </label>

        <label>
          Mobile number
          <input
            type="tel"
            value={form.notification_phone}
            onChange={e=>setForm({...form,notification_phone:normalizePhone(e.target.value)})}
            disabled={!form.sms_enabled}
            placeholder="515-555-1234"
          />
        </label>

        <div className="admin-form-action">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Alert Settings"}
          </button>
        </div>
      </form>

      {message && <p className="form-message">{message}</p>}

      <p><small>These settings are only for your Owner login. Other Owners can choose their own alert method separately.</small></p>
    </section>
  </main>;
}
