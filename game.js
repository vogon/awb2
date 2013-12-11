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
    this._nextPlayerId = 1;

    this._winFn = function (player) {
      return player.score >= 3;
    }

    this._state = Status.NOT_STARTED;

    this._whiteCards = cah.whiteCards;
    this._blackCards = cah.blackCards;
    
    this._whiteCardDeck = [];
    this._blackCardDeck = [];
    
    this._currentCardCzar = null;
    this._currentBlackCard = null;
    this._currentAnswers = null;

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
    if (this._state == Status.FINISHED) {
      // game's already over
      return false;
    } else if (_(this._activePlayers()).size() >= this._n) {
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
      if (this._state == Status.WAIT_FOR_ANSWERS) {
        this._dealToPlayer(player);
      }

      return true;
    }
  }

  Game.prototype._getPlayer = function (user) {
    return _(this.players).findWhere({ user: user });
  }

  Game.prototype._getCardCzar = function () {
    return this._currentCardCzar;
  }

  Game.prototype.leave = function (user) {
    var player = this._getPlayer(user);

    if (!player) {
      // user actually isn't in this game?
      return false;
    } else {
      // if the player is the current card czar, then abandon the current round
      if (player == this._currentCardCzar) {
        this._state = Status.WAIT_FOR_ROUND_START;
      }

      // everything's cool
      player.hasLeft = true;
      return true;
    }
  }

  Game.prototype.answer = function (user, answer) {
    var player = this._getPlayer(user);

    if (this._state != Status.WAIT_FOR_ANSWERS) {
      // not the time for answering
      return false;
    } else if (!player) {
      // user isn't in this game
      return false;
    } else if (player.hasLeft) {
      // player left the game
      return false;
    } else {
      // card czar can't answer
      if (player == this._currentCardCzar) {
        return false;
      }

      // find the card in the user's hand
      var card = _(player.hand).findWhere({ id: answer.id });

      if (this._currentAnswers[player.id]) {
        // player has already answered
        return false;
      } else if (card) {
        // player has card, so play it
        player.hand = _(player.hand).without(card);
        this._currentAnswers[player.id] = card;

        return true;
      } else {
        // player doesn't have card
        return false;
      }
    }
  }

  Game.prototype.lockAnswers = function (user) {
    var g = this;
    var allAnswersSubmitted = _(this._activePlayers()).every(function (player) {
      return (player == g._currentCardCzar) || (!!g._currentAnswers[player.id]);
    });

    if (this._state != Status.WAIT_FOR_ANSWERS) {
      // not waiting for answers right now
      return false;
    } else if (!allAnswersSubmitted) {
      // at least one active player hasn't answered
      return false;
    } else if (user != g._currentCardCzar.user) {
      // only the card czar can lock in answers
      return false;
    } else {
      // everything's cool
      this._state = Status.WAIT_FOR_JUDGMENT;
      return true;
    }
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

    // select new card czar
    if (this._currentCardCzar) {
      // already had a card czar, select next-by-id active player
      var cardCzar = this._currentCardCzar;
      var players = _(this._activePlayers()).sortBy(function (player) { return player.id; });
      var nextPlayer = _(players).find(function (player) { return player.id > cardCzar.id; });

      if (nextPlayer) {
        this._currentCardCzar = nextPlayer;
      } else {
        // no players with a higher id than the current card czar; start again at the beginning
        this._currentCardCzar = players[0];
      }
    } else {
      // no card czar yet, choose an active player randomly
      var players = _(this._activePlayers()).shuffle();
      this._currentCardCzar = players[0];
    }

    // change state to awaiting answers
    this._state = Status.WAIT_FOR_ANSWERS;

    return true;
  }

  Game.prototype._endGame = function () {
    if (this._state != Status.NOT_STARTED && this._state != Status.WAIT_FOR_ROUND_START) {
      return false;
    }

    this._state = Status.FINISHED;
    return true;
  }

  Game.prototype._getState = function() {
    return this._state;
  }

  Game.prototype._makePlayer = function (user) {
    return {
      id: this._nextPlayerId++,
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