module.exports = (client, channel, user, streamer) => {
  if (user.mod || user.username.toLowerCase() === streamer) {
    client.clear(channel);

    return client.say(
      channel,
      `@${user.username} asked me to clear the chat!
    `);
  }

  return client.say(
    channel,
    `@${user.username} you aren't a mod`
  );
};