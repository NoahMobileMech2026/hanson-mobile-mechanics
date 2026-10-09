import ServiceRequestForm from "./components/ServiceRequestForm";

const services = [
  { title: "General Repairs", text: "Common mobile repairs completed at your vehicle location." },
  { title: "Brakes", text: "Brake inspection and repair when the job is suitable for mobile service." },
  { title: "Diagnostics", text: "Check engine lights, starting problems, noises, and other concerns." },
  { title: "Steering & Suspension", text: "Steering and suspension diagnosis and common repairs." },
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
          <span>Mobile Auto Repair • Webster City, Iowa</span>
          <div>
            <span>35 Mile Service Radius</span>
            <a href="tel:+15152273331">Call / Text 515-227-3331</a>
          </div>
        </div>
      </div>

      <header className="dealer-header">
        <div className="container dealer-nav">
          <a className="dealer-brand" href="#top">
            <span className="dealer-brand-mark">H</span>
            <span>
              <strong>Hanson&apos;s</strong>
              <small>Mobile Mechanics</small>
            </span>
          </a>

          <nav className="dealer-links" aria-label="Main navigation">
            <a href="#services">Services</a>
            <a href="#service-area">Service Area</a>
            <a href="#request">Request Service</a>
          </nav>

          <a className="dealer-nav-cta" href="#request">Schedule Service</a>
        </div>
      </header>

      <section className="dealer-hero" id="top">
        <div className="container dealer-hero-grid">
          <div className="dealer-hero-copy">
            <span className="dealer-kicker">Mobile Service Department</span>
            <h1>Professional auto repair. At your location.</h1>
            <p>
              Hanson&apos;s Mobile Mechanics provides straightforward mobile vehicle repair and service throughout Webster City and within a 35-mile radius.
            </p>
            <div className="dealer-hero-actions">
              <a className="dealer-primary-button" href="#request">Request Service</a>
              <a className="dealer-secondary-button" href="tel:+15152273331">Call 515-227-3331</a>
            </div>
            <div className="dealer-trust-row">
              <div><strong>Webster City</strong><span>Home Base</span></div>
              <div><strong>35 Miles</strong><span>Service Radius</span></div>
              <div><strong>Mobile</strong><span>We Come To You</span></div>
            </div>
          </div>

          <aside className="dealer-service-panel">
            <span className="panel-label">Service Information</span>
            <h2>Need help with your vehicle?</h2>
            <p>Tell us what is happening and where the vehicle is located. We&apos;ll review the request and contact you about the next step.</p>
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
              <strong>35 miles from Webster City</strong>
            </div>
            <a className="panel-button" href="#request">Start a Service Request</a>
          </aside>
        </div>
      </section>

      <section className="dealer-quickbar">
        <div className="container dealer-quickbar-grid">
          <a href="#services"><span>01</span><strong>View Services</strong><small>See common repairs</small></a>
          <a href="#service-area"><span>02</span><strong>Check Service Area</strong><small>Webster City + 35 miles</small></a>
          <a href="#request"><span>03</span><strong>Request Service</strong><small>Send vehicle details</small></a>
        </div>
      </section>

      <section className="dealer-section" id="services">
        <div className="container">
          <div className="dealer-section-heading">
            <div>
              <span className="dealer-kicker red">Service & Repair</span>
              <h2>Mobile mechanic services</h2>
            </div>
            <p>Simple, practical service for common vehicle problems without the trip to a repair shop.</p>
          </div>

          <div className="dealer-service-grid">
            {services.map((service) => (
              <article className="dealer-service-card" key={service.title}>
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
          <div>
            <span className="dealer-kicker red">Mobile Service Area</span>
            <h2>Based in Webster City. Serving customers within 35 miles.</h2>
            <p>
              If you are unsure whether your location is within the service area, call or text before submitting a request.
            </p>
          </div>
          <div className="dealer-area-box">
            <span>Service Radius</span>
            <strong>35 MI</strong>
            <small>from Webster City, Iowa</small>
            <a href="tel:+15152273331">Confirm your location</a>
          </div>
        </div>
      </section>

      <section className="dealer-section dealer-process">
        <div className="container">
          <div className="dealer-section-heading">
            <div>
              <span className="dealer-kicker red">How It Works</span>
              <h2>Simple from request to repair</h2>
            </div>
          </div>
          <div className="dealer-process-grid">
            <div><span>1</span><h3>Request Service</h3><p>Send your vehicle, location, and problem details.</p></div>
            <div><span>2</span><h3>We Review It</h3><p>We determine whether the job is suitable for mobile service.</p></div>
            <div><span>3</span><h3>We Come To You</h3><p>Service is completed at the agreed location when possible.</p></div>
          </div>
        </div>
      </section>

      <section className="dealer-request" id="request">
        <div className="container dealer-request-grid">
          <div className="dealer-request-copy">
            <span className="dealer-kicker red">Service Appointment Request</span>
            <h2>Tell us what your vehicle needs.</h2>
            <p>
              You do not need to diagnose the problem yourself. Give us the information you know and describe what the vehicle is doing in plain language.
            </p>
            <div className="dealer-contact-callout">
              <span>Prefer to call or text?</span>
              <a href="tel:+15152273331">515-227-3331</a>
              <small>Webster City, IA • 35 Mile Radius</small>
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
          <div>
            <strong>Hanson&apos;s Mobile Mechanics</strong>
            <span>Webster City, Iowa</span>
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
