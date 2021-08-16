module.exports = (client, channel, user, message, streamer) => {
  const msg = message.toLowerCase().split(' ');
  const userBan = msg[1];
  const reason = msg[2];

  if (user.mod || user.username.toLowerCase() === streamer) {
    return client.ban(channel, userBan, reason)
      .then(data => client.say(channel, `@${data[1]} banned for ${data[2]}`))
      .catch(err => client.say(channel, 'command has failed try again'));
  }

  return client.say(channel, `@${user.username} You are not a mod in here`);
}