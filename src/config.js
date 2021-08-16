let username, password, channels;

// export the bot options module
module.exports = {
  options: {
    debug: true
  },
  connection: {
    reconnect: true
  },
  identity: {
    username: username,
    password: password
  },
  channels: channels
};