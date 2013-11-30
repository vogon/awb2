$('#chat-form').submit(function (e) {
  var chatLine = $('#chat-line');

  cloak.message('chatsent', chatLine.val());
  chatLine.val('');

  event.preventDefault();
});

cloak.configure({
  messages: {
    'chat': function (msg, user) {
      $('#chat-log').append(msg.user + ' says \'' + msg.msg + '\'<br>');
    }
  }
});

cloak.run('http://localhost:8080');