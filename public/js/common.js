if (typeof exports == 'undefined') {
  var exports = this['common'] = {};
}

exports.CHANGE_NAME = 'nick';
exports.YOU_CHANGED_NAME = 'younick';
exports.OTHER_CHANGED_NAME = 'othernick';
exports.ROOM_CREATE = 'newroom';
exports.ROOM_YOU_ENTERED = 'youjoined';
exports.ROOM_OTHER_ENTERED = 'otherjoined';
exports.ROOM_SEND_CHAT = 'sendchat';
exports.ROOM_CHAT_RECEIVED = 'chatrcvd';