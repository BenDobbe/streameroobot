const tmi = require("tmi.js")
require('dotenv').config()
//const papa = require('papaparse')
const fs = require('fs')
const OBSWebSocket = require('obs-websocket-js')
const request = require("request")

// Global variables to store csv data upon initiation
var obsScenes = []
var obsFullData = []
let commandPrefix = '!'

const options = {
	options: { debug: true },
	connection: {
    reconnect: true,
    secure: true,
    timeout: 180000,
    reconnectDecay: 1.4,
    reconnectInterval: 1000,
	},
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ]
}

const {Pool} = require('pg')
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, 
  host: process.env.DB_HOST,
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
})

// variables to use
let defaultPoints = 500;
var predictionState = false;
var currentPrediction = "No current prediction running";
var streamer = "bendobbe"


// twitch client instance
const client = new tmi.client(options)
// connect to twitch API
client.connect().catch(console.error);

// command list
const list = require('./commands/list')
// chat expressions module
const expressions = require('./modules/expressions')
//const { triggerAsyncId } = require("async_hooks")

let informationalcommands


// Events

client.on('chat', (channel, user, message, self) => {
  if (self) return

  // expressions module init
  expressions(client, channel, message)

  const messageSplited = message.toLowerCase().split(' ')
  const cmd = messageSplited[0]

  for (let item of list) {
    if (cmd === `!${item.cmd}`) {
      item.func(client, channel, user, message)
    }
  }

  /*for (let command of commands) {
    if (message.toLowerCase() === command.commandName) {
      client.say(channel, `/me ${command.commandText}`)
    }
  }*/

  if (message.toLowerCase() === '!help') {
    let str = []

    for (let item of list) {
      str.push(`cmd: !${item.cmd} - description: ${item.description} | `)
    }

    client.say(channel, str.join(' '))
  }

  if (message.toLowerCase() === "!testcsv") {
    testcsv(channel)
  }

  if (message.toLowerCase() === "!points") {
    points(channel, user)
  }

  if (message.toLowerCase() === '!ranking') {
    ranking(channel, user)
  }

  if (message.toLowerCase() === '!leaderbord') {
    leaderbord(channel, user)
  }

  if(message.toLowerCase().includes('!givepoints')){   
    givepoints(channel, user, message)
    return;
  }

  if(message.toLowerCase().includes("!coinflip")){
    coinFlip(channel, user, message)
    return;  
  }

  if(message.toLowerCase().includes('!openprediction')){
    openprediction(channel,user,message)
  }

  if(message.toLowerCase().includes('!closeprediction')){
    closeprediction(channel,user)
  }

  if(message.toLowerCase().includes('!payoutbelievers')){
    payoutbelievers(channel,user)
    return;
  }

  if(message.toLowerCase().includes('!payoutdoubters')){
    payoutdoubters(channel,user)
    return;
  }

  if(message.toLowerCase().includes('!believe')){ 
    believe(channel,message,user)
    return;
  }

  if(message.toLowerCase().includes('!doubt')){
    doubt(channel,message,user)
    return;
  }  

  if(message.toLowerCase().includes('!clearprediction')){
    clearprediction(channel, user)
    return;
  }  

  if(message.toLowerCase().includes("!currentprediction")){
    currentprediction(channel)
  }

  if(message.toLowerCase().includes("!addcommand")){
    addcommand(channel, user, message)
  }

  if(message.toLowerCase().includes("!editcommand")){
    editcommand(channel, user, message)
  }

  if(message.toLowerCase().includes("!deletecommand")){
    deletecommand(channel, user, message)
  }

  if(message.toLowerCase().includes("!snowflake")){
    snowflake(channel, user, message)
  }

  if(message.toLowerCase().includes("!overlay")){
    overlay(channel, user, message)
  }

});

client.on('hosted', (channel, username, viewers, autohost) => {
  onHostedHandler(channel, username, viewers, autohost)
})

client.on('subscription', (channel, username, method, message, userstate) => {
  onSubscriptionHandler(channel, username, method, message, userstate)
})

client.on('raided', (channel, username, viewers) => {
  onRaidedHandler(channel, username, viewers)
})

client.on('cheer', (channel, userstate, message) => {
  onCheerHandler(channel, userstate, message)
})

client.on('giftpaidupgrade', (channel, username, sender, userstate) => {
  onGiftPaidUpgradeHandler(channel, username, sender, userstate)
})

client.on('hosting', (channel, target, viewers) => {
  onHostingHandler(channel, target, viewers)
})

client.on('reconnect', () => {
  reconnectHandler()
})

client.on('resub', (channel, username, months, message, userstate, methods) => {
  resubHandler(channel, username, months, message, userstate, methods)
})

client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
  subGiftHandler(channel, username, streakMonths, recipient, methods, userstate)
})

client.on('message', (target, context, message, self, user) => {
  onMessageHandler(target, context, message, self, user)
})

client.on('connected', (addr, port) => {
  onConnectedHandler(addr, port)
})

client.on('disconnected', (addr, port) => {
  onDisconnectedHandler(addr, port)
})

// Handlers

function onHostedHandler (channel, username, viewers, autohost) {
  client.say(channel,
    `Thank you @${username} for the host of ${viewers}!`
  )
}

function onRaidedHandler(channel, username, viewers) {
  client.say(channel,
    `Thank you @${username} for the raid of ${viewers}!`
  )
}

function onSubscriptionHandler(channel, username, methods, message, userstate) {
  client.say(channel,
    `Thank you @${username} for subscribing!`
  )
}

function onCheerHandler(channel, userstate, message)  {
  client.say(channel,
    `Thank you @${userstate.username} for the ${userstate.bits} bits!`
  )
}

function onGiftPaidUpgradeHandler(channel, username, sender, userstate) {
  client.say(channel,
    `Thank you @${username} for continuing your gifted sub!`
  )
}

function onHostingHandler(channel, target, viewers) {
  client.say(channel,
    `We are now hosting ${target} with ${viewers} viewers!`
  )
}

function reconnectHandler () {
  console.log('Reconnecting...')
}

function resubHandler(channel, username, months, message, userstate, methods) {
  const cumulativeMonths = userstate['message-param-cumulative-months']
  client.say(channel,
    `Thank you @${username} for the ${cumulativeMonths} sub!`
  )
}

function subGiftHandler(channel, username, streakMonths, recipient, methods, userstate) {
  const senderCount =  ~~userstate["message-param-sender-count"];
  client.say(channel,
    `Thank you @${username} for gifting a sub to ${recipient}}.`
  )
  client.say(channel,
    `${username} has gifted ${senderCount} subs!`
  )
}

// OBS overlay trigger functions

/*const file = fs.createReadStream('data.csv');
var count = 0; // cache the running count
papa.parse(file, {
    worker: true, // Don't bog down the main thread if its a big file
    header: true,
    dynamicTyping: true,
    complete: function(results) {
        obsFullData = results
        console.log('parsing complete read', count, 'records.'); 
    }
});*/

// Function to read csv which returns a promise so you can do async / await.


// Reads a file in the same directory
function readData() {
  var text1 = fs.readFileSync('data.csv', 'utf8');
  processCSV(text1, obsScenes)
}

// Processes a csv into "lines" variable by splitting
function processCSV(csvText, lines) {
  csvText = csvText + '' // Makes csvText a string
  var csvTextLines = csvText.split(/\r\n|\n/); // Splits lines by rows
  var headers = csvTextLines[0].split(','); // Splits the first row by commas as header
  // Split remaining data and assigns associated headers with them
  for (var i=1; i<csvTextLines.length; i++) {
    var data = csvTextLines[i].split(',');
    if (data.length == headers.length) {
        var tarr = []
        for (var j=0; j<headers.length; j++) {
            tarr.push([headers[j],data[j]])
        }
        lines.push(tarr)
    }
  }
}

// Execute data reading and storage
readData()

console.log(obsScenes)

// Create a client with credential specified options
//const client = new tmi.client(options);
const obs = new OBSWebSocket()

obs.connect() // Connect to OBS
.then(() => {
    console.log(`Success! We're connected & authenticated to OBS.`)
    return obs.send('GetSceneList')
})
.then(data => {
    console.log(data.scenes)
    console.log(`${data.scenes.length} Available Scenes!`)
})
.catch(err => {
    console.log(err)
});

// Global variables for functions
var coolingdown = false;
var subonly = false;
var sourceName = null;
var sceneName = null;
var timeS = null;

// Called every time a message comes in
async function onMessageHandler (target, context, message, self) {
  // Remove whitespace from chat message and take the first word
  var msg = message + '';
  const commandName = msg.trim().split(' ')[0];

  commandsQuery = await pool.query("SELECT commandname, commandtext FROM commands")
  informationalcommands = commandsQuery.rows

  informationalcommands.forEach(function (arrayItem) {
    if (arrayItem.commandname == commandName) {
      client.say(target, arrayItem.commandtext)
    }
  });

  if (coolingdown === true && commandName == obsScenes[i][4][1]) {    // If cooling down, keep monitoring chat but do not respond
    console.log('cooling down...')
    client.say(target, `/me is cooling down, wait to use another overlay command HYPERS`)
    return; 
  }

  else {
    if (self) { return; } // Ignore messages from the bot

    var subbed = context.subscriber;  // Variable to check if message is from a subscriber
    
    // Toggle submode if channel owner or moderator
    if (context.username === `${options.channels[0].split("#").pop()}` || context.mod === true) {
      if (commandName === '!submode') {
        submode(target, context, message, self)
        return;
      }
    }

    // If sub mode is enabled and chatter is not a sub, then return.
    if (subonly && !subbed) {
      return;
    }
    //else {   
    try {
      for (i=0; i < obsScenes.length - 1; i++) {
        // If command name in chat matches and it is not a channel point redemption
          if (commandName == obsScenes[i][4][1] && obsScenes[i][3][1] == 'FALSE') {
            const { rows } = await resultsDB("Select points from points where username = '" + context.username + "';")
            sourceName = obsScenes[i][1][1]
            sceneName = obsScenes[i][0][1]
            timeS = (parseFloat(obsScenes[i][2][1])); // Change string duration to a float

            switch (sourceName) {
              case 'Kame':
                if (rows[0].points > 20000) {
                  activateScene(commandName, sourceName, sceneName); // Enable source visibility
                  coolingdown = true;   // Sets a cooldown variable to true
                  setTimeout(cooldown, timeS*1000);  // Resets cooldown to false and disables visibility after a set timeout
                  pool.query("UPDATE points set Points = Points - 20000 where Username "  + " = '" + context.username + "';", (err, res)=>{
                    console.log(err, res)
                  })
                } else {
                  client.say(channel,`@${context.username} You don't have enough points to enable this overlay`)
                }
                break;

              case 'Ayaya':
                if (rows[0].points > 20000) {
                  activateScene(commandName, sourceName, sceneName); // Enable source visibility
                  coolingdown = true;   // Sets a cooldown variable to true
                  setTimeout(cooldown, timeS*1000);  // Resets cooldown to false and disables visibility after a set timeout
                  pool.query("UPDATE points set Points = Points - 20000 where Username "  + " = '" + context.username + "';", (err, res)=>{
                    console.log(err, res)
                  })
                } else {
                  client.say(channel,`@${context.username} You don't have enough points to enable this overlay`)
                }
                break;
              case 'spintowin':
                  if (rows[0].points > 100000) {
                    activateScene(commandName, sourceName, sceneName); // Enable source visibility
                    coolingdown = true;   // Sets a cooldown variable to true
                    setTimeout(cooldown, timeS*1000);  // Resets cooldown to false and disables visibility after a set timeout
                    pool.query("UPDATE points set Points = Points - 20000 where Username "  + " = '" + context.username + "';", (err, res)=>{
                      console.log(err, res)
                    })
                    pool.query("INSERT INTO overlaydata(username, amountpoints, overlayname)values('" + context.username + "',10000, '" + sourceName + "')", (err, res)=>{
                      console.log(err, res)
                     })
                  } else {
                    client.say(channel,`@${context.username} You don't have enough points to enable this overlay`)
                  }
                  break;
              case 'dance':
                    if (rows[0].points > 50000) {
                      activateScene(commandName, sourceName, sceneName); // Enable source visibility
                      coolingdown = true;   // Sets a cooldown variable to true
                      setTimeout(cooldown, timeS*1000);  // Resets cooldown to false and disables visibility after a set timeout
                      pool.query("UPDATE points set Points = Points - 50000 where Username "  + " = '" + context.username + "';", (err, res)=>{
                        console.log(err, res)
                      })
                    } else {
                      client.say(channel,`@${context.username} You don't have enough points to enable this overlay`)
                    }
                    break;
                    case 'bass':
                      if (rows[0].points > 10000) {
                        activateScene(commandName, sourceName, sceneName); // Enable source visibility
                        coolingdown = true;   // Sets a cooldown variable to true
                        setTimeout(cooldown, timeS*1000);  // Resets cooldown to false and disables visibility after a set timeout
                        pool.query("UPDATE points set Points = Points - 10000 where Username "  + " = '" + context.username + "';", (err, res)=>{
                          console.log(err, res)
                        })
                      } else {
                        client.say(channel,`@${context.username} You don't have enough points to enable this overlay`)
                      }
                      break;
                  case 'clap':
                    if (rows[0].points > 10000) {
                      activateScene(commandName, sourceName, sceneName); // Enable source visibility
                      coolingdown = true;   // Sets a cooldown variable to true
                      setTimeout(cooldown, timeS*1000);  // Resets cooldown to false and disables visibility after a set timeout
                      pool.query("UPDATE points set Points = Points - 10000 where Username "  + " = '" + context.username + "';", (err, res)=>{
                        console.log(err, res)
                      })
                    } else {
                      client.say(channel,`@${context.username} You don't have enough points to enable this overlay`)
                    }
                    break;
                  case 'badumtss':
                    if (rows[0].points > 10000) {
                      activateScene(commandName, sourceName, sceneName); // Enable source visibility
                      coolingdown = true;   // Sets a cooldown variable to true
                      setTimeout(cooldown, timeS*1000);  // Resets cooldown to false and disables visibility after a set timeout
                      pool.query("UPDATE points set Points = Points - 10000 where Username "  + " = '" + context.username + "';", (err, res)=>{
                        console.log(err, res)
                      })
                    } else {
                      client.say(channel,`@${context.username} You don't have enough points to enable this overlay`)
                    }
                    break;  
                  case 'believers':
                      activateScene(commandName, sourceName, sceneName); // Enable source visibility
                      coolingdown = true;   // Sets a cooldown variable to true
                      setTimeout(cooldown, timeS*1000);  // Resets cooldown to false and disables visibility after a set timeout
                    break; 
                    case 'doubters':
                      activateScene(commandName, sourceName, sceneName); // Enable source visibility
                      coolingdown = true;   // Sets a cooldown variable to true
                      setTimeout(cooldown, timeS*1000);  // Resets cooldown to false and disables visibility after a set timeout
                    break; 
                                     
              default:
                break;
            }
          } else {

          }
      }
    } catch (error) {
      
    } 
    //}
    //console.log(`* Unknown command ${commandName}`);
  }
}

function isEmptyObject(obj) {
  return Object.entries(obj).length === 0;
}


/**
 * Get the current viewers
 * Add them to database
 * If they already are in the database add points to them for staying in the channel
 */
 let url = "http://tmi.twitch.tv/group/user/bendobbe/chatters";

 let jsonOptions = {json: true}
 
 request(url, jsonOptions, (error, res, body) => {
     if (error) {
         return  console.log(error)
     };
 
     if (!error && res.statusCode == 200) {
      setTimer0 = setInterval(function(){
        let viewers = body.chatters.viewers
        console.log(viewers)
          viewers.forEach(databaseAdd);
          async function databaseAdd(value) {
            try {
            const { rows } = await resultsDB("Select username from points where username = '" + value + "';")
              if ( isEmptyObject(rows) === true) {
                pool.query("INSERT INTO points(username, points)values('" + value + "'," + defaultPoints + ")", (err, res)=>{
                 console.log(err, res)
                })
              } else {
                pool.query("UPDATE points set points = points + 1000 where username" + " = '" + value + "';", (err, res)=>{
                  console.log(err, res)
                })
              }
            } catch (err) {
              console.log('Database ' + err)
            }
          }
      },30 * 1000,(0))
     };
 });

// commands

/**
 * !testcsv
 * @param {*} channel 
 * @param {*} user 
 */
async function testcsv(channel) {
  try {
    client.say(channel, "csv data: " + obsFullData.data[1])
    console.log(obsFullData.data[1].Scene)
  } catch (error) {
    
  }
}

/**
 * !points
 * 
 * Command that performs a query aganist the database for getting the points of a single user
 * If they don't have any points, it adds them to the database
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
 * @param {Contains information about the user} user 
 */
 async function points(channel, user){
  console.log("Your points:")
  try {
    const { rows } = await resultsDB("Select Points from points where Username = '" + user.username + "';")
    let value
    if ( isEmptyObject(rows) === true) {
      pool.query("INSERT INTO points(username, points)values('" + user.username + "'," + defaultPoints + ")", (err, res)=>{
        console.log(err, res);
      })
      client.say(channel,`@${user.username} points: `+ defaultPoints)
    } else {
      value = JSON.stringify(rows[0].points)
      client.say(channel,`@${user.username} points: `+ value)
    }
  } catch (err) {
    console.log('Database ' + err)
  }
}

/**
 * !ranking
 * @param {*} channel 
 * @param {*} user 
 */
async function ranking(channel, user) {
  try {
    const getTotalUsers = await pool.query('SELECT COUNT(points) FROM points')
    const getRanking = await pool.query("WITH CTE AS (SELECT row_number() over(order by points DESC) As rownumber, * from points) select * from CTE where username = '" + user.username + "';")
    client.say(channel,`@${user.username} ranking: ${getRanking.rows[0].rownumber} / ${getTotalUsers.rows[0].count}`)
  } catch (error) {
    console.log('Database ' + error)
  }
}

/**
 * !leaderbord
 * @param {} channel 
 * @param {*} user 
 * @param {*} message 
 */
 async function leaderbord(channel, user) {
  try {
    const getRanking = await pool.query("WITH CTE AS (SELECT row_number() over(order by points DESC) As rownumber, * from points) select * from CTE where username = '" + user.username + "' LIMIT 5;")
    client.say(channel,`/me ranking: 1 ${getRanking.rows[0].username} | 2 ${getRanking.rows[1].username} | 3 ${getRanking.rows[2].username} | 4 ${getRanking.rows[3].username} | 5 ${getRanking.rows[4].username}`)
  } catch (error) {
    console.log('Database ' + error)
  }
}

/**
 * !givepoints
 * 
 * This method performs a query aganist the database,
 * and returns how many points are in the database for the user.
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
 * @param {Contains information about the user} user 
 */
 async function givepoints(channel, user, message){
  let isMod = user.mod || user['user-type'] === 'mod'
  let isBroadcaster = channel.slice(1) === user.username;
  let isModUp = isMod || isBroadcaster
  try {
    if(isModUp) {
      var messageSplited = message.toLowerCase().split(' ')
      var usr = messageSplited[1]
      var pointsAdd = messageSplited[2]
      //console.log(usr);
      /*var query = "UPDATE points set Points = Points + " + pointsAdd + " where Username "  + " = '" + usr + "';";
      await connectToDB(query);*/
      const { rows } = await resultsDB("Select username from points where username = '" + usr + "';")
      if ( isEmptyObject(rows) === true) {
        pool.query("INSERT INTO points(username, points)values('" + usr + "'," + defaultPoints + " + " + pointsAdd + ")", (err, res)=>{
         console.log(err, res)
        })
      } else {
        pool.query("UPDATE points set Points = Points + " + pointsAdd + " where Username "  + " = '" + usr + "';", (err, res)=>{
          console.log(err, res)
        })
      }
      client.say(channel,`@${usr} points added: `+ pointsAdd)
    } else {
      client.say(channel, `@${user.username} you are not a mod Madge`)
    }
  } catch (error) {
    console.log('Database ' + error)
  }
}

/**
 * !coinflip xxx where xxx represents a number
 * 
 * When the user inputs !coinflip and a number
 * a 50/50 occurs if they win they get the points if they lose 
 * they los the points
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
 * @param {Contains information about the user} user 
 * @param {*} message 
 */
 async function coinFlip(channel, user, message){
  console.log("Create CoinFlip Query")
  try {
    var messageSplited = message.toLowerCase().split(' ')
    var pointsToGamble = messageSplited[1]
    const { rows } = await resultsDB("SELECT Points FROM Twitchpoints WHERE username = '" + user.username + "' ;")

    if (pointsToGamble === 'all') {
      var number = Math.round(Math.random())
    
        if (number<0.5){
          client.say(channel,`@${user.username}, You lost ${rows[0].points} points`);
          pool.query("UPDATE points set points = points - " + rows[0].points + " WHERE username "  + " = '" + user.username + "';", (err, res)=>{
            console.log(err, res)
          })
        }
    
        else{
          client.say(channel,`@${user.username}, You won ${rows[0].points} points`);
          pool.query("UPDATE points set points = points + " + rows[0].points + " WHERE username " + " = '" + user.username + "';", (err, res)=>{
            console.log(err, res)
          })
        }
    }

    if ( typeof pointsToGamble === 'undefined' ) {
      client.say(channel, `@${user.username} please add a value to the command such as !coinflip 5000 or use all to gamble everything!`);  
    } else {
      if (parseInt(rows[0].points) < parseInt(pointsToGamble)) {
        client.say(channel, `@${user.username}, You don't have enough points to do a coinflip`);   
      }
      else {
        var number = Math.round(Math.random())
    
        if (number<0.5){
          client.say(channel,`@${user.username}, You lost ${pointsToGamble} points`);
          pool.query("UPDATE points set points = points - " + pointsToGamble + " WHERE username "  + " = '" + user.username + "';", (err, res)=>{
            console.log(err, res)
          })
        }
    
        else{
          client.say(channel,`@${user.username}, You won ${pointsToGamble} points`);
          pool.query("UPDATE points set points = points + " + pointsToGamble + " WHERE username " + " = '" + user.username + "';", (err, res)=>{
            console.log(err, res)
          })
        }
      }
    }
  } catch (error) {
    
  }
  
}

/**
 * !payoutbelievers 
 * 
 * Performs two queries to get the total number for the bets for each catagory.
 * Caculates the percentage payout each person gets.
 * Pays out group 1 for the bets
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
 * @param {Contains information about the user} user  
 */
 async function payoutbelievers(channel,user){ 
  let isMod = user.mod || user['user-type'] === 'mod'
  let isBroadcaster = channel.slice(1) === user.username
  let isModUp = isMod || isBroadcaster
  try {
    if(isModUp && predictionState === true){
      const getPointsBelievers = await pool.query("SELECT SUM(gamblepoints) FROM points WHERE predictionstate = 1;")
      let pointsBelievers = getPointsBelievers.rows[0].sum
      const getPointsDoubters = await pool.query("SELECT SUM(gamblepoints) FROM points WHERE predictionstate = 2;")
      let pointsDoubters = getPointsDoubters.rows[0].sum
      if ( isNaN(pointsDoubters) || pointsDoubters === 0){
        pool.query("UPDATE points set Points = Points + gamblepoints WHERE predictionstate = 1;", (err, res)=>{
          console.log(err, res)
        })
      } else {
        pool.query(`UPDATE points set points = points + gamblepoints + (${pointsDoubters} * (gamblepoints / ${pointsBelievers})) WHERE predictionstate = 1;`, (err, res)=>{
          console.log(err, res)
        })
        pool.query("UPDATE points set predictionstate = 0;", (err, res)=>{
          console.log(err, res)
        })
        pool.query("UPDATE points set gamblepoints = 0;", (err, res)=>{
          console.log(err, res)
        })
        closeprediction(channel,user)
      }
      } 
    else{
      client.say(channel, `@${user.username}, You can't use this command Madge`)
    }
  } catch (error) {
    
  }
}  

/**
 * !payoutdoubters
 * 
 * Performs two queries to get the total number for the bets for each catagory.
 * Caculates the percentage payout each person gets.
 * Pays out group 2 for the bets
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
 * @param {Contains information about the user} user 
 */
 async function payoutdoubters(channel,user){
  let isMod = user.mod || user['user-type'] === 'mod'
  let isBroadcaster = channel.slice(1) === user.username
  let isModUp = isMod || isBroadcaster

  try {
    if(isModUp && predictionState==true){
      const getPointsBelievers = await pool.query("SELECT SUM(gamblepoints) from points where predictionstate = 1;")
      let pointsBelievers = getPointsBelievers.rows[0].sum
      const getPointsDoubters = await pool.query("SELECT SUM(gamblepoints) from points where predictionstate = 2;")
      let pointsDoubters = getPointsDoubters.rows[0].sum
      if ( isNaN(pointsBelievers) || pointsBelievers === 0){
        pool.query("UPDATE points set points = points + gamblepoints where predictionstate = 2;", (err, res)=>{
          console.log(err, res)
        })
      } else {
        pool.query(`UPDATE points set points = points + gamblepoints + (${pointsDoubters} * (gamblepoints / ${pointsBelievers})) WHERE predictionstate = 2;`, (err, res)=>{
          console.log(err, res)
        })
        pool.query("UPDATE points set predictionstate = 0;", (err, res)=>{
          console.log(err, res)
        })
        pool.query("UPDATE points set gamblepoints = 0;", (err, res)=>{
          console.log(err, res)
        })
        closeprediction(channel,user)
      }
    }
    else{
      client.say(channel, `@${user.username}, You can't use this command Madge`)
    }
  } catch (error) {
    
  }
}

/**
 * !believe xxx where xxx represents some number
 * 
 * When the user enters !wager xxx where x represents a query is excute which 
 * removes points from the bank of the user and puts them into the wager of the user
 * it then changes betNumber to 1.
 * 
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
 * @param {Contains the users message} message 
 * @param {Contains information about the user} user 
 */
 async function believe(channel, message, user){
   try {
    if( predictionState === true ){
      var messUser = message.split(" ")
      var messageUser = messUser[1]
      const predictionCheck = await pool.query("SELECT predictionstate FROM points WHERE username = '" + user.username + "';")
      const points = await pool.query("SELECT points FROM points WHERE username = '" + user.username + "';")
      if (predictionCheck.rows[0].predictionstate === 0 || points.rows[0].points >= messageUser) {
        pool.query("UPDATE points set predictionstate = 1 WHERE username = '" + user.username + "';", (err, res)=>{
          console.log(err, res);
        })
        pool.query("UPDATE points set points = points - " + messageUser + " WHERE username = '" + user.username + "';", (err, res)=>{
          console.log(err, res);
        })
        pool.query("UPDATE points set gamblepoints = gamblepoints + " + messageUser+ " WHERE username = '" + user.username + "';", (err, res)=>{
          console.log(err, res);
        })
      } else {
        client.say(channel, `@${user.username}, You already predicted or don't have enough points Madge `)
      }
    }
    else{
      client.say(channel, `@${user.username}, Predictions are currently closed right now, try doing a coinflip`)
    }
   } catch (error) {
     
   }
}

/**
 * !doubt xxx where xxx represents some number
 * 
 * When the user enters !wager xxx where x represents a query is excute which 
 * removes points from the bank of the user and puts them into the wager of the user
 * it then changes betNumber to 2.
 * 
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
 * @param {Contains the users message} message 
 * @param {Contains information about the user} user  
 */
 async function doubt(channel, message, user){
   try {
    if( predictionState == true ){
      var messUser = message.split(" ")
      var messageUser = messUser[1]
      const predictionCheck = await pool.query("SELECT predictionstate from points WHERE username = '" + user.username + "';")
      const points = await pool.query("SELECT points from points WHERE username = '" + user.username + "';")
      if (predictionCheck.rows[0].predictionstate === 0 || points.rows[0].points >= messageUser) {
        pool.query("UPDATE points set predictionstate = 2 WHERE username = '"+ user.username + "';", (err, res)=>{
          console.log(err, res)
        })
        pool.query("UPDATE points set points = points - " + messageUser + " WHERE username = '" + user.username + "';", (err, res)=>{
          console.log(err, res)
        })
        pool.query("UPDATE points set gamblepoints = gamblepoints + " + messageUser + " WHERE username = '"+ user.username + "';", (err, res)=>{
          console.log(err, res)
        })
      } else {
        client.say(channel, `@${user.username}, You already predicted or don't have enough points Madge`)
      }
    }
    else{
      client.say(channel, `@${user.username}, Predictions are currently closed right now, try doing a coinflip`)
    }
   } catch (error) {
     
   }
}

/**
 * !openprediction
 * Starting the prediction making people able to gamble their points
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
 * @param {Contains information about the user} user 
 * @param {*} message
 */
 function openprediction(channel,user,message){
  let isMod = user.mod || user['user-type'] === 'mod'
  let isBroadcaster = channel.slice(1) === user.username
  let isModUp = isMod || isBroadcaster

  if(isModUp){
    predictionState = true;
    currentPrediction = message.replace("!openprediction","")
    client.say(channel,"The predictions is now running: " + currentPrediction)
  }
  else{
    client.say(channel, `@${user.username}, You can not start predictions`)
  }
}

/**
 * !closeprediction
 * Closing the prediction 
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
 * @param {Contains information about the user} user 
 */
 function closeprediction(channel, user){
  let isMod = user.mod || user['user-type'] === 'mod'
  let isBroadcaster = channel.slice(1) === user.username
  let isModUp = isMod || isBroadcaster

  if(isModUp){ 
    predictionState = false;
    currentPrediction = "No more predictions"
    client.say(channel,"Bets are now closed")
  }
  else{
    client.say(channel, `@${user.username} You can not use this command`)
  }
}

/**
 * !clearprediction
 * 
 * This method should be run if there was every an error when creating the bets,
 * or if you need to clear the wager section or bet number.
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
 * @param {Contains information about the user} user 
 */
 async function clearprediction(channel, user){
  let isMod = user.mod || user['user-type'] === 'mod'
  let isBroadcaster = channel.slice(1) === user.username
  let isModUp = isMod || isBroadcaster

  if (isModUp) {
    try {
      pool.query("UPDATE points Set points = points + gamblepoints;", (err, res)=>{
        console.log(err, res)
      })
      pool.query("UPDATE points Set gamblepoints = 0;", (err, res)=>{
        console.log(err, res)
      })
      pool.query("UPDATE points Set predictionstate = 0;", (err, res)=>{
        console.log(err, res)
      })
     } catch (error) {
       
     }
  } else {
    client.say(channel, `@${user.username} You can not use this command`)
  }
}

/**
 * !currentprediction
 * 
 * This method returns the value currently assigned 
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
 */
 function currentprediction(channel){
  client.say(channel,"The Current Bet is: " + currentPrediction );
}

// CRUD Operations for adding informational commands

/** 
 * !addcommand
 * 
 * add a command to the database
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
*/
async function addcommand(channel, user, message) {
  try {
    let isMod = user.mod || user['user-type'] === 'mod'
    let isBroadcaster = channel.slice(1) === user.username
    let isModUp = isMod || isBroadcaster

    if (isModUp) {
      let messageSplited = message.toLowerCase().split(' ')
      let newcommandName = '!' + messageSplited[1]
      let commandText = message.split(' ').slice(2).join(' ')

      pool.query("INSERT INTO commands(commandname, commandtext)values('" + newcommandName + "', '" + commandText + "')", (err, res)=>{
        console.log(err, res)
      })

      informationalcommands = await pool.query("SELECT commandName, commandText FROM commands")

      client.say(channel, `/me command ${newcommandName} has been created!`)
    } else {
      client.say(channel,"You are not a moderator Madge")
    }
  } catch (error) {
    console.log(error)
  }
}

/** 
 * !editcommand
 * 
 * edit a command
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
*/
async function editcommand(channel, user, message) {
  try {
    let isMod = user.mod || user['user-type'] === 'mod'
    let isBroadcaster = channel.slice(1) === user.username
    let isModUp = isMod || isBroadcaster

    if (isModUp) {
      let messageSplited = message.toLowerCase().split(' ')
      let newcommandName = '!' + messageSplited[1]
      let commandText = message.split(' ').slice(2).join(' ')

      pool.query("UPDATE commands SET commandText = '" + commandText + "' WHERE commandname = '" + newcommandName + "';", (err, res)=>{
        console.log(err, res)
      })

      informationalcommands = await pool.query("SELECT commandname, commandtext from commands")

      client.say(channel, `/me command ${newcommandName} has been edited!`); 
    } else {
      client.say(channel,"You are not a moderator Madge")
    }
  } catch (error) {
    console.log(error)
  }
}

/** 
 * !deletecommand
 * 
 * delete a command
 * @param {Channel communications. Mainly for saying things in the chat with the bot} channel 
*/
async function deletecommand(channel, user, message) {
  try {
    let isMod = user.mod || user['user-type'] === 'mod'
    let isBroadcaster = channel.slice(1) === user.username
    let isModUp = isMod || isBroadcaster

    if (isModUp) {
      let messageSplited = message.toLowerCase().split(' ')
      let commandName = '!' + messageSplited[1]

      pool.query("DELETE FROM commands USING commandname WHERE commandname = '" + commandName + "';", (err, res)=>{
        console.log(err, res)
      })

      informationalcommands = await pool.query("SELECT commandname, commandtext from commands")

       client.say(channel, `/me command ${commandName} has been deleted!`)
    } else {
      client.say(channel,"You are not a moderator Madge")
    }
  } catch (error) {
    console.log(error)
  }
}

async function snowflake(channel, user, message) {
  let msg = message.split(' ').slice(1).join(' ')
  commandName = '!snowflake'
  sourceName = 'snowflake'
  sceneName = 'OBS OVERLAYS'
  const tekstData = `${user.username},
  ${msg}`
  
    fs.writeFile('./src/snowflake.txt', tekstData,'utf-8', err => {
      if (err) {
          console.log('Error writing file', err)
      } else {
          console.log('Successfully wrote file')
      }
    })

    setTimeout(function() {
      activateScene(commandName, sourceName, sceneName); // Enable source visibility
      coolingdown = true;   // Sets a cooldown variable to true
      setTimeout(cooldown, 12*1000);  // Resets cooldown to false and disables visibility after a set timeout
  }, 1500);

}

async function overlay(channel, user, message) {
  const msgCommand = message.trim().split(' ')[0]
  const obsoverlay = message.trim().split(' ')[1]
  console.log(msgCommand)
  console.log(obsoverlay)
  
  try {
    const { rows } = await resultsDB(`SELECT * FROM obscenes`)
    console.log(rows.length)
    for (i = 0; i < rows.length; i++) {
      sourceName = rows[i].sourcename
      commandName = msgCommand
      sceneName = rows[i].scenename
      timeS = (parseFloat(rows[i].duration));

      if (obsoverlay === sourceName) {
        activateScene(commandName, sourceName, sceneName)
        coolingdown = true;   // Sets a cooldown variable to true
        setTimeout(cooldown, timeS*1000);  // Resets cooldown to false and disables visibility after a set timeout

        client.say(channel, "Overlay activated")
      }
    }
    
  } catch (error) {
    
  }

}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  client.say(options.channels[0],'/me is now running.')
  for (i=0; i < obsScenes.length - 1; i++) {
    sourceName = obsScenes[i][1][1]
    sceneName = obsScenes[i][0][1]
    deactivateScene(sourceName, sceneName); // Enable source visibility
  }

  console.log(`* Connected from ${addr}:${port}`);
}

function onDisconnectedHandler (addr, port) {
  setTimeout(cooldown)
  console.log(`* Disconnected from ${addr}:${port}`);
}

// Cooldown function that resets the cooldown and resets invisibility of sources
function cooldown() {
  coolingdown = false;  // Reset global variable coolingdown to false
  obs.send('GetSceneList')
  .then(data => {
    obs.send('SetSceneItemRender', {
      source: sourceName,
      render: false,          // Disable visibility
      "scene-name": sceneName
    });
  })
}

// Function to enable the OBS source visibility
function activateScene(commandName, sourceName, sceneName){
    obs.send('GetSceneList')
    .then(data => {
        obs.send('SetSceneItemRender', {
        source: sourceName,
        render: true,           // Enable visibility
        "scene-name": sceneName
      })
    })
    .catch(err => {
      console.log(err)
    });
    console.log(`* Executed ${commandName} command`);
}

// When starting the bot make sure the visibility is off
function deactivateScene(sourceName, sceneName){
  obs.send('GetSceneList').then(data => {
      obs.send('SetSceneItemRender', {
      source: sourceName,
      render: false,           // Enable visibility
      "scene-name": sceneName
    })
  })
  .catch(err => {
    console.log(err)
  });
}

// Function to enable sub-only mode for chatbot recognition
function submode(target, context, message, self, commandName){
  subonly = !subonly; // Boolean toggle
  var mode;
  if (subonly === true) {
    mode = 'sub only'
  }
  else {
    mode = 'free for all'
  }
  client.say(target, `/me this channel is in ${mode} mode.`) // Message the chat room
  .catch(err => {
    console.log(err)
  });
}

async function commands(informationalcommands) {
  try {
    informationalcommands = await resultsDB("SELECT commandName, commandText FROM commands")

    return
  } catch (error) {
    
  }
}


/**
 * This method is excuted if a query needs to return results.
 * @param {*} q 
 * @returns 
 */
 async function resultsDB(q){
  const clnt = await pool.connect()
  let res
  try{
    await clnt.query("BEGIN")
    console.log("Connected Successfully");
    try {
      res = await clnt.query(q)
      await clnt.query("COMMIT")
    } catch (err) {
      await clnt.query('ROLLBACK')
      throw err
    }
    /*const {rows} = clnt.query(query2);
    console.log(rows[0]);  
    var queryedData = JSON.stringify(rows[0]);
    if (typeof queryedData === 'undefined') {
      var amount = null
    } else {
      var amount = queryedData.replace(/[^\d.-]/g, '');
    }
    return amount; */
  }
  /*catch(ex){
    console.log(ex);
  }*/
  finally{
    clnt.release()
    console.log("Client Disconnected")
  }
  return res
}

/**
 * This method runs Updates and Inserts. 
 *  * @param {*} query2 
 */
async function connectToDB(query2){

  try{
   console.log("Attempting to do query")
    pool.query(query2,(err,res)=>{
    })
    console.log("Connection Ended")

  }
  catch(err){
    console.log(channel,err)
  }

}
