# Email Confirmation Feature

This document describes the implementation of the email confirmation feature for the barbershop booking system.

## Overview

When a user makes a booking, they receive an email with a confirmation link. The booking remains in a "pending" state until the user clicks the confirmation link. Once confirmed, the booking status changes to "confirmed" in the database.

## Components

1. **Token Model**: Stores confirmation tokens with an expiration date
2. **Email Utility**: Handles sending confirmation emails
3. **API Endpoints**: For booking creation and token validation
4. **Frontend UI**: Shows appropriate messaging and handles token verification

## Setup Instructions

### Environment Variables

Make sure your `.env` file includes the following email configuration:

```
# Email Configuration
EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email_username
EMAIL_PASSWORD=your_email_password
EMAIL_FROM="The Gentleman's Cut <noreply@example.com>"

# Frontend URL for email confirmation links
FRONTEND_URL=http://localhost:3000
```

For development, the system uses Ethereal Email (fake SMTP service) for testing.

### Testing Email Functionality

You can test the email sending functionality by running:

```
node tests/test-email.js
```

This will:
1. Create a test email account (if in development mode)
2. Send a test booking confirmation email
3. Log the message ID and preview URL

### API Endpoints

- `POST /api/bookings` - Create a new booking with `requireEmailConfirmation: true`
- `POST /api/bookings/confirm` - Confirm a booking with a valid token

### Booking Status Flow

1. User submits booking form → Status: "pending"
2. System sends confirmation email with token
3. User clicks confirmation link → Status: "confirmed"
4. Confirmation token is deleted from database

## Token Security

- Tokens are randomly generated 64-character hexadecimal strings
- Tokens expire after 24 hours
- Tokens are single-use and deleted after successful confirmation
- MongoDB's TTL index automatically cleans up expired tokens

## Integration Notes

When creating a booking that requires email confirmation, set the `requireEmailConfirmation` flag to `true` in the request. The API will:

1. Create the booking with "pending" status
2. Generate a confirmation token
3. Send the confirmation email
4. Return a response indicating email confirmation is needed

For the frontend, ensure the token from the URL is passed to the `/api/bookings/confirm` endpoint when validating.
