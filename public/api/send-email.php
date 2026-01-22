<?php
// SendGrid Relay via Cloudways SMTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

// Load config for the target email
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

$input = json_decode(file_get_contents('php://input'), true);

$name = $input['name'] ?? '';
$email = $input['email'] ?? '';
$mobile = $input['mobile'] ?? '';
$message = $input['message'] ?? '';

if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$to = defined('EMAIL_TO') ? EMAIL_TO : 'dev@kaioandrade.com';
$subject = "New Contact Request: $name";

$html_content = "
<html>
<body style='font-family: Arial, sans-serif;'>
  <h2>New Contact Request</h2>
  <p><strong>Name:</strong> $name</p>
  <p><strong>Email:</strong> $email</p>
  <p><strong>Mobile:</strong> $mobile</p>
  <p><strong>Message:</strong></p>
  <div style='background: #f4f4f4; padding: 15px; border-radius: 5px;'>
    " . nl2br(htmlspecialchars($message)) . "
  </div>
</body>
</html>
";

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: Contact Form <dev@kaioandrade.com>" . "\r\n"; // Must be verified in SendGrid
$headers .= "Reply-To: $email" . "\r\n";

if (mail($to, $subject, $html_content, $headers)) {
    echo json_encode(['success' => true, 'message' => 'Email sent via SendGrid Relay']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server failed to send email. Check SendGrid logs in Cloudways.']);
}
?>
