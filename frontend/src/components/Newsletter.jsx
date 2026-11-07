import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="shop-newsletter">
      <h2>Subscribe for Updates</h2>
      <p>Get exclusive early sale access, new arrivals &amp; special offers straight to your inbox.</p>
      {submitted ? (
        <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>✅ Thank you for subscribing!</p>
      ) : (
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Subscribe</button>
        </form>
      )}
    </section>
  );
}

