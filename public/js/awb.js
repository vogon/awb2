function compileTemplateFromSelector(selector) {
  var source = $(selector).html();

  return Handlebars.compile(source);
}

var chatlogLineTemplate = compileTemplateFromSelector('#chatlog-line-template');

$('#chat-form').submit(function (e) {
  var chatLine = $('#chat-line');

  cloak.message('chatsent', chatLine.val());
  chatLine.val('');

  event.preventDefault();
});

cloak.configure({
  messages: {
    'chat': function (msg, user) {
      $('#chat-log').append(chatlogLineTemplate(msg));
    }
  }
});

cloak.run('http://localhost:8080');