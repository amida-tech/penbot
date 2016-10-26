//Load config from dotenv.
require('dotenv').config();

if (!process.env.BOT_API_KEY) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('Botkit');
var os = require('os');

var controller = Botkit.slackbot({
    debug: false,
    json_file_store: './db'
});

var slackToken = process.env.BOT_API_KEY;

var bot = controller.spawn({
    token: slackToken
}).startRTM();



//Take the pen.
controller.hears(['me'], 'direct_mention', function (bot, message) {

    console.log(message);

    //Get stored channel data to see if the pen is somewhere.
    controller.storage.channels.get(message.channel, function (err, channelData) {

        //console.log('Channel Data:', channelData);

        controller.storage.channels.save({
            id: message.channel,
            timestamp: message.ts,
            user: message.user,
            action: 'up'
        }, function (err) {

            if (err) {
                console.error(err);
            } else {

                //Get user info.
                bot.api.users.info({
                    token: slackToken,
                    user: message.user
                }, function (err, userData) {
                    if (err) {
                        console.error(err);
                    } else {
                        bot.reply(message, 'The pen is yours <@' + message.user + '|' + userData.user.name + '>');
                    }
                });




            }


        });



        /*
        //If no data or pen nowhere.
        if (!channelData) {
            //Make message user penmaster.
            controller.storage.channels.save({
                id: message.channel,
                penMaster: message.user
            }, function (err) {
                //write all out for debug.
                //controller.storage.channels.all(function (err, all_channel_data) {
                //    console.log(all_channel_data);
                //});

                controller.storage.channels.get(message.channel, function (err, all_channel_data) {
                    console.log(all_channel_data);
                });


                bot.reply(message, 'You are now the penmaster');
            });
        }*/
    });
});

//Handle where is pen requests.
controller.hears(['who'], 'direct_mention', function (bot, message) {


    //Need to use channel storage.

    //controller.storage.channels.save({id: message.channel, foo:'bar'}, function(err) { ... });
    //controller.storage.channels.get(id, function(err, channel_data) {...});

    console.log(message);

    controller.storage.channels.all(function (err, all_channel_data) {
        console.log(all_channel_data);

    });

    controller.storage.channels.get(message.channel, function (err, channelData) {

        // console.log(channelData);

    });


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

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function (bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function (err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function (err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
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


controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function (bot, message) {

    bot.startConversation(message, function (err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function (response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function () {
                        process.exit();
                    }, 3000);
                }
            },
            {
                pattern: bot.utterances.no,
                default: true,
                callback: function (response, convo) {
                    convo.say('*Phew!*');
                    convo.next();
                }
        }
        ]);
    });
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention',
    function (bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
            '>. I have been running for ' + uptime + ' on ' + hostname + '.');

    });

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
