//https://www.reddit.com/r/showerthoughts/top.json?sort=top&t=week&limit=100
var request = require('request');

function getOne(callback) {

    //Set a ten second timeout
    request('https://www.reddit.com/r/showerthoughts/top.json?sort=top&t=week&limit=10', {
        timeout: 1000
    }, function (err, response, body) {

        if (err) {
            callback(err);
        } else {
            var responseJSON = JSON.parse(body);
            var thoughtList = responseJSON.data.children;
            var random = Math.floor(Math.random() * 10);
            var randomThought = "\"" + thoughtList[random].data.title + "\"  -" + thoughtList[random].data.author;

            if (randomThought.length > 0) {
                callback(null, randomThought);
            } else {
                callback(true);
            }
        }
    });
}

module.exports.getOne = getOne;
