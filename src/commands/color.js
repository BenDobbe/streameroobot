module.exports = (client, channel, user, message) => {
  const msgSplited = message.toLowerCase().split(' ');
  const color = msgSplited[1];

  return client.color(color)
    .then(data => true)
    .catch(err => client.say(
      channel,
      'something went wrong while I changed color ...'
    ));
}