var cheerio = require('cheerio');
var config = require('./config.json');

var sort = function(a, b) {
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
}

var getClassJSON = function(html, query) {
  return new Promise(function(resolve, reject) {
    $ = cheerio.load(html);

    var classList = [];
    var classes = $('div.MVmobileSite #tdClass div.MVbigLabel,div.MVmediumLabel').not('#MVdivEventNameTab');

    classes.each(function(i, myClass) {
      var toParse = $(myClass).hasClass('MVbigLabel') ? parseTime : parseInstr;
      var theClass = toParse( $(myClass).text(), classList, query);

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

var getToday = function() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();

    if(dd<10) {
        dd='0'+dd
    }

    if(mm<10) {
        mm='0'+mm
    }

    return mm+'/'+dd+'/'+yyyy;
}

module.exports = {
  sort: sort,
  getToday: getToday,
  getClasses: getClassJSON,
  getLocationId:
    function(locationName) {
      return config.locations[locationName.toLowerCase()];
    },
  getLocations:
    function() { return config.locations; },
  getClassTypeId:
    function(className) {
      return config.classTypes[className.toLowerCase()];
    },
  getAPIOptions:
    function(data) {
      return post_options = {
           host: config.api.host,
           port: '80',
           path: config.api.path,
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Content-Length': data.length
           }
       };
    }
}
