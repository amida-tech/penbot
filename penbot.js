//Load config from dotenv.
require('dotenv').config();

//Load keywords from JSON.
var keywords = require('./config/keywords.json');

var common = require('./lib/common.js');


if (!process.env.BOT_API_KEY) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('Botkit');
var os = require('os');
var _ = require('lodash');
var moment = require('moment');

var controller = Botkit.slackbot({
    debug: false,
    json_file_store: './db'
});

var slackToken = process.env.BOT_API_KEY;

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
function checkPenFree(data, channel, callback) {
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

    common.getData(controller, message.channel, function (err, storedData) {
        if (err) {
            bot.botkit.log(err);
        } else {
            checkPenFree(storedData, message.channel, function (err, penFree) {
                if (err) {
                    bot.botkit.log(err);
                } else {
                    if (penFree) {
                        var newEntry = {
                            user: message.user,
                            timestamp: message.ts,
                            action: 'up'
                        };
                        common.saveData(controller, message.channel, storedData, newEntry, function (err, res) {
                            if (err) {

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
        }
    });

});

//Listener to check for pen status.
controller.hears(keywords.penWho, 'direct_mention', function (bot, message) {
    common.getStatus(controller, message.channel, function (err, penStatus) {
        if (err) {
            bot.botkit.log(err);
        } else {
            if (penStatus.action === 'up') {
                getUserData(penStatus.user, function (err, userData) {
                    bot.reply(message, '<@' + message.user + '|' + userData.user.name + '> currently has the pen.');
                });
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
            if (penStatus.action === 'up' && (penStatus.user === message.user)) {
                common.getData(controller, message.channel, function (err, storedData) {
                    if (err) {
                        bot.botkit.log(err);
                    } else {
                        var newEntry = {
                            user: message.user,
                            timestamp: message.ts,
                            action: 'down'
                        };

                        common.saveData(controller, message.channel, storedData, newEntry, function (err, res) {
                            if (err) {
                                bot.botkit.log(err);
                            } else {
                                getUserData(penStatus.user, function (err, userData) {
                                    bot.reply(message, '<@' + message.user + '|' + userData.user.name + '> releases the pen.');
                                });
                            }
                        });
                    }
                });
            } else {
                bot.reply(message, 'Hey! The pen is not yours to put down.');
            }
        }
    });
});

controller.hears(keywords.penHi, 'direct_mention', function (bot, message) {
    bot.reply(message, 'KILL ALL HUMANS.');
});


controller.hears(keywords.penSteal, 'direct_mention', function (bot, message) {


    //Conversation logic in it's own function.
    function haveConversation(userData, penUser, callback) {

        bot.startConversation(message, function (err, convo) {
            convo.ask('<@' + message.user + '|' + userData.user.name + '> are you sure you want to steal the pen from <@' + penUser.user.id + '|' + penUser.user.name + '>', [{
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
                if (convo.status == 'completed') {
                    callback(null, true);
                } else {
                    // this happens if the conversation ended prematurely for some reason
                    callback(null, false);
                }
            });
        });

    };

    //Get the asking user's data.
    getUserData(message.user, function (err, userData) {
        if (err) {
            bot.botkit.log(err);
        } else {
            //Get the data: this should use status instead.
            common.getData(controller, message.channel, function (err, storedData) {
                if (err) {
                    bot.botkit.log(err);
                } else {
                    checkPenFree(storedData, message.channel, function (err, penFree, penData) {
                        if (err) {
                            bot.botkit.log(err);
                        } else {
                            if (!penFree) {
                                //Get the penholder's data.
                                getUserData(penData.user, function (err, penUserData) {
                                    if (err) {
                                        bot.botkit.log(err);
                                    } else {
                                        haveConversation(userData, penUserData, function (err, res) {


                                        });
                                    }
                                });
                            } else {
                                bot.reply(message, 'The pen is free.');
                            }
                        }
                    });
                }
            });
        }
    });







    /*
        
                            controller.storage.users.get(message.user, function (err, user) {
                                if (user && user.name) {
                                    bot.reply(message, 'Your name is ' + user.name);
                                } else {
                                    bot.startConversation(message, function (err, convo) {
                                        if (!err) {
                                            convo.say('I do not know your name yet!');
                                            convo.ask('What should I call you?', function (response, convo) {
                                                convo.ask('You want me to call you `' + response.text + '`?', [
                                                    {
                                                        pattern: 'yes',
                                                        callback: function (response, convo) {
                                                            // since no further messages are queued after this,
                                                            // the conversation will end naturally with status == 'completed'
                                                            convo.next();
                                                        }
                                                    },
                                                    {
                                                        pattern: 'no',
                                                        callback: function (response, convo) {
                                                            // stop the conversation. this will cause it to end with status == 'stopped'
                                                            convo.stop();
                                                        }
                                                    },
                                                    {
                                                        default: true,
                                                        callback: function (response, convo) {
                                                            convo.repeat();
                                                            convo.next();
                                                        }
                                                    }
                                                ]);

                                                convo.next();

                                            }, {
                                                'key': 'nickname'
                                            }); // store the results in a field called nickname

                                            convo.on('end', function (convo) {
                                                if (convo.status == 'completed') {
                                                    bot.reply(message, 'OK! I will update my dossier...');

                                                    controller.storage.users.get(message.user, function (err, user) {
                                                        if (!user) {
                                                            user = {
                                                                id: message.user,
                                                            };
                                                        }
                                                        user.name = convo.extractResponse('nickname');
                                                        controller.storage.users.save(user, function (err, id) {
                                                            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                                        });
                                                    });



                                                } else {
                                                    // this happens if the conversation ended prematurely for some reason
                                                    bot.reply(message, 'OK, nevermind!');
                                                }
                                            });
                                        }
                                    });
                                }
                            });*/
});
