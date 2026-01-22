<?php
// Prevent direct access
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

// Load configuration
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

// Set Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Configure strict domain in production if needed
header('Access-Control-Allow-Headers: Content-Type');

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

$name = $input['name'] ?? '';
$email = $input['email'] ?? '';
$mobile = $input['mobile'] ?? '';
$message = $input['message'] ?? '';

// Validation
if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

// Email Construction
// Note: We use the defined EMAIL_TO from config, or fallback
$to = defined('EMAIL_TO') ? EMAIL_TO : 'dev@kaioandrade.com';
$subject = "New Contact Request from $name";

$email_content = "
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .label { font-weight: bold; margin-top: 10px; }
    .value { margin-bottom: 10px; }
    .message { background: #f5f5f5; padding: 15px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class='container'>
    <h2>New Contact Request</h2>
    <div class='label'>Name:</div>
    <div class='value'>" . htmlspecialchars($name) . "</div>

    <div class='label'>Email:</div>
    <div class='value'>" . htmlspecialchars($email) . "</div>

    " . ($mobile ? "<div class='label'>Mobile:</div><div class='value'>" . htmlspecialchars($mobile) . "</div>" : "") . "

    <div class='label'>Message:</div>
    <div class='message'>" . nl2br(htmlspecialchars($message)) . "</div>
  </div>
</body>
</html>
";

// Headers
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: Contact Form <no-reply@kaioandrade.com>" . "\r\n";
$headers .= "Reply-To: $email" . "\r\n";

// Send Email
// Send Email
// Log the attempt
error_log("Attempting to send email to $to from $email");

if (mail($to, $subject, $email_content, $headers)) {
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
} else {
    $lastError = error_get_last();
    error_log("Mail failure: " . print_r($lastError, true));
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send email via server transport', 'details' => $lastError]);
}
?>
