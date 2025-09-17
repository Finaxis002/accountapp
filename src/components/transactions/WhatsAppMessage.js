import React, { useState } from 'react';
import axios from 'axios';

// WhatsAppMessage component to send WhatsApp messages
const WhatsAppMessage = ({ phoneNumber, message }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async () => {
    setLoading(true);
    try {
      const accessToken = 'EAAmhbJcChq8BPeI5iy8zELdmXkjZA37hGb5ZCZBXipoYuvjnFlZAAm2fMVI9ln48vFUcZBL0QbttaF9aYUssQFGPhYypT0SopjpbQrQ0ZBc5vGoicHViX9ChsuFHGZAe8O5fxsuoAVoajj8rHc95bZBqx3InGh7zsZCBf3VyuYahzOWWisjkodL7Y829Cyq9iqUVOsZBjVrAJYy6wOjJyNCGbx9JFuNOz7VeKFtZAOZBCIYltZAiAhwZDZD'; // Replace with actual token
      const phoneNumberID = '821011864424701'; // Replace with your phone number ID
      
      const response = await axios.post(
        `https://graph.facebook.com/v22.0/${phoneNumberID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber, // recipient's phone number
          type: 'template',
          template: {
            name: 'hello_world', // Template name
            language: {
              code: 'en_US',
            },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: message }, // Dynamically send the message
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Message sent:', response.data);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Sending...' : 'Send Invoice via WhatsApp'}
      </button>
    </div>
  );
};

export default WhatsAppMessage;
