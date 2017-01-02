var http = require('http');
var cheerio = require('cheerio');

var day = process.argv[2];
var classType = process.argv[3];
var location = process.argv[4];

var locations = {
  "Midlothian": 80,
  "Chester": 81,
  "Colonial Heights": 82,
  "Fredericksburg": 83,
  "Mechanicsville": 84,
  "Swift Creek": 85,
  "Short Pump": 86,
  "Williamsburg": 87,
  "Virginia Center Commons": 88
}

var classTypes = {
  "Power": 6404
}


var getLocationData = function(query) {
  var locId = locations[query.location];
  var classType = classTypes[query.classType];

  var data = {n:78, c:80, _date:query.day, addDays:0, cat:0, d:-1, LocationID:locId, ClassID:classType, ns:0, oldD:-1, StudioID:0};

  var post_data = JSON.stringify(data);

  var post_options = {
       host: 'ws.motionvibe.com',
       port: '80',
       path: '/ScheduleLoaderService.asmx/GetNetworkSchedule',
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
           'Content-Length': post_data.length
       }
   };

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
            getClassJSON(decoded, query).then(function(classes) {
              resolve(classes);
            },function(error){
              console.log("this error " + error.stack)
            });
          }
        });

        res.on('error', function(e) {
          console.log("adasdas")
           reject('error:' + e.message);
        });


      });
      // post the data
      post_request.write(post_data);
      post_request.end();
    });
}


var getClassJSON = function(html, query) {
  return new Promise(function(resolve, reject) {
    $ = cheerio.load(html);

    var classList = [];
    var classes = $('div.MVmobileSite #tdClass div.MVbigLabel,div.MVmediumLabel').not('#MVdivEventNameTab');

    classes.each(function(i, myClass) {
      var val = $(myClass).text();
      var isTime = $(myClass).hasClass('MVbigLabel');

      var toParse = isTime ? parseTime : parseInstr;

      var theClass = toParse(val, classList, query);

      if (theClass) {
        theClass.location = query.location;
        theClass.class = query.classType;
      }
    });
    resolve(classList);
  })

}

var parseTime = function(val, list) {
  var obj = {};
  obj.time = val;
  list.push(obj);

  return obj;
}

var parseInstr = function(val, list) {
  obj = list.slice(-1)[0];
  obj.instructor = val;

  return null;
}

if (location != null) {
  var query = {
    day: day,
    location: location,
    classType: classType
  }

  getLocationData(query).then(function(classes) {
    console.log(classes)
  }, function(error) {
    console.log(error)
  });
} else {

  var calls = [];
  var masterList = [];
  for (var loc in locations) {
    var query = {
      day: day,
      location: loc,
      classType: classType
    };

    calls.push(getLocationData(query));
  }
  Promise.all(calls).then(function(list) {
    list.forEach(function(classes) {
      masterList = classes.reduce(function (coll, item) {
          coll.push(item);
          return coll;
      }, masterList)
    },function(error) {
      console.log("error? " + error)
    });

    masterList.sort(function(a, b) {
      var timeA = a.time.split(' ');
      var timeB = b.time.split(' ');

      if (timeA[1] == 'AM' && timeB[1] == 'PM') return -1;
      else if (timeA[1] == 'PM' && timeB[1] == 'AM') return 1;
      else {
        var hourA = timeA[0].split(':');
        var hourB = timeB[0].split(':');

        if (hourA[0] == "12") hourA[0] = "0";
        if (hourB[0] == "12") hourB[0] = "0";

        if (parseInt(hourA[0]) < parseInt(hourB[0])) return -1;
        else if (parseInt(hourA[0]) > parseInt(hourB[0])) return 1;
        else {
          if (hourA[1] == "00") hourA[1] = "0";
          if (hourB[1] == "00") hourB[1] = "0";

          if (parseInt(hourA[1]) < parseInt(hourB[1])) return -1;
          else if (parseInt(hourA[1]) > parseInt(hourB[1])) return 1;
          else return a.location.localeCompare(b.location);
        }
      }
    })

    console.log(masterList);
  });
}
