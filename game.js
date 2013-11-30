var uuid = require('node-uuid');

module.exports = (function () {
  function Game() {
    this.id = uuid.v4();
    this.name = 'game ' + Math.floor(Math.random() * 1000000);
  }

  Game.prototype = {

  };

  return Game;
})();