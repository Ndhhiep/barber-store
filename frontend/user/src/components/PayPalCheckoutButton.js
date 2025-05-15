import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';


const PayPalCheckoutButton = ({ totalAmount, onSuccess, onError, onCancel }) => {
  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: totalAmount.toFixed(2),
            currency_code: 'USD',
          },
        },
      ],
    });
  };

  const onApprove = async (data, actions) => {
    try {
      const details = await actions.order.capture();
      console.log('Transaction details:', details);
      // Call onSuccess with transaction details
      onSuccess(details);
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      onError(error);
    }
  };

  const onPayPalError = (error) => {
    console.error('PayPal Checkout Error:', error);
    onError(error);
  };

  const onPayPalCancel = (data) => {
    console.log('Payment cancelled by user:', data);
    onCancel();
  };
  return (
    <PayPalScriptProvider options={{ 
      "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID || 'Af45d1ZnjKzeBvq9HfXTLcjlFe5mWTD1c06MLI3Pjm5RGvNqgwyLR0iHNq38AnxzOX9AbMTDu2kEveQs',
      currency: 'USD',
      intent: 'capture',
      components: 'buttons',
      locale: 'en_US',
    
    }}>
      <PayPalButtons
        style={{
          layout: 'horizontal',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
          transition: 'none', // Remove ease-in-out effect
          tagline: 'false'
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onPayPalError}
        onCancel={onPayPalCancel}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalCheckoutButton;
