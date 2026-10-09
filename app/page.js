import ServiceRequestForm from "./components/ServiceRequestForm";

const services = [
  "General Repairs",
  "General Service",
  "Tire Repair",
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
          <a className="brand-lockup" href="#top" aria-label="Hanson's Mobile Mechanics home">
            <span className="mini-mark">HMM</span>
            <span>
              <strong>Hanson&apos;s Mobile Mechanics</strong>
              <small>Webster City, Iowa</small>
            </span>
          </a>
          <a className="header-call" href="tel:+15152273331">Call 515-227-3331</a>
        </div>
      </header>

      <section className="mechanic-hero" id="top">
        <div className="container mechanic-hero-grid">
          <div className="hero-copy">
            <div className="service-strip"><span>MOBILE</span><strong>MECHANIC</strong></div>
            <p className="hero-kicker">Webster City, IA • 35 Mile Service Radius</p>
            <h1>WE COME TO YOU.</h1>
            <p className="hero-lead">
              Straightforward mobile auto repair and service at your home, work, or vehicle location.
            </p>
            <div className="actions">
              <a className="btn btn-primary" href="tel:+15152273331">Call 515-227-3331</a>
              <a className="btn btn-outline" href="#request">Request Service</a>
            </div>
            <p className="hero-note">Serving Webster City and locations within approximately 35 miles.</p>
          </div>

          <div className="brand-badge" aria-label="Hanson's Mobile Mechanics">
            <div className="badge-ring">
              <span className="badge-top">HANSON&apos;S</span>
              <strong>HMM</strong>
              <span>MOBILE MECHANICS</span>
              <small>WE COME TO YOU</small>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-contact">
        <div className="container quick-contact-grid">
          <div>
            <span className="contact-label">Mobile Mechanic</span>
            <strong>Noah Hanson</strong>
          </div>
          <div>
            <span className="contact-label">Based In</span>
            <strong>Webster City, IA</strong>
          </div>
          <div>
            <span className="contact-label">Call / Text</span>
            <a href="tel:+15152273331"><strong>515-227-3331</strong></a>
          </div>
          <div>
            <span className="contact-label">Service Area</span>
            <strong>35 Mile Radius</strong>
          </div>
        </div>
      </section>

      <section className="section services-section" id="services">
        <div className="container">
          <div className="section-heading centered">
            <span>WHAT WE DO</span>
            <h2>Mobile Mechanic Services</h2>
            <p>Common repairs and service we can handle where your vehicle is located.</p>
          </div>

          <div className="service-list-grid">
            {services.map((service) => (
              <div className="service-item" key={service}>
                <span className="service-dot" aria-hidden="true"></span>
                <strong>{service}</strong>
              </div>
            ))}
          </div>

          <p className="service-disclaimer">
            Not sure whether your repair can be completed mobile? Call or send a request and describe what the vehicle is doing.
          </p>
        </div>
      </section>

      <section className="radius-section">
        <div className="container radius-card">
          <div className="radius-number">35</div>
          <div>
            <span className="section-eyebrow">WE COME TO YOU</span>
            <h2>35 Mile Radius of Webster City</h2>
            <p>
              Hanson&apos;s Mobile Mechanics serves Webster City, Iowa and surrounding communities within approximately 35 miles.
            </p>
          </div>
          <a className="btn btn-primary" href="tel:+15152273331">Call to Confirm Your Location</a>
        </div>
      </section>

      <section className="section request-section" id="request">
        <div className="container request-layout">
          <div className="request-copy">
            <span className="section-eyebrow">REQUEST SERVICE</span>
            <h2>Tell us what&apos;s going on with your vehicle.</h2>
            <p>
              Give us the vehicle details, where it is located, and a plain-language description of the problem. We&apos;ll review it and contact you about the next step.
            </p>
            <div className="request-contact-box">
              <span>Prefer to call or text?</span>
              <a href="tel:+15152273331">515-227-3331</a>
            </div>
          </div>
          <ServiceRequestForm />
        </div>
      </section>

      <section className="final-callout">
        <div className="container">
          <span>HANSON&apos;S MOBILE MECHANICS</span>
          <h2>Need a mechanic without the trip to a shop?</h2>
          <p>Call Noah Hanson in Webster City.</p>
          <a className="btn btn-light" href="tel:+15152273331">515-227-3331</a>
        </div>
      </section>

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
