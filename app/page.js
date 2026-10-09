import ServiceRequestForm from "./components/ServiceRequestForm";

const services = [
  { title: "General Repairs", text: "Common mobile repairs completed at your vehicle location." },
  { title: "Brakes", text: "Brake inspection and repair when the job is suitable for mobile service." },
  { title: "Check Engine & Diagnostics", text: "Warning lights, no-starts, noises, and other vehicle concerns." },
  { title: "Steering & Suspension", text: "Steering and suspension diagnosis and common mobile repairs." },
  { title: "Oil Changes & Leaks", text: "Routine oil service plus inspection of common oil and fluid leaks." },
  { title: "Tire Repair*", text: "Tire repair and spare-tire changes when a usable spare is available." },
  { title: "Minor Electrical", text: "Basic electrical troubleshooting and minor electrical repairs." },
  { title: "Vehicle Unlocks", text: "Vehicle lockout assistance when service is available." },
];

export default function HomePage() {
  return (
    <main>
      <div className="dealer-utility">
        <div className="container dealer-utility-inner">
          <span>Hanson&apos;s Mobile Mechanics • Webster City, Iowa</span>
          <div>
            <span>35 Mile Service Radius</span>
            <a href="tel:+15152273331">Call / Text 515-227-3331</a>
          </div>
        </div>
      </div>

      <header className="dealer-header">
        <div className="container dealer-nav">
          <a className="dealer-brand" href="#top" aria-label="Hanson's Mobile Mechanics">
            <span className="dealer-brand-mark"><img src="/hanson-logo.jpg" alt="" aria-hidden="true" /></span>
            <span>
              <strong>Hanson&apos;s Mobile Mechanics</strong>
              <small>Mobile Auto Repair</small>
            </span>
          </a>

          <nav className="dealer-links" aria-label="Main navigation">
            <a href="#services">Services</a>
            <a href="#service-area">Service Area</a>
            <a href="#why-us">Why Choose Us</a>
            <a href="#request">Request Service</a>
          </nav>

          <a className="dealer-nav-cta" href="#request">Schedule Service</a>
        </div>
      </header>

      <section className="dealer-hero" id="top">
        <div className="dealer-hero-overlay"></div>
        <div className="container dealer-hero-grid">
          <div className="dealer-hero-copy">
            <span className="dealer-kicker">Mobile Service Department</span>
            <h1>Auto repair without the trip to a shop.</h1>
            <p>
              Professional mobile mechanic service in Webster City and within a 35-mile radius. We come to your home, work, or vehicle location.
            </p>
            <div className="dealer-hero-actions">
              <a className="dealer-primary-button" href="#request">Request Service</a>
              <a className="dealer-secondary-button" href="tel:+15152273331">Call 515-227-3331</a>
            </div>
          </div>

          <aside className="dealer-service-panel">
            <img className="panel-brand-logo" src="/hanson-logo.jpg" alt="Hanson's Mobile Mechanics logo" />
            <span className="panel-label">Quick Service Request</span>
            <h2>Need a mechanic?</h2>
            <p>Tell us the vehicle, location, and what it is doing. We&apos;ll review it and contact you about the next step.</p>
            <div className="service-panel-row">
              <span>Mechanic</span>
              <strong>Noah Hanson</strong>
            </div>
            <div className="service-panel-row">
              <span>Phone</span>
              <a href="tel:+15152273331">515-227-3331</a>
            </div>
            <div className="service-panel-row">
              <span>Coverage</span>
              <strong>Webster City + 35 miles</strong>
            </div>
            <a className="panel-button" href="#request">Start Request</a>
          </aside>
        </div>
      </section>

      <section className="dealer-feature-strip">
        <div className="container dealer-feature-grid">
          <div><span>01</span><strong>Mobile Convenience</strong><small>We come to your location</small></div>
          <div><span>02</span><strong>Straightforward Service</strong><small>Simple request and clear next steps</small></div>
          <div><span>03</span><strong>Local Coverage</strong><small>35 miles from Webster City</small></div>
          <div><span>04</span><strong>Easy Contact</strong><small>Call, text, or request online</small></div>
        </div>
      </section>

      <section className="dealer-section" id="services">
        <div className="container">
          <div className="dealer-section-heading">
            <div>
              <span className="dealer-kicker red">Service & Repair</span>
              <h2>Mobile mechanic services</h2>
            </div>
            <p>Common repairs and service handled where your vehicle is located whenever the job is suitable for mobile work.</p>
          </div>

          <div className="dealer-service-grid">
            {services.map((service) => (
              <article className="dealer-service-card" key={service.title}>
                <div className="service-icon-box" aria-hidden="true">+</div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>

          <div className="dealer-note">
            <strong>*Tire service:</strong> Tire repairs only. Hanson&apos;s Mobile Mechanics does not replace tires. A tire can be changed when the customer has a usable spare available.
          </div>
        </div>
      </section>

      <section className="dealer-area" id="service-area">
        <div className="container dealer-area-grid">
          <div className="dealer-area-copy">
            <span className="dealer-kicker red">Mobile Service Area</span>
            <h2>Webster City + 35 miles</h2>
            <p>
              Serving Webster City, Iowa and surrounding communities within approximately a 35-mile radius.
            </p>
            <a className="dealer-inline-link" href="tel:+15152273331">Call to confirm your location →</a>
          </div>

          <div className="dealer-area-stat">
            <span>Service Radius</span>
            <strong>35</strong>
            <small>MILES</small>
          </div>
        </div>
      </section>

      <section className="dealer-section dealer-why" id="why-us">
        <div className="container dealer-why-grid">
          <div className="dealer-why-copy">
            <span className="dealer-kicker red">Why Hanson&apos;s</span>
            <h2>A simpler way to get vehicle service.</h2>
            <p>
              No complicated service desk, no confusing website, and no unnecessary drive to a shop just to explain what is wrong.
            </p>
          </div>
          <div className="dealer-why-list">
            <div><strong>01</strong><span><b>Tell us the problem</b><small>Use plain language. You do not need to diagnose it yourself.</small></span></div>
            <div><strong>02</strong><span><b>We review the request</b><small>We confirm whether the repair is suitable for mobile service.</small></span></div>
            <div><strong>03</strong><span><b>We come to you</b><small>Service is completed at the agreed location when possible.</small></span></div>
          </div>
        </div>
      </section>

      <section className="dealer-request" id="request">
        <div className="container dealer-request-grid">
          <div className="dealer-request-copy">
            <span className="dealer-kicker red">Schedule Service</span>
            <h2>Tell us what your vehicle needs.</h2>
            <p>
              Send the vehicle details, where it is located, and a simple description of the issue. We&apos;ll contact you about the next step.
            </p>
            <div className="dealer-contact-callout">
              <span>Call or text</span>
              <a href="tel:+15152273331">515-227-3331</a>
              <small>Webster City, Iowa • 35 Mile Radius</small>
            </div>
          </div>
          <ServiceRequestForm />
        </div>
      </section>

      <section className="dealer-bottom-cta">
        <div className="container dealer-bottom-cta-inner">
          <div>
            <span>Hanson&apos;s Mobile Mechanics</span>
            <h2>Vehicle trouble? We&apos;ll come to you.</h2>
          </div>
          <a href="tel:+15152273331">Call 515-227-3331</a>
        </div>
      </section>

      <div className="mobile-action-bar" aria-label="Quick actions">
        <a href="tel:+15152273331">Call</a>
        <a href="#request">Request Service</a>
      </div>

      <footer className="dealer-footer">
        <div className="container dealer-footer-inner">
          <div className="footer-brand-group">
            <img className="footer-brand-logo" src="/hanson-logo.jpg" alt="" aria-hidden="true" />
            <div className="footer-brand-copy">
              <strong>Hanson&apos;s Mobile Mechanics</strong>
              <span>Webster City, Iowa</span>
            </div>
          </div>
          <div>
            <span>35 Mile Service Radius</span>
            <a href="tel:+15152273331">515-227-3331</a>
            <a href="/privacy">Privacy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
