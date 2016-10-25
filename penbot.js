var Bot = require('slackbots');

//Load config from dotenv.
require('dotenv').config();


// create a bot
var settings = {
    token: process.env.BOT_API_KEY,
    name: process.env.BOT_NAME
};
var bot = new Bot(settings);


var startupMessage = 'Penbot lives!';


bot.on('start', function () {

    //post a message to youself to prove you are alive.
    bot.postMessageToChannel('penzone', startupMessage);
});

bot.on('message', function (data) {
    // all ingoing events https://api.slack.com/rtm 
    console.log(data);
    console.log(data.type);

    //if its a message.
    if (data.type === 'message') {
        //if (data.text = startupMessage) {
        //    console.log(data);
        //}



        //var currentChannel = bot.getChannelId(data.channel);
        //console.log(currentChannel);

        //get the channel, then post to that channel.

        //console.log(botUser);

        console.log(data);


    }


});
