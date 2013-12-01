var assert = require('assert'),
    uuid = require('node-uuid'),
    _ = require('underscore');

var Status = {
  NOT_STARTED: 0,
  WAIT_FOR_ROUND_START: 1,
  WAIT_FOR_ANSWERS: 2,
  WAIT_FOR_JUDGMENT: 3,
  WAIT_FOR_ROUND_END: 4,
  GAME_OVER: 5
};

// boilerplate cardset-loading code for rn
var Cardset = require('./cardset.js'),
    cah = new Cardset(__dirname + '/sets/cah-cc-by-nc-sa.json');

module.exports = (function () {
  function Game() {
    this.id = uuid.v4();
    this.name = 'game ' + Math.floor(Math.random() * 1000000);
    this.players = [];
    this._status = Status.NOT_STARTED;
    this._whiteCards = cah.whiteCards;
    this._blackCards = cah.blackCards;
    this._whiteCardDeck = [];
    this._blackCardDeck = [];
    this._rounds = [];
    this._n = 4;
  }

  Game.prototype.changeSize = function (newSize) {
    if (this._activePlayers().size() > newSize) {
      // game would be too small after resizing
      return false;
    } else {
      // everything's cool
      this._n = newSize;
      return true;
    }
  }

  Game.prototype.join = function (user) {
    if (this._activePlayers().size() >= this._n) {
      // game's already full
      return false;
    } else {
      // make sure the player's not already in here
      if (_(this.players).findWhere({ user: user })) {
        return false;
      }

      // everything's cool
      this.players.push(this._makePlayer(user));
      return true;
    }
  }

  Game.prototype.leave = function (user) {
    var player = _(this.players).findWhere({ user: user });

    if (!player) {
      // user actually isn't in this game?
      return false;
    } else {
      // everything's cool
      player.hasLeft = true;
      return true;
    }
  }

  Game.prototype._makePlayer = function (user) {
    return {
      user: user,
      hasLeft: false,
      score: 0,
      hand: []
    };
  };

  Game.prototype._readyToStart = function () {
    return (this._status == Status.NOT_STARTED) && this._activePlayers().size() >= 3;
  }

  Game.prototype._activePlayers = function () {
    return _(this.players).where({ hasLeft: false });
  }

  Game.prototype._dealBlackCard = function () {
    if (_(this._blackCardDeck).size() == 0) {
      // shuffle the black cards onto the deck
      this._blackCardDeck = this._blackCardDeck.concat(_(this._blackCards).shuffle());
    }

    return this._blackCardDeck.shift();
  };

  Game.prototype._dealWhiteCards = function (n) {
    if (_(this._whiteCardDeck).size() < n) {
      // shuffle the white cards onto the deck
      this._whiteCardDeck = this._whiteCardDeck.concat(_(this._whiteCards).shuffle());
    }

    // deal n off the top
    var dealt = _(this._whiteCardDeck).first(n), remainder = _(this._whiteCardDeck).rest(n);
    this._whiteCardDeck = remainder;

    return dealt;
  };

  Game.prototype._startRound = function () {
    if (this._status != Status.WAIT_FOR_NEXT_ROUND) {
      // we're already in a round.
      return false;
    }

    // deal people up to 10
    _(this.hands).forEach(function (hand, index) {
      var toDeal = 10 - _(hand).size();

      this.hands[index] = hand.concat(this._dealWhiteCards(toDeal));
    });

    // choose a new black card
    this.currentBlackCard = this._dealBlackCard();

    // reset list of answers
    this.currentWhiteCards = [];
  };

  Game.prototype._endRound = function () {
    if (this._status != Status.WAIT_FOR_ROUND_END) {
      // we're not ready for this round to end yet.
    }

    // record this round in the game history
  };

  Game.prototype.start = function () {
    if (!this._readyToStart()) {
      return false;
    }

    // give everyone an empty hand
    for (var i = 0; i < _(this.players).size(); i++) {
      this.hands[i] = [];
    }

    this._status = Status.WAITING_FOR_NEXT_ROUND;
  };

  return Game;
})();