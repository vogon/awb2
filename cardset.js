var fs = require('fs'),
    _ = require('underscore');

function normalizeWhiteCard(obj) {
  // if obj is a string:
  //   inline form = obj
  //   generate card form:
  //     sentence-case
  //     add period to the end
  // else:
  //   return obj

  if (typeof obj.valueOf() == 'string') {
    var result = {};

    result.inline = obj;
    
    var card = obj;
    card = card[0].toUpperCase() + card.substr(1);
    card += '.';

    result.card = card;

    return result;
  } else {
    return obj;
  }
}

function normalizeBlackCard(obj) {
  // TODO: replace _+ with something that we turn into a pretty underline/drag target on the client

  var result = {};

  if (typeof obj.valueOf() == 'string') {
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

    result.card = obj;
    result.finished = finished;
  } else {
    result = obj;
  }

  return result;
}

module.exports = (function () {
  function Cardset(path) {
    var json = fs.readFileSync(path, { encoding: "utf8" }),
        o = JSON.parse(json);

    this.name = o['name'];
    this.description = o['description'];
    this.copyright = o['copyright'];

    this.locale = o['lang'];

    this.blackCards = _(o['black_cards']).map(normalizeBlackCard);
    this.whiteCards = _(o['white_cards']).map(normalizeWhiteCard);
  }

  return Cardset;
})();
