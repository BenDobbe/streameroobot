const fetch = require('node-fetch');

module.exports = (client, channel, user) => {
  let streamer = channel.slice(1)
  return fetch(`https://decapi.me/twitch/uptime?channel=${streamer}`)
    .then(res => res.text())
    .then(text => client.say(channel, `${text}`))
    .catch(() => client.say(channel, 'did not work D:'));
}