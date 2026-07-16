import fetch from 'node-fetch';

// Test the contact form API endpoint
async function testContactForm() {
  console.log('🧪 Testing Contact Form...');

  const testData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    mobile: '+1234567890',
    message: 'This is a test message from the contact form.'
  };

  try {
    console.log('📧 Sending test request to:', 'http://localhost:3001/api/send-email');
    console.log('📝 Test data:', testData);

    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Test PASSED!');
      console.log('📤 Email sent successfully:', data.message);
      if (data.messageId) {
        console.log('🆔 Message ID:', data.messageId);
      }
    } else {
      console.log('❌ Test FAILED!');
      console.log('💥 Error:', data.error || 'Unknown error');
      if (data.details) {
        console.log('🔍 Details:', data.details);
      }
    }

  } catch (error) {
    console.log('❌ Test FAILED with exception!');
    console.log('💥 Error:', error.message);
    console.log('🔍 This might be because the email server is not running.');
    console.log('🚀 Try running: node server.js');
  }
}

// Run the test
testContactForm();
