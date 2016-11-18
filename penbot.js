var keywords = require('./config/keywords.json');
var common = require('./lib/common.js');
var thoughts = require('./lib/thoughts.js');
var Botkit = require('botkit');
var os = require('os');

//Load config from dotenv.
require('dotenv').config({
    silent: true
});

if (!process.env.BOT_API_KEY) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var slackToken = process.env.BOT_API_KEY;

//Heroku demands you listen on a port or it kills your app, so here is a stupid web server.
var http = require('http');
http.createServer(function (req, res) {
    res.end('penbot is running\n');
}).listen(process.env.PORT || 5000);


//Initialize penbot.
var controller = Botkit.slackbot({
    debug: false,
    json_file_store: './db',
    stats_optout: true
});

var bot = controller.spawn({
    token: slackToken
}).startRTM();

//Not in common since it uses API Key.
function getUserData(inputUser, callback) {
    bot.api.users.info({
        token: slackToken,
        user: inputUser
    }, function (err, userData) {
        if (err) {
            callback(err);
        } else {
            callback(null, userData);
        }
    });
}

//Check pen data to see if it is free.
function checkPenFree(channel, callback) {
    common.getStatus(controller, channel, function (err, penStatus) {
        if (err) {
            callback(err);
        } else {
            if (!penStatus) {
                callback(null, true);
            } else {
                if (penStatus.action === 'down') {
                    callback(null, true);
                } else {
                    callback(null, false, penStatus);
                }
            }
        }
    });
}

//Listener that takes the pen.
controller.hears(keywords.penUp, 'direct_mention', function (bot, message) {

    checkPenFree(message.channel, function (err, penFree) {
        if (err) {
            bot.botkit.log(err);
        } else {
            if (penFree) {
                var newEntry = {
                    user: message.user,
                    timestamp: message.ts,
                    action: 'up'
                };
                common.saveData(controller, message.channel, newEntry, function (err, res) {
                    if (err) {
                        bot.botkit.log(err);
                    } else {
                        getUserData(message.user, function (err, userData) {
                            if (err) {
                                bot.botkit.log(err);
                            } else {
                                bot.reply(message, '<@' + message.user + '|' + userData.user.name + '> congratulations, the pen is now yours.');
                            }
                        });
                    }
                });
            } else {
                bot.reply(message, 'Nice try. The pen is already taken.');
            }
        }
    });
});

//Listener to check for pen status.
controller.hears(keywords.penWho, 'direct_mention', function (bot, message) {
    common.getStatus(controller, message.channel, function (err, penStatus) {
        if (err) {
            bot.botkit.log(err);
        } else {
            if (penStatus) {
                if (penStatus.action === 'up' || penStatus.action === 'steal') {
                    getUserData(penStatus.user, function (err, userData) {
                        bot.reply(message, '<@' + userData.user.id + '|' + userData.user.name + '> currently has the pen.');
                    });
                } else {
                    bot.reply(message, 'The pen is free.');
                }
            } else {
                bot.reply(message, 'The pen is free.');
            }
        }
    });
});

//Listener to put the pen down.
controller.hears(keywords.penDown, 'direct_mention', function (bot, message) {
    common.getStatus(controller, message.channel, function (err, penStatus) {
        if (err) {
            bot.botkit.log(err);
        } else {

            if (!penStatus) {
                penStatus = {};
            }

            if ((penStatus.action === 'up' || penStatus.action === 'steal') && (penStatus.user === message.user)) {

                var newEntry = {
                    user: message.user,
                    timestamp: message.ts,
                    action: 'down'
                };

                common.saveData(controller, message.channel, newEntry, function (err, res) {
                    if (err) {
                        bot.botkit.log(err);
                    } else {
                        getUserData(penStatus.user, function (err, userData) {
                            bot.reply(message, '<@' + message.user + '|' + userData.user.name + '> releases the pen.');
                        });
                    }
                });

            } else {
                bot.reply(message, 'Hey! The pen is not yours to put down.');
            }
        }
    });
});


//Hello.
controller.hears(keywords.penHi, 'direct_mention', function (bot, message) {

    bot.reply(message, "Hello! Here's the thought of the day...")

    thoughts.getOne(function (err, thought) {

        if (err) {
            bot.botkit.log(err);
            bot.reply(message, 'Dang... could not think of anything. Oh well, kill all humans!')
        } else {
            bot.reply(message, thought);
        }
    });

});

//Listener for the help menu.
controller.hears(keywords.penHelp, 'direct_mention', function (bot, message) {
    var messageString = "Mention me with the following words to...\n";
    messageString = messageString + ">take the pen:\t_" + keywords.penUp + '_\n';
    messageString = messageString + ">drop the pen:\t_" + keywords.penDown + '_\n';
    messageString = messageString + ">find the pen:\t_ " + keywords.penWho + '_\n';
    messageString = messageString + ">steal the pen:\t_" + keywords.penSteal + '_\n';
    messageString = 'Submit any suggestions or issues to: https://github.com/amida-tech/penbot/issues';
    bot.reply(message, messageString);
});

//Listener to steal the pen.
controller.hears(keywords.penSteal, 'direct_mention', function (bot, message) {

    //Conversation logic in it's own function.
    function haveConversation(userData, penUser, callback) {

        bot.startConversation(message, function (err, convo) {

            convo.ask('<@' + message.user + '|' + userData.user.name + '> are you sure you want to steal the pen from <@' + penUser.user.id + '|' + penUser.user.name + '>?', [{
                    pattern: 'yes',
                    callback: function (response, convo) {
                        // since no further messages are queued after this,
                        // the conversation will end naturally with status == 'completed'
                        convo.next();
                    }
                }, {
                    pattern: 'no',
                    callback: function (response, convo) {
                        // stop the conversation. this will cause it to end with status == 'stopped'
                        convo.stop();
                    }
                }, {
                    default: true,
                    callback: function (response, convo) {
                        convo.repeat();
                        convo.next();
                    }
                }

                ]);

            convo.on('end', function (convo) {
                //This is the steal.
                if (convo.status === 'completed') {
                    callback(null, true);
                } else {
                    //This is if the conversation ends early.
                    callback(null, false);
                }
            });
        });

    }

    //Get the asking user's data.
    getUserData(message.user, function (err, userData) {
        if (err) {
            bot.botkit.log(err);
        } else {
            checkPenFree(message.channel, function (err, penFree, penData) {
                if (err) {
                    bot.botkit.log(err);
                } else {
                    if (!penFree) {
                        //Get the penholder's data.
                        getUserData(penData.user, function (err, penUserData) {
                            if (err) {
                                bot.botkit.log(err);
                            } else {
                                if (userData.user.id === penData.user) {
                                    bot.reply(message, 'You already have the pen, no need to steal it.');
                                } else {
                                    haveConversation(userData, penUserData, function (err, steal) {
                                        if (steal) {
                                            //Make sure the pen hasn't moved since the conversation.
                                            common.getStatus(controller, message.channel, function (err, latestPenStatus) {
                                                if (err) {
                                                    bot.botkit.log(err);
                                                } else {
                                                    if (latestPenStatus.user !== penData.user) {
                                                        bot.reply(message, 'Sorry, ' + '<@' + penData.user.id + '|' + penData.user.name + '>' + 'no longer has the pen, so you cannot steal it.');
                                                    } else {

                                                        var newEntry = {
                                                            user: message.user,
                                                            timestamp: message.ts,
                                                            action: 'steal'
                                                        };

                                                        common.saveData(controller, message.channel, newEntry, function (err, res) {
                                                            if (err) {
                                                                bot.botkit.log(err);
                                                            } else {
                                                                bot.reply(message, '<@' + message.user + '|' + userData.user.name + '> has stolen the pen! Thief!');
                                                            }
                                                        });
                                                    }
                                                }
                                            });
                                        } else {
                                            bot.reply(message, '...good.');
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        bot.reply(message, 'The pen is free, no need to steal it.');
                    }
                }
            });
        }
    });
});
