import ServiceRequestForm from "./components/ServiceRequestForm";

const services = [
  "General Repairs",
  "General Service",
  "Tire Repair*",
  "Brakes",
  "Check Engine Lights",
  "Suspension",
  "Steering",
  "Oil Changes / Leaks",
  "Vehicle Unlocks",
  "Minor Electrical",
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="container simple-nav">
          <a className="brand-lockup" href="#top">
            <strong>Hanson&apos;s Mobile Mechanics</strong>
            <small>Webster City, Iowa</small>
          </a>
          <a className="header-call" href="tel:+15152273331">515-227-3331</a>
        </div>
      </header>

      <section className="clean-hero" id="top">
        <div className="container clean-hero-grid">
          <div>
            <p className="eyebrow">Mobile mechanic • Webster City, Iowa</p>
            <h1>Reliable vehicle service that comes to you.</h1>
            <p className="hero-lead">
              Mobile repairs and service within 35 miles of Webster City. Clear communication, straightforward service, and no unnecessary trip to a shop.
            </p>
            <div className="actions">
              <a className="btn btn-primary" href="tel:+15152273331">Call 515-227-3331</a>
              <a className="btn btn-secondary" href="#request">Request Service</a>
            </div>
          </div>

          <aside className="hero-contact-card">
            <span className="eyebrow">Hanson&apos;s Mobile Mechanics</span>
            <h2>We come to you.</h2>
            <div className="contact-row">
              <span>Mechanic</span>
              <strong>Noah Hanson</strong>
            </div>
            <div className="contact-row">
              <span>Phone</span>
              <a href="tel:+15152273331">515-227-3331</a>
            </div>
            <div className="contact-row">
              <span>Service area</span>
              <strong>35 miles from Webster City</strong>
            </div>
          </aside>
        </div>
      </section>

      <section className="section services-section" id="services">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Services</span>
            <h2>What we can help with</h2>
            <p>Common mobile repairs and service performed where your vehicle is located.</p>
          </div>

          <div className="service-list-grid">
            {services.map((service) => (
              <div className="service-item" key={service}>
                <span aria-hidden="true">✓</span>
                <strong>{service}</strong>
              </div>
            ))}
          </div>

          <div className="service-note">
            <p><strong>*Tire service:</strong> Tire repairs only. We do not replace tires. We can change a tire when you have a usable spare available.</p>
            <p>Not sure whether your repair can be completed mobile? Call or submit a request and describe the problem.</p>
          </div>
        </div>
      </section>

      <section className="service-area-section">
        <div className="container service-area-card">
          <div>
            <span className="eyebrow">Service Area</span>
            <h2>Webster City + 35 miles</h2>
            <p>Serving Webster City, Iowa and surrounding communities within approximately a 35-mile radius.</p>
          </div>
          <a className="text-call" href="tel:+15152273331">Call to confirm your location →</a>
        </div>
      </section>

      <section className="section request-section" id="request">
        <div className="container request-layout">
          <div className="request-copy">
            <span className="eyebrow">Request Service</span>
            <h2>Tell us what&apos;s going on.</h2>
            <p>
              Send the vehicle details, location, and a simple description of the problem. We&apos;ll review the request and contact you about the next step.
            </p>
            <div className="simple-contact">
              <span>Prefer to call or text?</span>
              <a href="tel:+15152273331">515-227-3331</a>
            </div>
          </div>
          <ServiceRequestForm />
        </div>
      </section>

      <section className="clean-cta">
        <div className="container clean-cta-inner">
          <div>
            <span className="eyebrow light">Hanson&apos;s Mobile Mechanics</span>
            <h2>Need help with your vehicle?</h2>
          </div>
          <a className="btn btn-light" href="tel:+15152273331">Call 515-227-3331</a>
        </div>
      </section>

      <div className="mobile-action-bar" aria-label="Quick actions">
        <a href="tel:+15152273331">Call</a>
        <a href="#request">Request Service</a>
      </div>

      <footer className="footer">
        <div className="container footer-simple">
          <div>
            <strong>Hanson&apos;s Mobile Mechanics</strong>
            <span>Webster City, IA • 35 Mile Service Radius</span>
          </div>
          <div className="footer-right">
            <a href="tel:+15152273331">515-227-3331</a>
            <a href="/privacy">Privacy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
