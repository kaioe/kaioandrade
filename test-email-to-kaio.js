import fetch from 'node-fetch';

// Test sending email to kaioed@gmail.com
async function testEmailToKaio() {
  console.log('🧪 Testing Email to kaioed@gmail.com...');

  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    mobile: '+1234567890',
    message: 'This is a test message sent at ' + new Date().toISOString()
  };

  try {
    console.log('📧 Sending test request to:', 'http://localhost:3001/api/send-email');
    console.log('📝 Test data:', testData);
    console.log('📬 Recipient will be:', 'kaioed@gmail.com');

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
      console.log('📧 Check kaioed@gmail.com for the test email');
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
  }
}

// Run the test
testEmailToKaio().catch(console.error);
