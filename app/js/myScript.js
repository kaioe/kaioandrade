'use strict';

$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();

    $('#contactForm').on('submit', function(event)
      {
        event.preventDefault();

        var formContact = $("#contactForm"),
            divForm =  $('#divContactForm'),
            message = '<h2>Processing...</h2>';

        divForm.html(message);

        console.log(formContact.serialize());

        $.ajax(
          {
            url: '../core/sendEmails.php',
            data: formContact.serialize(),
            type: "POST"
          })
          .done(function(dataZ)
            {
              var erro = dataZ.indexOf("Error"),
                  success = dataZ.indexOf("Success"),
                  reset = dataZ.indexOf("reset"),
                  classe = '',
                  bt_text = '';

              // $(document).scrollTop(0);

              if(erro > -1){
                classe = 'btn-danger'; //btn-success // btn-primary
                bt_text = 'Please try again'; // Click Here // Reset
              }
              if(success > -1){
                classe = 'btn-success'; // btn-primary
                bt_text = 'Click Here'; // Reset
              }
              if(reset > -1){
                classe = 'btn-primary';
                bt_text = 'Reset Here';
              }

              // onclick="javascript:window.location=\''+loginPath+'\';"
              divForm.html('<h2>'+dataZ+'</h2>');
              // <button class="btn '+classe+' center-block" onclick="window.location.href = adminPath">'+bt_text+'</button>
              console.log(dataZ);
            })
          .fail(function(error)
            {
              console.log(error);
              divForm.html('<h2>'+dataZ+'</h2><button class="btn btn-danger center-block" onclick="javascript:window.reload();">Please try again</button>');
            });
      });
});