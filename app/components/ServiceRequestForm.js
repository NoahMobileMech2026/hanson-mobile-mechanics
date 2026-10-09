"use client";

import { useState } from "react";
import VehicleFields from "./VehicleFields";

const initialForm = {
  full_name: "",
  phone: "",
  email: "",
  vehicle_year: "",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_trim: "",
  vehicle_engine: "",
  issue_description: "",
  service_location: "",
  preferred_contact: "phone",
  website: ""
};

export default function ServiceRequestForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitRequest(event) {
    event.preventDefault();

    if (form.website) return;

    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/service_requests`,
        {
          method: "POST",
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            vehicle_year: form.vehicle_year.trim() || null,
            vehicle_make: form.vehicle_make.trim(),
            vehicle_model: form.vehicle_model.trim(),
            vehicle_trim: form.vehicle_trim.trim() || null,
            vehicle_engine: form.vehicle_engine.trim() || null,
            issue_description: form.issue_description.trim(),
            service_location: form.service_location.trim(),
            preferred_contact: form.preferred_contact
          })
        }
      );

      if (!response.ok) {
        throw new Error("Request could not be submitted.");
      }

      setStatus("success");
      setMessage("Your service request was sent. Hanson Mobile Mechanics will contact you about the next step.");
      setForm(initialForm);
    } catch {
      setStatus("error");
      setMessage("We could not send your request. Please try again in a moment.");
    }
  }

  return (
    <form className="service-form" onSubmit={submitRequest}>
      <div className="form-grid">
        <label>
          Your name <span aria-hidden="true">*</span>
          <input name="full_name" value={form.full_name} onChange={updateField} required minLength={2} autoComplete="name" />
        </label>

        <label>
          Phone number <span aria-hidden="true">*</span>
          <input name="phone" value={form.phone} onChange={updateField} required minLength={7} autoComplete="tel" inputMode="tel" />
        </label>

        <label>
          Email address
          <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" />
        </label>

        <VehicleFields
          value={{
            year: form.vehicle_year,
            make: form.vehicle_make,
            model: form.vehicle_model,
            trim: form.vehicle_trim,
            engine: form.vehicle_engine
          }}
          onChange={(vehicle) => setForm((current) => ({
            ...current,
            vehicle_year: vehicle.year,
            vehicle_make: vehicle.make,
            vehicle_model: vehicle.model,
            vehicle_trim: vehicle.trim,
            vehicle_engine: vehicle.engine
          }))}
          required
        />
      </div>

      <label>
        Where is the vehicle located? <span aria-hidden="true">*</span>
        <input name="service_location" value={form.service_location} onChange={updateField} required minLength={3} placeholder="City, address, or general location" />
      </label>

      <label>
        What is going on with the vehicle? <span aria-hidden="true">*</span>
        <textarea name="issue_description" value={form.issue_description} onChange={updateField} required minLength={5} rows={5} placeholder="Tell us what the vehicle is doing, any warning lights, noises, or repair you think you need." />
      </label>

      <fieldset>
        <legend>How should we contact you?</legend>
        <div className="contact-options">
          <label><input type="radio" name="preferred_contact" value="phone" checked={form.preferred_contact === "phone"} onChange={updateField} /> Phone call</label>
          <label><input type="radio" name="preferred_contact" value="text" checked={form.preferred_contact === "text"} onChange={updateField} /> Text message</label>
          <label><input type="radio" name="preferred_contact" value="email" checked={form.preferred_contact === "email"} onChange={updateField} /> Email</label>
        </div>
      </fieldset>

      <div className="honeypot" aria-hidden="true">
        <label>Website<input name="website" value={form.website} onChange={updateField} tabIndex={-1} autoComplete="off" /></label>
      </div>

      <button className="btn btn-primary form-submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send Service Request"}
      </button>

      {message && (
        <p className={status === "success" ? "form-message success" : "form-message error"} role="status">
          {message}
        </p>
      )}

      <p className="form-note">Fields marked with * are required.</p>
    </form>
  );
}
