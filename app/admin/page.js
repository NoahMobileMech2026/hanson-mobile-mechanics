"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";

export default function AdminLoginRouter() {
  const supabase = useMemo(() => getSupabase(), []);
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [message,setMessage] = useState("");
  const [checking,setChecking] = useState(true);

  useEffect(()=>{
    routeExistingSession();
    const { data:listener } = supabase.auth.onAuthStateChange((_event,session)=>{
      if(session?.user) routeUser(session.user.id);
      else setChecking(false);
    });
    return ()=>listener.subscription.unsubscribe();
  },[supabase]);

  async function routeExistingSession(){
    const { data } = await supabase.auth.getSession();
    if(data.session?.user) await routeUser(data.session.user.id);
    else setChecking(false);
  }

  async function routeUser(userId){
    setChecking(true);
    const { data:admin,error } = await supabase.from("admin_users").select("role,active").eq("user_id",userId).maybeSingle();
    if(error || !admin || admin.active === false){
      setMessage("This account is signed in but does not have Hanson Mobile Mechanics admin access.");
      setChecking(false);
      return;
    }
    if(admin.role==="owner"){
      window.location.replace("/admin/owner");
      return;
    }
    if(admin.role==="team_member"){
      window.location.replace("/admin/team");
      return;
    }
    setMessage("This account does not have a recognized admin role.");
    setChecking(false);
  }

  async function signIn(event){
    event.preventDefault();
    setMessage("");
    setChecking(true);
    const { data,error } = await supabase.auth.signInWithPassword({email,password});
    if(error){
      setMessage(error.message);
      setChecking(false);
      return;
    }
    if(data.user) await routeUser(data.user.id);
  }

  async function signOut(){
    await supabase.auth.signOut();
    setChecking(false);
    setMessage("");
  }

  if(checking) return <main className="admin-loading">Opening Hanson Mobile Mechanics admin...</main>;

  return <main className="admin-auth-page">
    <form className="admin-login-card" onSubmit={signIn}>
      <h1>Hanson Mobile Mechanics</h1>
      <h2>Staff Sign In</h2>
      <p>Owners and team members are automatically sent to the correct panel.</p>
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
      <button className="btn btn-primary" type="submit">Sign In</button>
      {message && <p className="form-message error">{message}</p>}
      <button className="danger-link" type="button" onClick={signOut}>Clear signed-in account</button>
      <a className="text-link" href="/">Back to website</a>
    </form>
  </main>;
}
