var Game = require('../game.js');

// game verbs: join, leave, answer (a black card), vote (for a white card), new round
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
    test.done();
  },
  'new round succeeds': function (test) {
    test.ok(this.game.join(0));
    test.ok(this.game.join(1));
    test.ok(this.game.join(2));
    test.ok(this.game.newRound());
    test.done();
  }
};

// awaiting answers:
//   join works - player becomes non-czar and can submit answer for active round
//   leave works:
//     if player is card czar, round is discarded;
//     behavior if player count is now < 3 tbd
//   answer works iff the answering player isn't the card czar and hasn't answered
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
//   vote works iff the voting player is the card czar;
//     if a player has won, state transition to finished;
//     otherwise, state transition to awaiting new round
//   new round fails

// awaiting new round:
//   join works - player can become next card czar and answer in next round
//   leave works
//   answer fails
//   vote fails
//   new round works iff there are >= 3 players, state transition to awaiting answers

// finished:
//   join fails
//   leave works
//   answer fails
//   vote fails
//   new round fails
