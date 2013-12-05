var Game = require('../game.js');

// game verbs: join, leave, answer (a black card), vote (for a white card), new round
// game states: pre-start, awaiting answers, awaiting vote, awaiting new round, finished

// pre-start:
//   join works iff game is not full
//   leave works
//   answer fails
//   vote fails
//   new round works iff there are >= 3 players, state transition to awaiting answers

// awaiting answers:
//   join works - player becomes non-czar and can submit answer for active round
//   leave works:
//     if player is card czar, round is discarded;
//     behavior if player count is now < 3 tbd
//   answer works iff the answering player isn't the card czar and hasn't answered
//   vote fails
//   new round fails

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
