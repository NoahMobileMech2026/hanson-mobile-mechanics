"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

const VAPID_PUBLIC_KEY="BD70M0WukSHrQzXBEb9jUeavLKMFoAFjr3ingvgbgm041hKSWQJsuIirvnaekK_9idYhiskCRc2BasJJr39Z3Jw";

function urlBase64ToUint8Array(base64String){
  const padding="=".repeat((4-(base64String.length%4))%4);
  const base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
  const rawData=window.atob(base64);
  return Uint8Array.from([...rawData].map(char=>char.charCodeAt(0)));
}

export default function NotificationSettingsPage(){
  const supabase=useMemo(()=>getSupabase(),[]);
  const [authorized,setAuthorized]=useState(null);
  const [userId,setUserId]=useState("");
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [pushSupported,setPushSupported]=useState(null);
  const [deviceSubscribed,setDeviceSubscribed]=useState(false);
  const [form,setForm]=useState({
    email_enabled:false,
    push_enabled:false,
    notification_email:""
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
      push_enabled:prefs?.push_enabled ?? false,
      notification_email:prefs?.notification_email || user.email || ""
    });

    const supported="serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setPushSupported(supported);

    if(supported){
      try{
        await navigator.serviceWorker.register("/sw.js");
        const registration=await navigator.serviceWorker.ready;
        const existing=await registration.pushManager.getSubscription();
        setDeviceSubscribed(!!existing);
      }catch{
        setDeviceSubscribed(false);
      }
    }
  }

  async function savePreferences(nextForm=form){
    const { error }=await supabase
      .from("owner_notification_preferences")
      .upsert({
        user_id:userId,
        email_enabled:nextForm.email_enabled,
        push_enabled:nextForm.push_enabled,
        sms_enabled:false,
        notification_email:nextForm.notification_email.trim() || null,
        notification_phone:null,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id"});
    if(error) throw error;
  }

  async function save(event){
    event.preventDefault();
    setMessage("");

    if(form.email_enabled && !form.notification_email.includes("@")){
      setMessage("Enter a valid email address for email alerts.");
      return;
    }

    setSaving(true);
    try{
      await savePreferences();
      setMessage("Alert settings saved.");
    }catch(err){
      setMessage(err?.message || "Could not save alert settings.");
    }finally{
      setSaving(false);
    }
  }

  async function enablePush(){
    setMessage("");
    setSaving(true);
    try{
      if(!pushSupported) throw new Error("Push notifications are not available in this browser yet.");

      const permission=await Notification.requestPermission();
      if(permission!=="granted"){
        throw new Error("Notifications were not allowed. Please allow notifications for this site and try again.");
      }

      const registration=await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let subscription=await registration.pushManager.getSubscription();
      if(!subscription){
        subscription=await registration.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      const json=subscription.toJSON();
      const { error:subError }=await supabase
        .from("owner_push_subscriptions")
        .upsert({
          user_id:userId,
          endpoint:subscription.endpoint,
          p256dh:json.keys?.p256dh,
          auth:json.keys?.auth,
          user_agent:navigator.userAgent,
          updated_at:new Date().toISOString()
        },{onConflict:"user_id,endpoint"});

      if(subError) throw subError;

      const next={...form,push_enabled:true};
      await savePreferences(next);
      setForm(next);
      setDeviceSubscribed(true);
      setMessage("Free push alerts are ON for this Owner account and this device.");
    }catch(err){
      setMessage(err?.message || "Could not enable push alerts.");
    }finally{
      setSaving(false);
    }
  }

  async function disablePush(){
    setMessage("");
    setSaving(true);
    try{
      if(pushSupported){
        const registration=await navigator.serviceWorker.ready;
        const subscription=await registration.pushManager.getSubscription();
        if(subscription){
          await supabase
            .from("owner_push_subscriptions")
            .delete()
            .eq("user_id",userId)
            .eq("endpoint",subscription.endpoint);
          await subscription.unsubscribe().catch(()=>false);
        }
      }

      const next={...form,push_enabled:false};
      await savePreferences(next);
      setForm(next);
      setDeviceSubscribed(false);
      setMessage("Push alerts are OFF for this Owner account.");
    }catch(err){
      setMessage(err?.message || "Could not turn off push alerts.");
    }finally{
      setSaving(false);
    }
  }

  if(authorized===null) return <main className="admin-loading">Loading notification settings...</main>;
  if(authorized===false) return <main className="admin-loading">Owner access required.</main>;

  const pushOn=form.push_enabled && deviceSubscribed;

  return <main className="admin-page">
    <header className="admin-header">
      <div>
        <a className="admin-back-link" href="/admin/owner">← Owner Panel</a>
        <h1>New Request Alerts</h1>
        <p>Choose how you want to know when a new service request comes in.</p>
      </div>
    </header>

    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>Free Phone Push Alerts</h2>
          <p>A notification pops up on this device when a customer submits a new request. No SMS charge.</p>
        </div>
        <span className="status-pill">{pushOn ? "ON" : "OFF"}</span>
      </div>

      {pushSupported===false ? (
        <div className="form-message">
          On iPhone/iPad, add Hanson Mobile Mechanics to your Home Screen first, open it from the new Home Screen icon, then come back here to enable alerts.
        </div>
      ) : (
        <button
          className={pushOn ? "btn btn-secondary" : "btn btn-primary"}
          type="button"
          disabled={saving}
          onClick={pushOn ? disablePush : enablePush}
        >
          {saving ? "Working..." : pushOn ? "Turn Off Push Alerts" : "Enable Free Push Alerts on This Device"}
        </button>
      )}

      <p><small>Each Owner can enable alerts on their own phone, tablet, or computer.</small></p>
    </section>

    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><h2>Email Alerts</h2><p>Keep this option available too.</p></div>
      </div>

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

        <div className="admin-form-action">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Email Setting"}
          </button>
        </div>
      </form>
    </section>

    {message && <p className="form-message">{message}</p>}
  </main>;
}
