import React from 'react';
import './Terms.css';

export default function Terms() {
  return (
    <div className="terms-container">
      <div className="terms-header">
        <h1>Terms and Conditions</h1>
        <p className="last-updated">Last updated: January 15, 2025</p>
      </div>

      <div className="terms-content">
        <section className="terms-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Grave Path Memorial Park services, you agree to be bound by these Terms and Conditions. 
            If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Service Description</h2>
          <p>
            Grave Path Memorial Park provides cemetery lot reservation and management services. Our platform allows users to:
          </p>
          <ul>
            <li>Browse available cemetery lots</li>
            <li>Make reservations for burial plots</li>
            <li>Submit payment for services</li>
            <li>Access account management features</li>
            <li>Receive notifications about reservations</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. User Accounts</h2>
          <p>
            To use our services, you must create an account by providing accurate and complete information. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
            <li>Providing accurate and up-to-date information</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>4. Reservation Policy</h2>
          <p>
            Cemetery lot reservations are subject to the following conditions:
          </p>
          <ul>
            <li>Reservations require a 10% deposit of the total lot price</li>
            <li>Full payment must be completed within 30 days of reservation</li>
            <li>Cancellations must be made at least 7 days before scheduled service</li>
            <li>Refunds are processed according to our refund policy</li>
            <li>Lot assignments are final once payment is completed</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>5. Payment Terms</h2>
          <p>
            Payment for services must be made through approved methods including:
          </p>
          <ul>
            <li>Cash payments at our office</li>
            <li>GCash mobile payments</li>
            <li>Bank transfers to designated accounts</li>
            <li>Credit/debit card payments (where available)</li>
          </ul>
          <p>
            All payments are processed securely. We do not store payment information on our servers.
          </p>
        </section>

        <section className="terms-section">
          <h2>6. Privacy Policy</h2>
          <p>
            Your privacy is important to us. We collect and use personal information in accordance with our Privacy Policy, which includes:
          </p>
          <ul>
            <li>Collection of personal information for service delivery</li>
            <li>Protection of sensitive data using industry standards</li>
            <li>Limited sharing with third parties only as necessary</li>
            <li>Your rights to access and modify your personal data</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>7. Prohibited Activities</h2>
          <p>
            Users are prohibited from:
          </p>
          <ul>
            <li>Using the service for any illegal or unauthorized purpose</li>
            <li>Attempting to gain unauthorized access to our systems</li>
            <li>Interfering with or disrupting our services</li>
            <li>Submitting false or misleading information</li>
            <li>Violating any applicable laws or regulations</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>8. Limitation of Liability</h2>
          <p>
            Grave Path Memorial Park shall not be liable for any indirect, incidental, special, consequential, 
            or punitive damages arising from your use of our services. Our total liability shall not exceed 
            the amount paid for the specific service in question.
          </p>
        </section>

        <section className="terms-section">
          <h2>9. Modification of Terms</h2>
          <p>
            We reserve the right to modify these Terms and Conditions at any time. Changes will be effective 
            immediately upon posting on our website. Continued use of our services constitutes acceptance of 
            modified terms.
          </p>
        </section>

        <section className="terms-section">
          <h2>10. Contact Information</h2>
          <p>
            For questions about these Terms and Conditions, please contact us:
          </p>
          <div className="contact-info">
            <p><strong>Grave Path Memorial Park</strong></p>
            <p>Email: info@gravepath.com</p>
            <p>Phone: +63 123 456 7890</p>
            <p>Address: 123 Memorial Drive, City, Province, Philippines</p>
          </div>
        </section>

        <section className="terms-section">
          <h2>11. Governing Law</h2>
          <p>
            These Terms and Conditions are governed by and construed in accordance with the laws of the Philippines. 
            Any disputes arising from these terms shall be resolved in the appropriate courts of the Philippines.
          </p>
        </section>
      </div>

      <div className="terms-footer">
        <p>
          By using Grave Path Memorial Park services, you acknowledge that you have read, understood, 
          and agree to be bound by these Terms and Conditions.
        </p>
        <button 
          className="close-terms-btn" 
          onClick={() => window.close()}
        >
          Close
        </button>
      </div>
    </div>
  );
} 