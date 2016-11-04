var moment = require('moment');

//Get pen data from storage.
var getData = function (controller, channel, callback) {
    controller.storage.channels.get(channel, function (err, storage) {
        if (!storage || !storage.data) {
            callback(null, []);
        } else {
            callback(null, storage.data);
        }
    });
}

//Save pen data to storage
var saveData = function (controller, channel, newEntry, callback) {

    getData(controller, channel, function (err, storedData) {
        if (err) {
            callback(err);
        } else {
            storedData.push(newEntry);
            controller.storage.channels.save({
                id: channel,
                data: storedData
            }, function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
        }
    });

}

//Get the latest pen status.
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

module.exports.saveData = saveData;
module.exports.getStatus = getStatus;
