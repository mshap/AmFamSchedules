var api = require('./amfam/api');

var day = process.argv[2];
var classType = process.argv[3];
var location = process.argv[4];

var call = location == undefined ? api.getAllSchedules : api.getScheduleByLocation;


call(day, classType, location).then(function(classes) {
  console.log(classes)
},function(error) {
  console.log(error)
});
