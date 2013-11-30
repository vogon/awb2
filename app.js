var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    cloak = require('cloak');

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
    res.sendfile(path.dirname(require.resolve(library)) + relativePath);
  });
};

app.use(express.logger());
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.redirect('/index.html');
});
app.serveClientLibrary('/lib/underscore.js', 'underscore', '/underscore-min.js', '/underscore.js');
app.serveClientLibrary('/lib/cloak-client.js', 'cloak', '/cloak-client.min.js', '/cloak-client.js');

cloak.configure({
  express: server,
  autoJoinLobby: true,
  autoCreateRooms: false,
  minRoomMembers: 1,
  lobby: {

  },
  room: {

  },
  messages: {
    'chatsent': function(msg, user) {
      console.log('received chatsent: msg = ' + msg);
      user.getRoom().messageMembers('chat', { user: user.name, msg: msg });
    }
  }
});

server.listen(8080);
cloak.run();