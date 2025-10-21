import React from 'react';

const WhatsAppButton = () => {
  return (
    <a
      href="https://api.whatsapp.com/send/?phone=919168029000&text=Hello+I+want+to+know+more+about+your+services&type=phone_number&app_absent=0"
      target="_blank"
      rel="noopener noreferrer"
      className='whtsapbutton'
      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="Chat on WhatsApp"
        style={{ width: '40px', height: '40px', verticalAlign: 'middle' }}
      />
      <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '16px', marginLeft: '8px' }}>
        Chat with us on WhatsApp
      </span>
    </a>
  );
};

export default WhatsAppButton;
