var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    cloak = require('cloak'),
    expressLess = require('express-less');

var Game = require('./game.js');

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

cloak.configure({
  express: server,
  autoJoinLobby: true,
  autoCreateRooms: false,
  minRoomMembers: 1,
  lobby: {

  },

  room: {
    init: function () {
      this.data = new Game();
      this.data.name = this.name;
    },

    newMember: function(user) {
      user.message('joinedroom', { room: user.getRoom().data });
    }
  },

  messages: {
    'newroom': function(msg, user) {
      var room = cloak.createRoom('butts', 5);
      
      room.addMember(user);
    },

    'chatsent': function(msg, user) {
      console.log('received chatsent: msg = ' + msg);
      user.getRoom().messageMembers('chat', { username: user.name, text: msg });
    }
  }
});

server.listen(8080);
cloak.run();