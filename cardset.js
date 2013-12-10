var crypto = require('crypto'),
    fs = require('fs'),
    _ = require('underscore');

function makeWhiteCardId(setId, index, inline) {
  return setId + ':w:' + index;
}

function normalizeWhiteCard(setId, index, obj) {
  var result = null;

  if (_(obj).isString()) {
    result = { inline: obj };
  } else {
    result = obj;
  }

  // if we don't have a unique id, generate one
  if (!result.id) {
    result.id = makeWhiteCardId(setId, index, obj.inline);
  }

  // if we don't have a "card form", generate it from the inline form; sentence-case, add final period
  if (!result.card) {
    var card = obj;
    card = card[0].toUpperCase() + card.substr(1);
    card += '.';

    result.card = card;
  }

  return result;
}

function makeBlackCardId(setId, index, card) {
  return setId + ':k:' + index;
}

function normalizeBlackCard(setId, index, obj) {
  // TODO: replace _+ with something that we turn into a pretty underline/drag target on the client

  var result = null;

  if (_(obj).isString()) {
    result = { card: obj };
  } else {
    result = obj;
  }

  // if we don't have a unique id, generate one
  if (!result.id) {
    result.id = makeBlackCardId(setId, index, obj.card);
  }
  
  // if we don't have a "finished form", generate it from the card form; replace blanks with white-card insertion points
  if (!result.finished) {
    var index = 0;
    var previous;
    var finished = obj;
    
    // detect arity: count number of _+ matches
    // generate finished form: replace _+ matches with mustaches for white cards
    do {
      previous = finished;
      finished = previous.replace(/_+/, '{{card[' + index + ']}}');
    } while (previous != finished && ++index);

    if (index == 0)
    {
      // we didn't replace any underscores with mustaches; implicit arity is 1
      result.arity = 1;
    } else {
      // we replaced (index) underscores with mustaches
      result.arity = index;
    }

    result.finished = finished;
  }

  return result;
}

module.exports = (function () {
  function Cardset(path) {
    var json = fs.readFileSync(path, { encoding: 'utf8' }),
        o = JSON.parse(json);

    this.name = o['name'];
    this.description = o['description'];
    this.copyright = o['copyright'];

    this.locale = o['lang'];

    var setKey = this.name + '|' + this.description;
    var shasum = crypto.createHash('sha1');
    shasum.update(setKey, 'utf8');

    var setId = shasum.digest('hex');

    this.blackCards = _(o['black_cards']).map(function (card, index, list) {
      return normalizeBlackCard(setId, index, card);
    });
    this.whiteCards = _(o['white_cards']).map(function (card, index, list) {
      return normalizeWhiteCard(setId, index, card);
    });
  }

  return Cardset;
})();
