function compileTemplateFromSelector(selector) {
  var source = $(selector).html();

  return Handlebars.compile(source);
}

var gameListTemplate = compileTemplateFromSelector('#game-list-template'),
    chatlogMsgTemplate = compileTemplateFromSelector('#chatlog-msg-template'),
    chatlogYouJoinedTemplate = compileTemplateFromSelector('#chatlog-youjoined-template'),
    chatlogOtherJoinedTemplate = compileTemplateFromSelector('#chatlog-otherjoined-template'),
    chatlogYouNickTemplate = compileTemplateFromSelector('#chatlog-younick-template'),
    chatlogOtherNickTemplate = compileTemplateFromSelector('#chatlog-othernick-template');
    
$('#chat-form').submit(function (e) {
  var chatLine = $('#chat-line');

  cloak.message(common.ROOM_SEND_CHAT, chatLine.val());
  chatLine.val('');

  event.preventDefault();
});

$('#change-name-form').submit(function (e) {
  var newName = $('#new-name');

  cloak.message(common.CHANGE_NAME, newName.val());
  newName.val('');

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

cloakConfig.messages[common.YOU_CHANGED_NAME] = function (msg, user) {
  $('#chat-log').append(chatlogYouNickTemplate(msg));
};

cloakConfig.messages[common.OTHER_CHANGED_NAME] = function (msg, user) {
  $('#chat-log').append(chatlogOtherNickTemplate(msg));
}

cloakConfig.messages[common.GAME_LIST] = function (msg, user) {
  $('#game-list').html(gameListTemplate(msg));

  $('.create-game').click(function (e) {
    cloak.message(common.CREATE_GAME);
  });
}

cloak.configure(cloakConfig);
cloak.run('/');