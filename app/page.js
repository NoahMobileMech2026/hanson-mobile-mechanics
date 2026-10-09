import ServiceRequestForm from "./components/ServiceRequestForm";

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="container nav">
          <a className="brand" href="#top">Hanson Mobile Mechanics</a>
          <nav className="nav-links" aria-label="Primary navigation">
            <a href="#services">Services</a>
            <a href="#how">How It Works</a>
            <a href="#about">About</a>
            <a href="#request">Request Service</a>
          </nav>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Mobile mechanic service</div>
            <h1>Auto repair that comes to you.</h1>
            <p>
              Hanson Mobile Mechanics makes car repair simple. Tell us what is
              going on, request service, and get help without the hassle of
              taking your vehicle to a shop.
            </p>
            <div className="actions">
              <a className="btn btn-primary" href="#request">Request Service</a>
              <a className="btn btn-secondary" href="#services">View Services</a>
            </div>
          </div>

          <aside className="hero-card" aria-label="Why choose Hanson Mobile Mechanics">
            <h2>Simple from start to finish</h2>
            <ul className="checklist">
              <li>Clear service options</li>
              <li>Easy service request process</li>
              <li>Mobile-friendly on any phone</li>
              <li>No confusing menus or clutter</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="section" id="services">
        <div className="container">
          <div className="section-title">
            <h2>Common Services</h2>
            <p>
              A straightforward list of the kinds of work customers most often
              need. We can expand this as your service list grows.
            </p>
          </div>
          <div className="cards">
            <article className="card">
              <h3>Diagnostics</h3>
              <p>Help figuring out warning lights, noises, starting issues, and other vehicle problems.</p>
            </article>
            <article className="card">
              <h3>Basic Repairs</h3>
              <p>Common repairs and replacements that can be completed where your vehicle is located.</p>
            </article>
            <article className="card">
              <h3>Maintenance</h3>
              <p>Routine maintenance and checks to help keep your vehicle running reliably.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section alt" id="how">
        <div className="container">
          <div className="section-title">
            <h2>How It Works</h2>
            <p>Three simple steps. No complicated booking system.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Tell us what you need</h3>
              <p>Send your vehicle information and a short description of the problem.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>We review the request</h3>
              <p>We look over the details and contact you about the service and next steps.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>We come to you</h3>
              <p>Your vehicle can be serviced at the agreed location when the job is suitable for mobile repair.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="container">
          <div className="section-title">
            <h2>About Hanson Mobile Mechanics</h2>
            <p>
              We are building this service around one goal: making vehicle repair
              easier to understand and easier to arrange. The website is designed
              to be just as straightforward as the service itself.
            </p>
          </div>
        </div>
      </section>

      <section className="section request-section" id="request">
        <div className="container request-layout">
          <div className="request-copy">
            <div className="eyebrow">Request service</div>
            <h2>Tell us what your vehicle needs.</h2>
            <p>
              Fill this out with the information you know. You do not need to
              diagnose the vehicle yourself. Describe the problem in plain language.
            </p>
            <ul className="checklist request-checklist">
              <li>No account required</li>
              <li>Works on phones, tablets, and computers</li>
              <li>Your request goes directly into our service-request system</li>
            </ul>
          </div>
          <ServiceRequestForm />
        </div>
      </section>

      <section className="section cta">
        <div className="container">
          <h2>Need help with your vehicle?</h2>
          <p>Submit a service request and we will review the details and contact you about the next step. Sending a request does not automatically confirm an appointment.</p>
          <div className="actions" style={{ justifyContent: "center", marginTop: 24 }}>
            <a className="btn btn-secondary" href="#request">Request Service</a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <strong>Hanson Mobile Mechanics</strong>
          <div>Mobile mechanic service made simple.</div>\n          <div className="footer-links"><a href="/privacy">Privacy</a></div>
        </div>
      </footer>
    </main>
  );
}
