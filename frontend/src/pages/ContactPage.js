import React, { useState } from 'react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission success
    // In a real app, you would send this data to a backend
    setFormStatus({
      submitted: true,
      error: false
    });
    console.log("Form submitted:", formData);
  };

  return (
    <div className="py-5" style={{ backgroundColor: '#F5F2EE' }}>
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="display-4 mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>Contact Us</h1>
          <p className="lead mx-auto" style={{ maxWidth: '800px', color: '#504B40' }}>
            Have questions about our services or want to schedule a consultation? We'd love to hear from you.
          </p>
        </div>

        <div className="row g-5">
          {/* Contact Form */}
          <div className="col-lg-6 mb-5 mb-lg-0">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '0' }}>
              <div className="card-body p-4 p-md-5">
                <h2 className="h3 mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>Send Us a Message</h2>
                
                {formStatus.submitted ? (
                  <div className="alert alert-success" role="alert" style={{ borderRadius: '0' }}>
                    <h4 className="alert-heading">Thank You!</h4>
                    <p>Your message has been sent successfully. We'll get back to you as soon as possible.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label" style={{ color: '#504B40' }}>Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ 
                          borderRadius: '0',
                          borderColor: '#D9D0C7',
                          padding: '0.75rem'
                        }}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label" style={{ color: '#504B40' }}>Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ 
                          borderRadius: '0',
                          borderColor: '#D9D0C7',
                          padding: '0.75rem'
                        }}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label" style={{ color: '#504B40' }}>Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        style={{ 
                          borderRadius: '0',
                          borderColor: '#D9D0C7',
                          padding: '0.75rem'
                        }}
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="message" className="form-label" style={{ color: '#504B40' }}>Message</label>
                      <textarea
                        className="form-control"
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        required
                        style={{ 
                          borderRadius: '0',
                          borderColor: '#D9D0C7',
                          padding: '0.75rem'
                        }}
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-lg w-100"
                      style={{ 
                        backgroundColor: '#8B775C',
                        color: '#fff',
                        fontFamily: 'Lato, sans-serif',
                        borderRadius: '0'
                      }}
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="col-lg-6">
            {/* Map */}
            <div className="mb-5">
              <div className="ratio ratio-4x3 shadow border" style={{ borderRadius: '0', overflow: 'hidden' }}>
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.6175894047037!2d-73.98784992379569!3d40.74844627138319!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b30eac9f%3A0xaca8b8855e681b70!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1682185886343!5m2!1sen!2sus" 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps"
                  style={{ border: 0 }}
                ></iframe>
              </div>
            </div>
            
            {/* Info Card */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: '0', backgroundColor: '#2B2A2A', color: '#D9D0C7' }}>
              <div className="card-body p-4 p-md-5">
                <h2 className="h3 mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#D9D0C7' }}>Our Information</h2>
                
                <div className="d-flex mb-4">
                  <div style={{ width: '40px', color: '#8B775C' }}>
                    <i className="bi bi-geo-alt fs-4"></i>
                  </div>
                  <div>
                    <h3 className="h5" style={{ fontFamily: 'Playfair Display, serif', color: '#D9D0C7' }}>Address</h3>
                    <p>123 Main Street<br/>Downtown, NY 10001</p>
                  </div>
                </div>
                
                <div className="d-flex mb-4">
                  <div style={{ width: '40px', color: '#8B775C' }}>
                    <i className="bi bi-clock fs-4"></i>
                  </div>
                  <div>
                    <h3 className="h5" style={{ fontFamily: 'Playfair Display, serif', color: '#D9D0C7' }}>Hours</h3>
                    <p className="mb-1">Monday - Friday: 9:00 AM - 7:00 PM</p>
                    <p className="mb-1">Saturday: 10:00 AM - 6:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
                
                <div className="d-flex mb-4">
                  <div style={{ width: '40px', color: '#8B775C' }}>
                    <i className="bi bi-telephone fs-4"></i>
                  </div>
                  <div>
                    <h3 className="h5" style={{ fontFamily: 'Playfair Display, serif', color: '#D9D0C7' }}>Phone</h3>
                    <p><a href="tel:+1234567890" className="text-decoration-none" style={{ color: '#D9D0C7' }}>(123) 456-7890</a></p>
                  </div>
                </div>
                
                <div className="d-flex mb-4">
                  <div style={{ width: '40px', color: '#8B775C' }}>
                    <i className="bi bi-envelope fs-4"></i>
                  </div>
                  <div>
                    <h3 className="h5" style={{ fontFamily: 'Playfair Display, serif', color: '#D9D0C7' }}>Email</h3>
                    <p><a href="mailto:info@gentlemanscut.com" className="text-decoration-none" style={{ color: '#D9D0C7' }}>info@gentlemanscut.com</a></p>
                  </div>
                </div>
                
                <div className="d-flex">
                  <div style={{ width: '40px', color: '#8B775C' }}>
                    <i className="bi bi-people fs-4"></i>
                  </div>
                  <div>
                    <h3 className="h5" style={{ fontFamily: 'Playfair Display, serif', color: '#D9D0C7' }}>Follow Us</h3>
                    <div className="mt-2">
                      <a href="https://facebook.com" className="text-decoration-none me-3" style={{ color: '#D9D0C7' }} target="_blank" rel="noreferrer">
                        <i className="bi bi-facebook fs-5"></i>
                      </a>
                      <a href="https://instagram.com" className="text-decoration-none me-3" style={{ color: '#D9D0C7' }} target="_blank" rel="noreferrer">
                        <i className="bi bi-instagram fs-5"></i>
                      </a>
                      <a href="https://twitter.com" className="text-decoration-none" style={{ color: '#D9D0C7' }} target="_blank" rel="noreferrer">
                        <i className="bi bi-twitter fs-5"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;