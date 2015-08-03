<?php
require '../js/PHPMailer/PHPMailerAutoload.php';
include 'sendEmail.autoResponse.php';

$mail = new PHPMailer;

$clientName = $_POST['name'];
$clientEmail = $_POST['email'];
$clientMessage = $_POST['message'];

$mail->SMTPDebug = 3;                               // Enable verbose debug output

$mail->isSMTP();                                      // Set mailer to use SMTP
$mail->Host = 'mail.kaioandrade.com';                  // Specify main and backup SMTP servers
$mail->SMTPAuth = true;                               // Enable SMTP authentication
$mail->Username = 'contact@kaioandrade.com';                 // SMTP username
$mail->Password = 'kaio_7854';                        // SMTP password
// $mail->SMTPSecure = 'tls';                            // Enable TLS encryption, `ssl` also accepted
$mail->Port = 25;                                    // TCP port to connect to

$mail->From = 'contact@kaioandrade.com';
$mail->FromName = 'Kaio Andrade Online Form';
$mail->addReplyTo($clientEmail);
// $mail->addAddress('kaioed@gmail.com');        // Add a recipient

// $mail->addAddress('kaioed@gmail.com');                // Name is optional
// $mail->addAddress('kaioed@gmail.com', 'Information');        // Add a recipient
// $mail->addCC('cc@example.com');
// $mail->addBCC('bcc@example.com');

// $mail->addAttachment('/var/tmp/file.tar.gz');         // Add attachments
// $mail->addAttachment('/tmp/image.jpg', 'new.jpg');    // Optional name
$mail->isHTML(true);                                     // Set email format to HTML

$mail->Subject = 'Online Contact';
$mail->Body    = $clientMessage;
$mail->AltBody = $clientMessage;


// echo "<pre>";
// print_r($mail);
// echo "</pre>";
// die();

if(!$mail->send()) {
 
// echo "<pre>";
// print_r('222');
// echo "</pre>";

		echo 'Message could not be sent.';
    echo 'Mailer Error: ' . $mail->ErrorInfo;

} else {		

// echo "<pre>";
// print_r('333');
// echo "</pre>";


		// $mail->clearAllRecipients();
		// $mail->addReplyTo('contact@kaioandrade.com', 'Kaio Andrade');
		// $mail->addAddress($clientEmail, $clientName);        // Add a recipient
		// $mail->Body = $autoResponseMessageHTML;
		// $mail->send();

    echo 'Message has been sent';
}