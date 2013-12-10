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
    this._state = Status.NOT_STARTED;

    this._whiteCards = cah.whiteCards;
    this._blackCards = cah.blackCards;
    
    this._whiteCardDeck = [];
    this._blackCardDeck = [];
    
    this._currentBlackCard = null;
    this._currentAnswers = null;
    
    this._rounds = [];
    this._n = 4;
  }

  Game.prototype.changeSize = function (newSize) {
    if (_(this._activePlayers()).size() > newSize) {
      // game would be too small after resizing
      return false;
    } else {
      // everything's cool
      this._n = newSize;
      return true;
    }
  }

  Game.prototype.join = function (user) {
    if (_(this._activePlayers()).size() >= this._n) {
      // game's already full
      return false;
    } else {
      // make sure the player's not already in here
      if (_(this.players).findWhere({ user: user })) {
        return false;
      }

      // everything's cool
      var player = this._makePlayer(user);
      this.players.push(player);

      // if we're currently waiting for answers, deal the player in
      if (this._getState() == Status.WAIT_FOR_ANSWERS) {
        this._dealToPlayer(player);
      }

      return true;
    }
  }

  Game.prototype.getPlayer = function (user) {
    return _(this.players).findWhere({ user: user });
  }

  Game.prototype.leave = function (user) {
    var player = this.getPlayer(user);

    if (!player) {
      // user actually isn't in this game?
      return false;
    } else {
      // everything's cool
      player.hasLeft = true;
      return true;
    }
  }

  Game.prototype.answer = function (user, answer) {
    var player = this.getPlayer(user);

    if (!player) {
      // user isn't in this game
      return false;
    } else {
      // find the card in the user's hand
      var card = _(player.hand).findWhere({ id: answer.id });

      if (card) {
        // player has card, so play it
        player.hand = _(player.hand).without(card);
        this.currentAnswers[player.id] = card;

        return true;
      } else {
        // player doesn't have card
        return false;
      }
    }
  }

  Game.prototype.lockAnswers = function (user) {
    return false;
  }

  Game.prototype.vote = function (user, answer) {
    return false;
  }

  Game.prototype.newRound = function () {
    if (this._state != Status.NOT_STARTED && this._state != Status.WAIT_FOR_ROUND_START) {
      // can't start a new round right now
      return false;
    }

    if (_(this._activePlayers()).size() < 3) {
      // not enough players to start a round
      return false;
    }

    var g = this;

    // deal a new round
    _(this.players).forEach(this._dealToPlayer.bind(this));

    this._currentBlackCard = this._dealBlackCard();
    this._currentAnswers = {};

    // change state to awaiting answers
    this._state = Status.WAIT_FOR_ANSWERS;

    return true;
  }

  Game.prototype._setNextCardCzar = function (player) {
    return false;
  }

  Game.prototype._getState = function() {
    return this._state;
  }

  Game.prototype._makePlayer = function (user) {
    return {
      user: user,
      hasLeft: false,
      score: 0,
      hand: []
    };
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
  }

  Game.prototype._dealWhiteCards = function (n) {
    if (_(this._whiteCardDeck).size() < n) {
      // shuffle the white cards onto the deck
      this._whiteCardDeck = this._whiteCardDeck.concat(_(this._whiteCards).shuffle());
    }

    // deal n off the top
    var dealt = _(this._whiteCardDeck).first(n), remainder = _(this._whiteCardDeck).rest(n);
    this._whiteCardDeck = remainder;

    return dealt;
  }

  Game.prototype._dealToPlayer = function(player) {
    var oldHandSize = _(player.hand).size();
    var newCards = this._dealWhiteCards(10 - oldHandSize);

    player.hand = player.hand.concat(newCards);
  }

  return Game;
})();