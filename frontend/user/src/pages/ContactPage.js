import React, { useState, useEffect } from 'react';
import '../css/ContactPage.css';
import '../css/modal-fix.css';
import { getUserProfile, isAuthenticated } from '../services/authService';
import { submitContactForm } from '../services/contactService';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: false,
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Kiểm tra trạng thái đăng nhập
  const isLoggedIn = isAuthenticated();

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (isLoggedIn) {
        try {
          const userInfo = await getUserProfile();
          console.log("User info fetched:", userInfo); // For debugging
          
          if (userInfo) {
            setFormData(prev => ({
              ...prev,
              name: userInfo.name || '',
              email: userInfo.email || '',
              phone: userInfo.phone || ''
            }));
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }
      }
    };

    fetchUserInfo();
  }, [isLoggedIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await submitContactForm(formData);
      
      setFormStatus({
        submitted: true,
        error: false,
        message: 'Your message has been sent successfully. We will contact you as soon as possible.'
      });
      setShowModal(true);
      
      console.log("Form submitted successfully:", response);
    } catch (error) {
      setFormStatus({
        submitted: false,
        error: true,
        message: error.response?.data?.message || 'An error occurred while sending the message. Please try again later.'
      });
      
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="contact-page-bg">
      {/* Modal for submission status */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div> {/* Backdrop */}          <div className="modal fade show d-block modal-centered" tabIndex="-1" role="dialog" style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              zIndex: 1050
            }}><div className="modal-dialog" style={{ 
              margin: '0 auto', 
              maxWidth: '500px', 
              width: '90%'
            }}><div className="modal-content border-0 shadow-lg" style={{margin: 'auto auto'}}>
                <div className="modal-body" style={{ paddingTop: '30px', position: 'relative' }}>                  <div className="check-icon-circle">
                    <i className="bi bi-check-lg"></i>
                  </div>                  
                  <h2>
                    Thank You For Your Message!
                  </h2>
                  <p className="message-text">
                    Your message has been submitted successfully.
                  </p>
                </div>
                <div className="modal-footer border-0 justify-content-center pb-4">
                  <button 
                    type="button" 
                    className="btn contact-success-btn" 
                    onClick={handleCloseModal}
                  >
                    DONE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Page Title Section */}
      <section className="page-title-section">
        <div className="container py-4">
          <h1 className="display-4 mb-3 page-title">Contact Us</h1>
          <hr />
          <p className="page-subtitle">We're here to assist with your questions and appointment needs</p>
        </div>
      </section>

      <div className="container py-5">
        <div className="row g-5">
          {/* Contact Form */}
          <div className="col-lg-6 mb-5 mb-lg-0">
            <div className="card h-100 contact-card">
              <div className="card-body p-4 p-md-5">
                <h2 className="h3 mb-4 contact-card-title">Send Us a Message</h2>
                
                <form onSubmit={handleSubmit}>
                  {formStatus.error && (
                    <div className="alert alert-danger mb-4" role="alert">
                      {formStatus.message}
                    </div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label form-label-custom">Full Name</label>
                    <input
                      type="text"
                      className="form-control contact-form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label form-label-custom">Email Address</label>
                    <input
                      type="email"
                      className="form-control contact-form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label form-label-custom">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control contact-form-control"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="message" className="form-label form-label-custom">Message</label>
                    <textarea
                      className="form-control contact-form-control"
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      required
                      disabled={isSubmitting}
                    ></textarea>
                  </div>                  <button
                    type="submit"
                    className="btn btn-lg w-100 contact-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="col-lg-6">
            {/* Map */}
            <div className="mb-5">
              <div className="ratio ratio-4x3 shadow border map-container">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.6175894047037!2d-73.98784992379569!3d40.74844627138319!2m3!1f0!2f0!3f0!3m2!1i1024!1i768!4f13.1!3m3!1m2!1s0x89c259a9b30eac9f%3A0xaca8b8855e681b70!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1682185886343!5m2!1sen!2sus" 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps"
                  style={{ border: 0 }}
                ></iframe>
              </div>
            </div>

            {/* Info Card */}
            <div className="card shadow-sm contact-info-card">
              <div className="card-body p-4 p-md-5">
                <h2 className="h3 mb-4 contact-info-card-title">Our Information</h2>
                
                <div className="d-flex mb-4">
                  <div className="contact-info-icon-container">
                    <i className="bi bi-geo-alt fs-4"></i>
                  </div>
                  <div>
                    <h3 className="h5 contact-info-heading">Address</h3>
                    <p>123 Main Street<br/>Downtown, NY 10001</p>
                  </div>
                </div>
                
                <div className="d-flex mb-4">
                  <div className="contact-info-icon-container">
                    <i className="bi bi-clock fs-4"></i>
                  </div>
                  <div>
                    <h3 className="h5 contact-info-heading">Hours</h3>
                    <p className="mb-1">Monday - Friday: 9:00 AM - 7:00 PM</p>
                    <p className="mb-1">Saturday: 10:00 AM - 6:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
                
                <div className="d-flex mb-4">
                  <div className="contact-info-icon-container">
                    <i className="bi bi-telephone fs-4"></i>
                  </div>
                  <div>
                    <h3 className="h5 contact-info-heading">Phone</h3>
                    <p><a href="tel:+1234567890" className="contact-info-link">(123) 456-7890</a></p>
                  </div>
                </div>
                
                <div className="d-flex mb-4">
                  <div className="contact-info-icon-container">
                    <i className="bi bi-envelope fs-4"></i>
                  </div>
                  <div>
                    <h3 className="h5 contact-info-heading">Email</h3>
                    <p><a href="mailto:info@gentlemanscut.com" className="contact-info-link">info@gentlemanscut.com</a></p>
                  </div>
                </div>
                
                <div className="d-flex">
                  <div className="contact-info-icon-container">
                    <i className="bi bi-people fs-4"></i>
                  </div>
                  <div>
                    <h3 className="h5 contact-info-heading">Follow Us</h3>
                    <div className="mt-2">
                      <a href="https://facebook.com" className="social-icon me-3" target="_blank" rel="noreferrer">
                        <i className="bi bi-facebook fs-5"></i>
                      </a>
                      <a href="https://instagram.com" className="social-icon me-3" target="_blank" rel="noreferrer">
                        <i className="bi bi-instagram fs-5"></i>
                      </a>
                      <a href="https://twitter.com" className="social-icon" target="_blank" rel="noreferrer">
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