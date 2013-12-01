function compileTemplateFromSelector(selector) {
  var source = $(selector).html();

  return Handlebars.compile(source);
}

var chatlogMsgTemplate = compileTemplateFromSelector('#chatlog-msg-template'),
    chatlogYouJoinedTemplate = compileTemplateFromSelector('#chatlog-youjoined-template'),
    chatlogOtherJoinedTemplate = compileTemplateFromSelector('#chatlog-otherjoined-template');

$('#chat-form').submit(function (e) {
  var chatLine = $('#chat-line');

  cloak.message(common.ROOM_SEND_CHAT, chatLine.val());
  chatLine.val('');

  event.preventDefault();
});

var cloakConfig = {
  messages: {}
};

cloakConfig.messages[common.ROOM_CHAT_RECEIVED] = function (msg, user) {
  $('#chat-log').append(chatlogMsgTemplate(msg));
};

cloakConfig.messages[common.ROOM_YOU_ENTERED] = function (msg, user) {
  $('#chat-log').append(chatlogYouJoinedTemplate(msg));
};

cloakConfig.messages[common.ROOM_OTHER_ENTERED] = function (msg, user) {
  $('#chat-log').append(chatlogOtherJoinedTemplate(msg));
};

cloak.configure(cloakConfig);
cloak.run('http://localhost:8080');