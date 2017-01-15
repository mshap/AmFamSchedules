var api = require('./api');

var day = process.argv[2];
var classType = process.argv[3];
var location = process.argv[4];

api.getSchedules(location, day, classType).then(function(classes) {
  console.log(classes)
});
