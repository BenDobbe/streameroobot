const fetch = require('node-fetch');

module.exports = (client, channel, user) => {
  let usr = user.username
  let streamer = channel.slice(1)
  if (usr === streamer) {
    client.say(channel, 'You are the streamer Madge')
  } else {
    return fetch(`https://api.2g.be/twitch/followage/${streamer}/${usr}?format=mwdhms`)
    .then(res => res.text())
    .then(text => client.say(channel, text))
    .catch(() => client.say(channel, 'could not see how long you were following peepoSad'));
  }
}