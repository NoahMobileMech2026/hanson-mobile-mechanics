export const metadata = {
  title: "Privacy | Hanson Mobile Mechanics",
  description: "How Hanson Mobile Mechanics handles information submitted through the service request form."
};

export default function PrivacyPage() {
  return (
    <main>
      <header className="site-header">
        <div className="container nav">
          <a className="brand" href="/">Hanson Mobile Mechanics</a>
          <nav className="nav-links" aria-label="Primary navigation">
            <a href="/">Home</a>
            <a href="/#request">Request Service</a>
          </nav>
        </div>
      </header>

      <section className="section">
        <div className="container legal-page">
          <h1>Privacy</h1>
          <p>
            Hanson Mobile Mechanics uses the information you submit through this
            website to review your service request and contact you about your vehicle.
          </p>

          <h2>Information we may collect</h2>
          <p>
            This can include your name, phone number, email address, vehicle
            information, service location, preferred contact method, and the details
            you provide about your vehicle problem.
          </p>

          <h2>How we use it</h2>
          <p>
            We use submitted information to evaluate requests, communicate with
            customers, schedule service when appropriate, and keep basic service
            records.
          </p>

          <h2>What not to submit</h2>
          <p>
            Please do not enter payment card numbers, Social Security numbers,
            passwords, or other highly sensitive information in the service request form.
          </p>

          <h2>Questions</h2>
          <p>
            If you have a question about information you submitted, contact Hanson
            Mobile Mechanics directly.
          </p>

          <p><a className="text-link" href="/">Return to the homepage</a></p>
        </div>
      </section>
    </main>
  );
}
