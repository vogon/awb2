﻿var Game = require('../game.js');

// statuses stolen from game.js
var Status = {
  NOT_STARTED: 0,
  WAIT_FOR_ROUND_START: 1,
  WAIT_FOR_ANSWERS: 2,
  WAIT_FOR_JUDGMENT: 3,
  WAIT_FOR_ROUND_END: 4,
  GAME_OVER: 5
};

// game verbs: join, leave, answer (a black card), lock answers, vote (for a white card), new round
// game states: pre-start, awaiting answers, awaiting vote, awaiting new round, finished

// --- state-independent behaviors ---

// join:
//   fails if game is full (number of active players == n)
//   fails if joining player is already in game
exports['join']  = {
  setUp: function (callback) {
    this.game = new Game();
    callback();
  },
  tearDown: function (callback) {
    callback();
  },
  'join fails if game full': function (test) {
    var n = this.game._n;

    for (var i = 0; i < n; i++)
    {
      test.ok(this.game.join(i));
    }

    test.ok(!this.game.join(n));

    test.done();
  },
  'can only join once': function (test) {
    test.ok(this.game.join(0));
    test.ok(!this.game.join(0));
    test.done();
  }
};

// leave:
//   fails if leaving player isn't in game
exports['leave'] = {
  setUp: function (callback) {
    this.game = new Game();
    callback();
  },
  tearDown: function (callback) {
    callback();
  },
  "leave fails if player isn't in game": function (test) {
    test.ok(!this.game.leave(0));
    test.done();
  }
};

// --- state-dependent behaviors ---

// pre-start:
//   join works
//   leave works
//   answer fails
//   lock answers fails
//   vote fails
//   new round works iff there are >= 3 players, state transition to awaiting answers
exports['pre-start functional'] = {
  setUp: function (callback) {
    this.game = new Game();
    callback();
  },
  tearDown: function (callback) {
    callback();
  },
  'join succeeds': function (test) {
    test.ok(this.game.join(0));
    test.done();
  },
  'leave succeeds': function (test) {
    test.ok(this.game.join(0));
    test.ok(this.game.leave(0));
    test.done();
  },
  'lock answers fails': function (test) {
    test.ok(!this.game.lockAnswers());
    test.done();
  },
  'answer fails': function (test) {
    test.ok(!this.game.answer(0, ''));
    test.done();
  },
  'vote fails': function (test) {
    test.ok(!this.game.vote(0, ''));
    test.done();
  },
  'new round fails if too few players': function (test) {
    test.ok(this.game.join(0));
    test.ok(this.game.join(1));
    test.ok(!this.game.newRound());
    test.equal(this.game._getState(), Status.NOT_STARTED);
    test.done();
  },
  'new round succeeds': function (test) {
    test.ok(this.game.join(0));
    test.ok(this.game.join(1));
    test.ok(this.game.join(2));
    test.ok(this.game.newRound());
    test.equal(this.game._getState(), Status.WAIT_FOR_ANSWERS);
    test.done();
  }
};

// awaiting answers:
//   join works - player becomes non-czar and can submit answer for active round
//   leave works:
//     if player is card czar, round is discarded;
//     behavior if player count is now < 3 tbd
//   answer works iff the answering player isn't the card czar and hasn't answered
//   lock answers works iff the locking player is the card czar and all active players have answered
//   vote fails
//   new round fails
exports['awaiting answers functional'] = {
  setUp: function (callback) {
    this.game = new Game();
    this.game.join(0);
    this.game.join(1);
    this.game.join(2);
    this.game.newRound();

    callback();
  },
  tearDown: function (callback) {
    callback();
  },
  "join works, newly-joined player can answer": function (test) {
    test.ok(this.game.changeSize(4));
    test.ok(this.game.join(3));

    var player = this.game._getPlayer(3);
    test.ok(this.game.answer(3, player.hand[0]));
    
    test.done();
  },
  'card czar leave works, round is abandoned': function (test) {
    var cardCzar = this.game._getCardCzar();

    test.ok(this.game.leave(cardCzar.user));
    test.equal(this.game._getState(), Status.WAIT_FOR_ROUND_START);
    test.done();
  },
  'non-card czar leave works': function (test) {
    var notCardCzarUser = (this.game._getCardCzar().user == 0) ? 1 : 0;

    test.ok(this.game.leave(notCardCzarUser));
    test.equal(this.game._getState(), Status.WAIT_FOR_ANSWERS);
    test.done();
  },
  'answer fails for card czar': function (test) {
    var cardCzar = this.game._getCardCzar();

    test.ok(!this.game.answer(cardCzar.user, cardCzar.hand[0]));
    test.done();
  },
  'answer works': function (test) {
    var notCardCzarPlayer = (this.game._getCardCzar().user == 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);
    
    test.ok(this.game.answer(notCardCzarPlayer.user, notCardCzarPlayer.hand[0]));
    test.done();
  },
  'answer only works once': function (test) {
    var notCardCzarPlayer = (this.game._getCardCzar().user == 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);

    test.ok(this.game.answer(notCardCzarPlayer.user, notCardCzarPlayer.hand[0]));
    test.ok(!this.game.answer(notCardCzarPlayer.user, notCardCzarPlayer.hand[0]));
    test.done();
  },
  "lock answers fails if locking player isn't card czar": function (test) {
    var cardCzar = this.game._getCardCzar();
    var notCardCzarPlayer1 = (cardCzar.user == 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);
    var notCardCzarPlayer2 = (cardCzar.user == 1) ? this.game._getPlayer(2) : this.game._getPlayer(1);

    test.ok(this.game.answer(notCardCzarPlayer1.user, notCardCzarPlayer1.hand[0]));
    test.ok(this.game.answer(notCardCzarPlayer2.user, notCardCzarPlayer2.hand[0]));
    test.ok(!this.game.lockAnswers(notCardCzarPlayer1.user));
    test.done();
  },
  'lock answers works iff all active players have answered': function (test) {
    var cardCzar = this.game._getCardCzar();
    var notCardCzarPlayer1 = (cardCzar.user == 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);
    var notCardCzarPlayer2 = (cardCzar.user == 1) ? this.game._getPlayer(2) : this.game._getPlayer(1);

    test.ok(!this.game.lockAnswers(cardCzar.user));
    test.ok(this.game.answer(notCardCzarPlayer1.user, notCardCzarPlayer1.hand[0]));
    test.ok(!this.game.lockAnswers(cardCzar.user));
    test.ok(this.game.answer(notCardCzarPlayer2.user, notCardCzarPlayer2.hand[0]));
    test.ok(this.game.lockAnswers(cardCzar.user));
    test.done();
  },
  'vote fails': function (test) {
    test.ok(!this.game.vote());
    test.done();
  },
  'new round fails': function (test) {
    test.ok(!this.game.newRound());
    test.done();
  }
};

// awaiting vote:
//   join works - player becomes non-czar and doesn't get to answer
//   leave works:
//     if player is card czar, round is discarded;
//     behavior if player count is now < 3 tbd
//   answer fails
//   lock answers fails
//   vote works iff the voting player is the card czar;
//     if a player has won, state transition to finished;
//     otherwise, state transition to awaiting new round
//   new round fails
exports['awaiting vote functional'] = {

};

// awaiting new round:
//   join works - player can become next card czar and answer in next round
//   leave works
//   answer fails
//   lock answers fails
//   vote fails
//   new round works iff there are >= 3 players, state transition to awaiting answers
exports['awaiting new round functional'] = {

};

// finished:
//   join fails
//   leave works
//   answer fails
//   lock answers fails
//   vote fails
//   new round fails
exports['finished functional'] = {

};
