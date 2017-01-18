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

    var theCall = getCallPromise(intentRequest.intent);
    var msg, title;

    theCall.then(function(classes) {
        msg = processClassList(day, classType, classes);
        title = "Schedules " + (intent.slots.Date.value != undefined ? "on " + intent.slots.Date.value : "for today");
    }, function(error) {
        msg = "I'm sorry, you did not specify a valid " + error.field + ".  Please try again.";
        title = "Error getting Schedules";

    });

    callback(session.attributes,
        buildSpeechletResponse(title, msg, "", "true"));
}

function getCallPromise(intent) {
  var intentName = intent.name,
      theCall = null,
      STATIC_CLASS = "Power";

  switch (intentName) {
    case "GetAllSchedulesToday":
      theCall = api.getTodaysSchedules(STATIC_CLASS);
      break;
    case "GetSchedulesLocationToday":
      theCall = api.getTodaysScheduleByLocation(STATIC_CLASS, intent.slots.Gym.value);
      break;
    case "GetAllSchedules":
      theCall = api.getAllSchedules(intent.slots.Date.value, STATIC_CLASS);
      break;
    case "GetSchedulesLocation":
      theCall = api.getScheduleByLocation(intent.slots.Date.value, STATIC_CLASS, intent.slots.Gym.value);
    default:
      console.log(intent);
      throw "Invalid intent";
  }

  return theCall;
}

function processClassList(day, className, classes) {
    var buffer = "On " + day + " there ";
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
