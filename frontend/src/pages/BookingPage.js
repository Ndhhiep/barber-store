import React, { useState } from 'react';
import '../css/BookingPage.css';

const BookingPage = () => {
  const [bookingData, setBookingData] = useState({
    service: '',
    barber: '',
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const [bookingStatus, setBookingStatus] = useState({
    submitted: false,
    error: false
  });

  const services = [
    "Classic Haircut",
    "Traditional Hot Towel Shave",
    "Beard Trim & Style",
    "The Gentleman's Package",
    "Executive Cut & Style",
    "Father & Son Cut",
    "Grey Blending",
    "Buzz Cut"
  ];

  const barbers = [
    "James Wilson (Master Barber)",
    "Robert Davis (Senior Barber)",
    "Michael Thompson (Beard Specialist)",
    "Any Available Barber"
  ];

  const timeSlots = [
    "9:00 AM", "9:45 AM", "10:30 AM", "11:15 AM", "12:00 PM",
    "12:45 PM", "1:30 PM", "2:15 PM", "3:00 PM", "3:45 PM", 
    "4:30 PM", "5:15 PM", "6:00 PM", "6:45 PM"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate booking submission
    setBookingStatus({
      submitted: true,
      error: false
    });
    console.log("Booking submitted:", bookingData);
  };

  return (
    <div className="py-5 booking-page-bg">
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="display-4 mb-3 booking-title">Book Your Appointment</h1>
          <p className="lead mx-auto booking-lead-text">
            Schedule your visit to The Gentleman's Cut for a premium grooming experience.
          </p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card booking-card">
              <div className="card-body p-4 p-md-5">
                {bookingStatus.submitted ? (
                  <div className="py-5 text-center">
                    <div className="confirmation-icon">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <h2 className="h3 mb-3 confirmation-title">
                      Booking Confirmed!
                    </h2>
                    <p className="mb-4">
                      Thank you for booking with The Gentleman's Cut. We've sent a confirmation email to {bookingData.email} with your appointment details.
                    </p>
                    <p className="mb-5">
                      <strong>Date:</strong> {bookingData.date} at {bookingData.time}<br/>
                      <strong>Service:</strong> {bookingData.service}<br/>
                      {bookingData.barber !== "Any Available Barber" && (
                        <><strong>Barber:</strong> {bookingData.barber}<br/></>
                      )}
                    </p>
                    <div>
                      <button 
                        className="btn btn-outline-secondary px-4 booking-outline-btn"
                        onClick={() => setBookingStatus({ submitted: false, error: false })}
                      >
                        Book Another Appointment
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      {/* Service Details Section */}
                      <div className="col-12 mb-4">
                        <h3 className="h5 mb-3 booking-section-title">Service Details</h3>
                        <div className="card p-3 booking-section-card">
                          <div className="row g-3">
                            <div className="col-md-6 mb-3">
                              <label htmlFor="service" className="form-label">Select Service*</label>
                              <select
                                id="service"
                                name="service"
                                value={bookingData.service}
                                onChange={handleChange}
                                required
                                className="form-select booking-form-control"
                              >
                                <option value="">-- Select a service --</option>
                                {services.map((service, index) => (
                                  <option key={index} value={service}>{service}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label htmlFor="barber" className="form-label">Select Barber</label>
                              <select
                                id="barber"
                                name="barber"
                                value={bookingData.barber}
                                onChange={handleChange}
                                className="form-select booking-form-control"
                              >
                                <option value="">-- Select a barber --</option>
                                {barbers.map((barber, index) => (
                                  <option key={index} value={barber}>{barber}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label htmlFor="date" className="form-label">Preferred Date*</label>
                              <input
                                type="date"
                                id="date"
                                name="date"
                                value={bookingData.date}
                                onChange={handleChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="form-control booking-form-control"
                              />
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label htmlFor="time" className="form-label">Preferred Time*</label>
                              <select
                                id="time"
                                name="time"
                                value={bookingData.time}
                                onChange={handleChange}
                                required
                                className="form-select booking-form-control"
                              >
                                <option value="">-- Select a time --</option>
                                {timeSlots.map((time, index) => (
                                  <option key={index} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Personal Information Section */}
                      <div className="col-12 mb-4">
                        <h3 className="h5 mb-3 booking-section-title">Your Information</h3>
                        <div className="card p-3 booking-section-card">
                          <div className="row g-3">
                            <div className="col-md-6 mb-3">
                              <label htmlFor="name" className="form-label">Full Name*</label>
                              <input
                                type="text"
                                id="name"
                                name="name"
                                value={bookingData.name}
                                onChange={handleChange}
                                required
                                placeholder="Your full name"
                                className="form-control booking-form-control"
                              />
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label htmlFor="phone" className="form-label">Phone Number*</label>
                              <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={bookingData.phone}
                                onChange={handleChange}
                                required
                                placeholder="(123) 456-7890"
                                className="form-control booking-form-control"
                              />
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label htmlFor="email" className="form-label">Email Address*</label>
                              <input
                                type="email"
                                id="email"
                                name="email"
                                value={bookingData.email}
                                onChange={handleChange}
                                required
                                placeholder="your@email.com"
                                className="form-control booking-form-control"
                              />
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label htmlFor="notes" className="form-label">Special Requests</label>
                              <textarea
                                id="notes"
                                name="notes"
                                value={bookingData.notes}
                                onChange={handleChange}
                                placeholder="Any specific requests or requirements"
                                className="form-control booking-form-control"
                                rows="1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-12 mb-3">
                        <div className="form-check">
                          <input 
                            className="form-check-input booking-checkbox" 
                            type="checkbox" 
                            id="policyCheck" 
                            required
                          />
                          <label className="form-check-label" htmlFor="policyCheck">
                            I understand that a 24-hour cancellation notice is required to avoid a cancellation fee.
                          </label>
                        </div>
                      </div>
                      
                      <div className="col-12 mt-4">
                        <button
                          type="submit"
                          className="btn btn-lg w-100 booking-btn"
                        >
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
            
            {!bookingStatus.submitted && (
              <div className="card mt-4 policy-card">
                <div className="card-body p-4">
                  <h3 className="h5 mb-3 policy-title">Booking Policies</h3>
                  <ul className="mb-0 policy-list">
                    <li className="mb-2">Please arrive 5-10 minutes before your appointment time.</li>
                    <li className="mb-2">24-hour notice is required for cancellations to avoid a fee.</li>
                    <li className="mb-2">If you're running late, please call us so we can adjust accordingly.</li>
                    <li className="mb-2">Appointments are confirmed via email and text message.</li>
                    <li>For group bookings (3+ people), please call us directly.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;