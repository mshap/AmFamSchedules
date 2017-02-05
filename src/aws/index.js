/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
        http://aws.amazon.com/apache2.0/
    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Hello World to say hello"
 *  Alexa: "Hello World!"
 */

/**
 * App ID for the skill
 */
var APP_ID = "amzn1.ask.skill.caabd54f-c137-4a09-a704-7e243da5bedc";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var amfam      = require('../amfam/api');

/**
 * HelloWorld is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var GymClassHelper = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
GymClassHelper.prototype = Object.create(AlexaSkill.prototype);
GymClassHelper.prototype.constructor = GymClassHelper;

GymClassHelper.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
  console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
      + ", sessionId=" + session.sessionId);
};

GymClassHelper.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId=" + launchRequest.requestId
      + ", sessionId=" + session.sessionId);

    var speechOutput = "Welcome to gym class helper.  You can ask for class schedules by locations, or for class schedules on a date. How may I assist you today?"
    var repromptText = "How may I assist you today?";
    response.ask(speechOutput, repromptText);
};

GymClassHelper.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
      + ", sessionId=" + session.sessionId);

};

GymClassHelper.prototype.intentHandlers = {
    // register custom intent handlers
    "GetAllSchedules": function (intent, session, response) {
        executeAPI(amfam.getAllSchedules(session.attributes.date, session.attributes.class), session.attributes, response);
    },
    "GetSchedulesLocationToday": function (intent, session, response) {
        executeAPI(amfam.getTodaysScheduleByLocation(session.attributes.class, session.attributes.gym), session.attributes, response);
    },
    "GetSchedulesLocation": function (intent, session, response) {
        executeAPI(amfam.getScheduleByLocation(session.attributes.date, session.attributes.class, session.attributes.gym), session.attributes, response);
    },
    "GetAllSchedulesToday": function (intent, session, response) {
        executeAPI(amfam.getTodaysSchedules(session.attributes.class), session.attributes, response);
    },
    "AMAZON.CancelIntent": function (intent, session, response) {
        response.tell("Thank you for using gym class helper.")
    },
    "AMAZON.StopIntent": function (intent, session, response) {
        response.tell("Thank you for using gym class helper.")
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        var msg = "You can say the following commands.  What is today's schedule?.  What is the schedule on Friday?.  What is the schedule at Short Pump on Monday?  Cancel or stop to exit.";
        response.ask(msg, msg);
    }
};

GymClassHelper.prototype.retrieveVariables = function(intent, session) {
  saveClass(intent.slots, session);
  saveDate(intent.slots, session);
  saveGym(intent.slots, session);
}

function executeAPI(apiCall, attributes, response) {
  apiCall.then(function(classes) {
    var msg = processClassList(attributes.dateLabel, attributes.class, classes);
    response.tellWithCard(msg, "Schedule", msg);
  }, function (error) {
    var msg = "I'm sorry, you did not specify a valid " + error.field + ".  Please try again.";
    response.tellWithCard(msg, "Error getting Schedules", msg);
  }).catch(function (error) {
    console.log("Unspecified error: " + error);
    response.tellWithCard("Something went wrong", "Error", "");
  });
}

function saveClass(slots, session) {
  session.attributes.class = "Power";
}

function saveDate(slots, session) {
  var date =  (slots !== undefined && slots.Date !== undefined ?
     slots.Date.value : null);
  session.attributes.date = date;
  session.attributes.dateLabel = (date == null ? "for today" : "on " + date);
}

function saveGym(slots, session) {
    var gym = (slots !== undefined && slots.Gym !== undefined ?
       slots.Gym.value : null);
    session.attributes.gym = gym;
}

function processClassList(day, className, classes) {
    var buffer = day;

    buffer += " there ";

    if (classes.length === 0) {
      buffer += "are no classes";
    } else if (classes.length === 1) {
      buffer += "is 1 class";
    } else {
      buffer += "are " + classes.length + " classes";
    }

    buffer += " for " + className + ".";

    for (var x in classes) {
      var classObj = classes[x];

      buffer += "  At " + classObj.time + " in " + classObj.location + " taught by " + classObj.instructor + ".";
    }

    return buffer;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HelloWorld skill.
    var skill = new GymClassHelper();
    skill.execute(event, context);
};
