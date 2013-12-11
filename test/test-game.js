var Game = require('../game.js'),
    _ = require('underscore');

// statuses stolen from game.js
var Status = {
  NOT_STARTED: 0,
  WAIT_FOR_ROUND_START: 1,
  WAIT_FOR_ANSWERS: 2,
  WAIT_FOR_JUDGMENT: 3,
  WAIT_FOR_ROUND_END: 4,
  GAME_OVER: 5
};

// helper functions
function answerAll(game) {
  var cardCzar = game._getCardCzar();
  var nonCzars = _(game._activePlayers()).without(cardCzar);
  var result = true;

  _(nonCzars).each(function (player) {
    result &= game.answer(player.user, player.hand[0]);
  });

  return result;
}

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
exports['pre-start'] = {
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
exports['awaiting answers'] = {
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
  "answer fails for card not in player's hand": function (test) {
    var cardCzar = this.game._getCardCzar();
    var notCardCzarPlayer = (this.game._getCardCzar().user == 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);

    test.ok(!this.game.answer(notCardCzarPlayer.user, cardCzar.hand[0]));
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
  'answer only works for active players': function (test) {
    test.ok(this.game.changeSize(4));
    test.ok(this.game.join(3));

    var notCardCzarPlayer = (this.game._getCardCzar().user == 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);

    test.ok(this.game.leave(notCardCzarPlayer.user));
    test.ok(!this.game.answer(notCardCzarPlayer.user, notCardCzarPlayer.hand[0]));
    test.done();
  },
  "lock answers fails if locking player isn't card czar": function (test) {
    var cardCzar = this.game._getCardCzar();
    var notCardCzarPlayer = (this.game._getCardCzar().user == 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);

    test.ok(answerAll(this.game));
    test.ok(!this.game.lockAnswers(notCardCzarPlayer.user));
    test.done();
  },
  'lock answers works iff all active players have answered': function (test) {
    var cardCzar = this.game._getCardCzar();
    var notCardCzarPlayer1 = (cardCzar.user <= 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);
    var notCardCzarPlayer2 = (cardCzar.user <= 1) ? this.game._getPlayer(2) : this.game._getPlayer(1);

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
exports['awaiting vote'] = {
  setUp: function (callback) {
    this.game = new Game();
    this.game.join(0);
    this.game.join(1);
    this.game.join(2);
    this.game.newRound();

    var cardCzar = this.game._getCardCzar();

    answerAll(this.game);
    this.game.lockAnswers(cardCzar.user);

    callback();
  },
  tearDown: function (callback) {
    callback();
  },
  "join works, player doesn't become card czar and can't answer": function (test) {
    test.ok(this.game.changeSize(4));
    test.ok(this.game.join(3));

    var player = this.game._getPlayer(3);

    test.notEqual(3, this.game._getCardCzar().user);

    // deal the player in for testing purposes, even though this would normally happen at the top of the next round
    this.game._dealToPlayer(player);
    test.ok(!this.game.answer(3, player.hand[0]));

    test.done();
  },
  'card czar leave works, round is discarded': function (test) {
    var cardCzar = this.game._getCardCzar();

    test.ok(this.game.leave(cardCzar.user));
    test.equal(this.game._getState(), Status.WAIT_FOR_ROUND_START);

    test.done();
  },
  'non-card-czar leave works': function (test) {
    var notCardCzarUser = (this.game._getCardCzar().user == 0) ? 1 : 0;

    test.ok(this.game.leave(notCardCzarUser));
    test.equal(this.game._getState(), Status.WAIT_FOR_JUDGMENT);
    test.done();
  },
  'answer fails': function (test) {
    var notCardCzarPlayer = (this.game._getCardCzar().user == 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);

    test.ok(!this.game.answer(notCardCzarPlayer.user, notCardCzarPlayer.hand[0]));
    test.done();
  },
  'lock answers fails': function (test) {
    var cardCzar = this.game._getCardCzar();

    test.ok(!this.game.lockAnswers(cardCzar.user));
    test.done();
  },
  "vote fails if the voter isn't the card czar": function (test) {
    var notCardCzarPlayer = (this.game._getCardCzar().user == 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);

    test.ok(!this.game.vote(notCardCzarPlayer.user, this.game._currentAnswers[notCardCzarPlayer.id]));
    test.done();
  },
  "vote fails for an answer that hasn't been provided": function (test) {
    var cardCzar = this.game._getCardCzar();
    
    test.ok(!this.game.vote(cardCzar.user, cardCzar.hand[0]));
    test.done();
  },
  'vote works, transition to finished if someone won': function (test) {
    var cardCzar = this.game._getCardCzar();
    var notCardCzarPlayer = (this.game._getCardCzar().user == 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);

    // fix up player's score to be almost-winning
    notCardCzarPlayer.score = 1000000;

    test.ok(this.game.vote(cardCzar.user, this.game._currentAnswers[notCardCzarPlayer.id]));
    test.equal(this.game._getState(), Status.GAME_OVER);
    test.done();
  },
  'vote works, transition to awaiting new round if game still going': function (test) {
    var cardCzar = this.game._getCardCzar();
    var notCardCzarPlayer = (this.game._getCardCzar().user == 0) ? this.game._getPlayer(1) : this.game._getPlayer(0);

    test.ok(this.game.vote(cardCzar.user, this.game._currentAnswers[notCardCzarPlayer.id]));
    test.equal(this.game._getState(), Status.WAIT_FOR_ROUND_START);
    test.done();
  },
  'new round fails': function (test) {
    test.ok(!this.game.newRound());
    test.done();
  }
};

// awaiting new round:
//   join works - player can become next card czar and answer in next round
//   leave works
//   answer fails
//   lock answers fails
//   vote fails
//   new round works iff there are >= 3 players, state transition to awaiting answers
exports['awaiting new round'] = {

};

// finished:
//   join fails
//   leave works
//   answer fails
//   lock answers fails
//   vote fails
//   new round fails
exports['finished'] = {
  setUp: function (callback) {
    this.game = new Game();
    this.game.join(0);
    this.game.join(1);
    this.game.join(2);
    this.game._endGame();
    callback();
  },
  'join fails': function (test) {
    test.ok(this.game.changeSize(4));
    test.ok(!this.game.join(3));
    test.done();
  },
  'leave works': function (test) {
    test.ok(this.game.leave(0));
    test.done();
  },
  'answer fails': function (test) {
    // deal to player 0 for testing purposes
    var player = this.game._getPlayer(0);
    this.game._dealToPlayer(player);

    test.ok(!this.game.answer(player.user, player.hand[0]));
    test.done();
  },
  //'lock answers fails': function (test) {

  //},
  //'vote fails': function (test) {
  //  test.done();
  //},
  'new round fails': function (test) {
    test.ok(!this.game.newRound());
    test.done();
  }
};
