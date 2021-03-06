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

  // send other-entered message to everyone except the person joining
  // future cloak pull request: room.messageMembersExcept()
  _(room.members).forEach(function (member) {
    if (user != member) {
      member.message(common.ROOM_OTHER_ENTERED, { roomname: room.name, username: user.name });
    }
  });
}

// placeholder, do something fancier with this
var games = [];

function makeClientGameView(game) {
  return {
    id: game.id,
    name: game.name
  };
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

      var gameList = _(games).map(makeClientGameView);
      user.message(common.GAME_LIST, { games: gameList });
    }
  },

  room: {
    newMember: function(user) {
      console.log('room newMember');

      notifyRoomUserEntered(user.getRoom(), user);
    }
  },

  messages: {}
};

function makeRoomForGame(game) {
  var room = cloak.createRoom(game.name, 4);
  room.data = game;

  return room;
}

cloakConfig.messages[common.CREATE_GAME] = function (msg, user) {
  var game = new Game();
  var room = makeRoomForGame(game);

  games.push(game);
  user.joinRoom(room);
  
  var gameList = _(games).map(makeClientGameView);
  cloak.messageAll(common.GAME_LIST, { games: gameList });
};

cloakConfig.messages[common.JOIN_GAME] = function (msg, user) {
  var id = msg.id;
  var game = _(games).findWhere({ id: id });
  var room = _(cloak.getRooms()).findWhere({ data: game });

  if (!room) {
    // game doesn't have a room right now, create one
    room = makeRoomForGame(game);
  }

  user.joinRoom(room);
};

cloakConfig.messages[common.ROOM_SEND_CHAT] = function (msg, user) {
  console.log('received chatsent: msg = ' + msg);
  user.getRoom().messageMembers(common.ROOM_CHAT_RECEIVED, { username: user.name, text: msg });
};

cloakConfig.messages[common.CHANGE_NAME] = function (msg, user) {
  console.log('received changename: msg = ' + msg);

  var oldUsername = user.name, newUsername = msg;

  user.name = newUsername;

  user.message(common.YOU_CHANGED_NAME, { username: newUsername });

  // send other-entered message to everyone except the person joining
  // future cloak pull request: room.messageMembersExcept()
  _(user.getRoom().members).forEach(function (member) {
    if (user != member) {
      member.message(common.OTHER_CHANGED_NAME, { oldUsername: oldUsername, newUsername: newUsername });
    }
  });

}

var port = process.env['PORT'] || 80;

server.listen(port);

cloak.configure(cloakConfig);
cloak.run();