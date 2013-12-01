if (typeof exports == 'undefined') {
  var exports = this['common'] = {};
}

exports.ROOM_CREATE = 'newroom';
exports.ROOM_YOU_ENTERED = 'youjoined';
exports.ROOM_OTHER_ENTERED = 'otherjoined';
exports.ROOM_SEND_CHAT = 'sendchat';
exports.ROOM_CHAT_RECEIVED = 'chatrcvd';