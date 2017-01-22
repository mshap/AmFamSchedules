var api = require('./api');

'use strict';

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

//     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.05aecccb3-1461-48fb-a008-822ddrt6b516") {
//         context.fail("Invalid Application ID");
//      }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

      var cardTitle = "Schedule Help"
      var speechOutput = "Welcome to amfanfit.  You can ask for schedules at locations, or for schedules on dates."
      callback(session.attributes,
           buildSpeechletResponse(cardTitle, speechOutput, "You can ask for schedules at locations, or for schedules on dates.", false));
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);
    var intent = intentRequest.intent;
    if (isAmazonIntent(intent.name)) {
      var title, output, exit = true;
      if ("AMAZON.HelpIntent" == intent.name) {
        title = "Help";
        output = "Ask 'for today's schedule at Gym Name' or 'what is the schedule for Thursday'";
        exit = false;
      } else {
        title = "Goodbye";
        output = "Thank you for using Amfanfit today";
      }
      callback(session.attributes,
          buildSpeechletResponse(title, output, "", "" + exit));
      return;
    }

    var date = (intent.slots !== undefined && intent.slots.Date !== undefined ? "on " + intent.slots.Date.value : "for today");
    var className = "Power";

    getCallPromise(intent).then(function(classes) {
        var msg = processClassList(date, className, classes);
        var title = "Schedules " + date;

        callback(session.attributes,
            buildSpeechletResponse(title, msg, "", "true"));
    }, function(error) {
        console.log(error);
        var msg = "I'm sorry, you did not specify a valid " + error.field + ".  Please try again.";
        var title = "Error getting Schedules";

        callback(session.attributes,
            buildSpeechletResponse(title, msg, "", "true"));
    }).catch(function(error) {
        console.log(error)
         callback(session.attributes,
            buildSpeechletResponse(error, "it broke", "", "true"));
    });
}

function isAmazonIntent(intentName) {
  switch(intentName) {
    case "AMAZON.HelpIntent":
    case "AMAZON.StopIntent":
    case "AMAZON.CancelIntent":
      return true;
    default:
      return false;
  }
}

function getCallPromise(intent) {
  var intentName = intent.name,
      STATIC_CLASS = "Power";

  switch (intentName) {
    case "GetAllSchedulesToday":
      return api.getTodaysSchedules(STATIC_CLASS);
    case "GetSchedulesLocationToday":
      return api.getTodaysScheduleByLocation(STATIC_CLASS, intent.slots.Gym.value);
    case "GetAllSchedules":
      return api.getAllSchedules(intent.slots.Date.value, STATIC_CLASS);
    case "GetSchedulesLocation":
      return api.getScheduleByLocation(intent.slots.Date.value, STATIC_CLASS, intent.slots.Gym.value);
    default:
      console.log("Invalid intent: " + intent);
      throw "Invalid intent";
  }
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

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

// ------- Helper functions to build responses -------
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: "<speak>" + output.replace(/\. /g, ". <break time=\"1s\"/>") + "</speak>"
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
