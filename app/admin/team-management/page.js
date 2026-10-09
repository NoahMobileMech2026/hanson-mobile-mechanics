"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

export default function TeamManagementPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [authorized,setAuthorized] = useState(null);
  const [members,setMembers] = useState([]);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState("");
  const [form,setForm] = useState({ name:"", email:"", password:"" });

  useEffect(()=>{ init(); },[]);

  async function init(){
    const { data:sessionData } = await supabase.auth.getSession();
    const user=sessionData.session?.user;
    if(!user){ window.location.href="/admin"; return; }

    const { data:admin }=await supabase.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();
    if(!admin || admin.role!=="owner"){ setAuthorized(false); setLoading(false); return; }

    setAuthorized(true);
    await loadMembers();
  }

  async function invoke(body){
    const { data,error } = await supabase.functions.invoke("team-admin",{ body });
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  }

  async function loadMembers(){
    setLoading(true);
    try{
      const data=await invoke({action:"list"});
      setMembers(data.members || []);
    }catch(err){
      setMessage(err?.message || "Could not load team accounts.");
    }finally{
      setLoading(false);
    }
  }

  async function createMember(event){
    event.preventDefault();
    setMessage("");
    setSaving(true);
    try{
      await invoke({
        action:"create",
        name:form.name,
        email:form.email,
        password:form.password
      });
      setForm({name:"",email:"",password:""});
      setMessage("Team member login created.");
      await loadMembers();
    }catch(err){
      setMessage(err?.message || "Could not create team member.");
    }finally{
      setSaving(false);
    }
  }

  if(authorized===null || loading) return <main className="admin-loading">Loading team management...</main>;
  if(authorized===false) return <main className="admin-auth-page"><div className="admin-login-card"><h1>Owner access required</h1><a className="btn btn-primary" href="/admin">Back to Sign In</a></div></main>;

  const teamMembers=members.filter(m=>m.role==="team_member");

  return <main className="admin-page">
    <header className="admin-header">
      <div>
        <a className="admin-back-link" href="/admin/owner">← Owner Command Center</a>
        <h1>Team Management</h1>
        <p>Create logins for employees who should use the Team Member Panel.</p>
      </div>
      <div className="admin-header-actions">
        <a className="btn btn-secondary" href="/admin/team">Preview Team Panel</a>
      </div>
    </header>

    {message && <p className="form-message">{message}</p>}

    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>Create Team Member Login</h2>
          <p>The employee will use this email and temporary password at the normal admin sign-in page.</p>
        </div>
      </div>

      <form className="admin-form-grid" onSubmit={createMember}>
        <label>
          Team member name
          <input
            required
            value={form.name}
            onChange={e=>setForm({...form,name:e.target.value})}
            placeholder="Employee name"
          />
        </label>

        <label>
          Login email
          <input
            required
            type="email"
            value={form.email}
            onChange={e=>setForm({...form,email:e.target.value})}
            placeholder="employee@example.com"
          />
        </label>

        <label>
          Temporary password
          <input
            required
            type="password"
            minLength="8"
            value={form.password}
            onChange={e=>setForm({...form,password:e.target.value})}
            placeholder="At least 8 characters"
          />
        </label>

        <div className="admin-form-action">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create Team Login"}
          </button>
        </div>
      </form>

      <p><small>This creates a Team Member account only. It does not give access to owner financial pages.</small></p>
    </section>

    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><h2>Team Accounts</h2><p>Current Team Member logins.</p></div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead>
          <tbody>
            {teamMembers.map(member=>(
              <tr key={member.user_id}>
                <td><strong>{member.name || "Team Member"}</strong></td>
                <td>{member.email || "—"}</td>
                <td><span className="status-pill">Team Member</span></td>
                <td>{member.created_at ? new Date(member.created_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
            {!teamMembers.length && <tr><td colSpan="4">No team member accounts have been created yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <section className="admin-panel">
      <h2>Team Sign-In</h2>
      <p>Team members sign in at <strong>hansonsmobilemechanics.com/admin</strong>. Their Team Member role automatically sends them to the Team Panel.</p>
    </section>
  </main>;
}
