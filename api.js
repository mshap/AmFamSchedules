var http = require('http');
var utils = require('./util');

var getLocationData = function(query) {
  var locId = utils.getLocationId(query.location);
  var classType = utils.getClassTypeId(query.classType);

  var data = {n:78, c:80, _date:query.day, addDays:0, cat:0, d:-1, LocationID:locId, ClassID:classType, ns:0, oldD:-1, StudioID:0};

  var post_data = JSON.stringify(data);
  var post_options = utils.getAPIOptions(post_data);

    return new Promise(function(resolve, reject) {
        var post_request = http.request(post_options, function(res) {

        var body = '';

        res.on('data', function(chunk)  {
            body += chunk;
        });

        res.on('end', function() {
          var decoded = JSON.parse(body).d;

          if (decoded == null) {
            reject({
              "response": body,
              "data": data
            });
          } else {
            utils.getClasses(decoded, query).then(function(classes) {
              resolve(classes);
            },function(error){
              console.log("this error " + error.stack)
            });
          }
        });

        res.on('error', function(e) {
           reject('error:' + e.message);
        });


      });
      // post the data
      post_request.write(post_data);
      post_request.end();
    });
}

var getCallList = function(location, day, classType) {
  var queries = [];

  if (location != null) {
    queries.push({
        day: day,
        location: location,
        classType: classType
      });
  } else {
    for (var loc in utils.getLocations()) {
      queries.push({
        day: day,
        location: loc,
        classType: classType
      });
    }
  }

  var calls = [];

  for (var x in queries) {
    calls.push(getLocationData(queries[x]));
  }

  return calls;
}

var getSchedules = function(location, day, classType) {
  return new Promise(function(resolve, reject) {
    var calls = getCallList(location, day, classType);
    var masterList = [];

    Promise.all(calls).then(function(list) {
      list.forEach(function(classes) {
        masterList = classes.reduce(function (coll, item) {
            coll.push(item);
            return coll;
        }, masterList)
      },function(error) {
        console.log("error? " + error)
      });

      masterList.sort(utils.sort)

      resolve(masterList);
    }).catch( function(error) {console.log(error)});
  });
}

module.exports = {
  getSchedules: getSchedules
}
