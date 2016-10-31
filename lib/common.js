var moment = require('moment');

//Get pen data from storage.
var getData = function (controller, channel, callback) {
    controller.storage.channels.get(channel, function (err, storage) {

        console.log('storage', storage);

        if (!storage || !storage.data) {
            callback(null, []);
        } else {
            callback(null, storage.data);
        }
    });
}

//Get the latest pen status entry.
var getStatus = function (controller, channel, callback) {

    getData(controller, channel, function (err, penData) {

        function sortOrder(a, b) {
            //Need to split these on the '.', and take the first half to convert.
            var momentA = moment(a.timestamp.split('.')[0], "X");
            var momentB = moment(b.timestamp.split('.')[0], "X");
            //console.log(momentA.format());
            //console.log(momentB.format());
            if (momentA.isBefore(momentB)) {
                return 1;
            } else {
                return -1;
            }
        }

        var sortedData = penData.sort(sortOrder);
        var currentEntry = sortedData[0];
        callback(null, currentEntry);

    });
}


module.exports.getData = getData;
module.exports.getStatus = getStatus;
