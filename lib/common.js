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

module.exports.getData = getData;
