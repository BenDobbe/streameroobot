// bot commands
const hello = require('./hello');
const ban = require('./ban');
const clear = require('./clear');
const dice = require('./dice');
const social = require('./social');
const uptime = require('./uptime');
const followage = require('./followage');

// bot owner
let streamer, socials;

// commands export
module.exports = [
  {
    cmd: 'hello',
    description: 'Saying hello to someone :)',
    func: (client, channel, user) => hello(
      client,
      channel,
      user
    )
  },
  {
    cmd: 'dice',
    description: 'Roll a dice',
    func: (client, channel, user) => dice(
      client,
      channel,
      user
    )
  },
  {
    cmd: 'ban',
    description: 'Ban someone',
    func: (client, channel, user, message) => ban(
      client,
      channel,
      user,
      message,
      streamer
    )
  },
  {
    cmd: 'clear',
    description: 'Empty the chat!',
    func: (client, channel, user) => clear(
      client,
      channel,
      user,
      streamer
    )
  },
  {
    cmd: 'social',
    description: 'Socials',
    func: (client, channel) => social(
      client,
      channel,
      socials
    )
  },
  {
    cmd: 'uptime',
    description: 'Check how long the stream has been up',
    func: (channel, client, streamer) => uptime(
      channel,
      client,
      streamer
    )
  },
  {
    cmd: 'followage',
    description: 'Check your followage',
    func: (client, channel, user) => followage(
      client,
      channel,
      user
    )
  },
]