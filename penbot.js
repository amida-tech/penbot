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

//Listener that takes the pen.
controller.hears(keywords.penUp, 'direct_mention', function (bot, message) {

    //Check pen data to see if it is free.
    function checkPenFree(data, callback) {
        common.getStatus(controller, message.channel, function (err, penStatus) {
            if (!penStatus) {
                callback(null, false);
            } else {
                if (penStatus.action === 'down') {
                    callback(null, true);
                } else {
                    callback(null, false);
                }
            }
        });
    }

    common.getData(controller, message.channel, function (err, storedData) {
        if (err) {
            console.error(err);
        } else {
            checkPenFree(storedData, function (err, penFree) {
                if (err) {
                    console.error(err);
                } else {
                    if (penFree) {
                        var newEntry = {
                            user: message.user,
                            timestamp: message.ts,
                            action: 'up'
                        };
                        common.saveData(controller, message.channel, storedData, newEntry, function (err, res) {
                            getUserData(message.user, function (err, userData) {
                                bot.reply(message, '<@' + message.user + '|' + userData.user.name + '> congratulations, the pen is now yours.');
                            });
                        });
                    } else {
                        bot.reply(message, 'Nice try. The pen is already taken.');
                    }
                }
            });
        }
    });

});

//Handle where is pen requests.
controller.hears(keywords.penWho, 'direct_mention', function (bot, message) {


    common.getStatus(controller, message.channel, function (err, penStatus) {

        console.log(penStatus);

        if (penStatus.action === 'up') {

            getUserData(penStatus.user, function (err, userData) {
                bot.reply(message, '<@' + message.user + '|' + userData.user.name + '> currently has the pen.');
            });
        } else {
            bot.reply(message, 'The pen is free.');
        }

    });

    /*bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function (err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });

    controller.storage.users.get(message.user, function (err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello.');
        }
    });*/
});

controller.hears(keywords.penDown, 'direct_mention', function (bot, message) {

    var messageUser = message.user;

    common.getStatus(controller, message.channel, function (err, penStatus) {

        if (penStatus.action === 'up' && (penStatus.user === message.user)) {
            common.getData(controller, message.channel, function (err, storedData) {
                if (err) {
                    console.log(err);
                } else {

                    var newEntry = {
                        user: message.user,
                        timestamp: message.ts,
                        action: 'down'
                    };

                    common.saveData(controller, message.channel, storedData, newEntry, function (err, res) {
                        getUserData(penStatus.user, function (err, userData) {
                            bot.reply(message, '<@' + message.user + '|' + userData.user.name + '> releases the pen.');
                        });
                    });
                }
            });




        } else {
            bot.reply(message, 'The pen is not yours to put down.');
        }

    });


});

/*---Examples below---*/

controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function (bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function (err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });


    controller.storage.users.get(message.user, function (err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello.');
        }
    });
});



controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function (bot, message) {

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
    });
});
