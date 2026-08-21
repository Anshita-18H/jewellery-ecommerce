import { useState } from 'react';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import './Contact.css';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    // No backend endpoint for contact form yet — this can be wired to
    // a future /api/contact route. For now it just confirms receipt.
    setSent(true);
  }

  return (
    <div className="contact-page container">
      <div className="contact-header">
        <p className="eyebrow">Get in Touch</p>
        <h1 className="contact-title">Contact Us</h1>
      </div>

      <div className="contact-grid">
        <div className="contact-info">
          <div className="contact-info-row">
            <MapPin size={18} strokeWidth={1.5} />
            <div>
              <p className="contact-info-label">Visit the Store</p>
              <p>Indore, Madhya Pradesh, India</p>
            </div>
          </div>
          <div className="contact-info-row">
            <Phone size={18} strokeWidth={1.5} />
            <div>
              <p className="contact-info-label">Call Us</p>
              <p>+91 00000 00000</p>
            </div>
          </div>
          <div className="contact-info-row">
            <Mail size={18} strokeWidth={1.5} />
            <div>
              <p className="contact-info-label">Email</p>
              <p>hello@aura-jewellery.com</p>
            </div>
          </div>
          
            <a href="https://wa.me/910000000000"
            target="_blank"
            rel="noreferrer"
            className="btn btn-gold contact-whatsapp-btn">
          
            <MessageCircle size={16} /> Chat on WhatsApp
          </a>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          {sent ? (
            <p className="contact-success">Thanks — we've received your message and will get back to you soon.</p>
          ) : (
            <>
              <label>
                Name
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} required />
              </label>
              <label>
                Message
                <textarea name="message" rows={5} value={form.message} onChange={handleChange} required />
              </label>
              <button type="submit" className="btn btn-outline">Send Message</button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}