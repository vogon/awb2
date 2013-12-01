var _ = require('underscore'),
    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    cloak = require('cloak'),
    expressLess = require('express-less');
    
var preferMinify = true;

app.serveClientLibrary = function (serverPath, library, minifiedRel, unminifiedRel) {
  var path = require('path');
  var relativePath;

  if (preferMinify) {
    relativePath = minifiedRel || unminifiedRel;
  } else {
    relativePath = unminifiedRel || minifiedRel;
  }

  if (!relativePath) {
    // couldn't figure out relative path...
    return;
  }

  this.get(serverPath, function (req, res) {
    res.sendfile(path.normalize(path.dirname(require.resolve(library)) + relativePath));
  });
};

app.use(express.logger());
app.use(express.static(__dirname + '/public'));
// TODO: express-less doesn't seem to cache compiled LESS files -- make sure there's no terrible performance
// implications for using it
app.use('/less', expressLess(__dirname + '/less'));

app.get('/', function (req, res) {
  res.redirect('/index.html');
});
app.serveClientLibrary('/lib/underscore.js', 'underscore', '/underscore-min.js', '/underscore.js');
app.serveClientLibrary('/lib/cloak-client.js', 'cloak', '/cloak-client.min.js', '/cloak-client.js');
app.serveClientLibrary('/lib/handlebars.js', 'handlebars', '/../dist/handlebars.min.js', '/../dist/handlebars.js');

var common = require('./public/js/common.js');
var Game = require('./game.js');

function notifyRoomUserEntered(room, user) {
  user.message(common.ROOM_YOU_ENTERED, { roomname: room.name });

  _(room.members).forEach(function (member) {
    if (user != member) {
      member.message(common.ROOM_OTHER_ENTERED, { roomname: room.name, username: user.name });
    }
  });
}

var cloakConfig = {
  express: server,
  autoJoinLobby: true,
  autoCreateRooms: false,
  minRoomMembers: 1,
  lobby: {
    newMember: function(user) {
      console.log('lobby newMember');

      notifyRoomUserEntered(cloak.getLobby(), user);
    }
  },

  room: {
    init: function () {
      this.data = new Game();
      this.data.name = this.name;
    },

    newMember: function(user) {
      console.log('room newMember');

      notifyRoomUserEntered(user.getRoom(), user);
    }
  },

  messages: {}
};

cloakConfig.messages[common.ROOM_CREATE] = function(msg, user) {
  var room = cloak.createRoom('butts', 5);

  room.addMember(user);
}

cloakConfig.messages[common.ROOM_SEND_CHAT] = function(msg, user) {
  console.log('received chatsent: msg = ' + msg);
  user.getRoom().messageMembers(common.ROOM_CHAT_RECEIVED, { username: user.name, text: msg });
};

server.listen(80);

cloak.configure(cloakConfig);
cloak.run();