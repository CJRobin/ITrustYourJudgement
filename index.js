'use strict';
const Alexa = require('alexa-sdk');
var AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});
AWS.config.update({region: 'us-east-1'});
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = 'amzn1.ask.skill.b5929d2f-b4da-4c21-8d14-468797b70160';
const HELP_MESSAGE = 'You can say things like \"Read status report\", \"Read billing status report\", \"Read billing status report for april 2017\"...What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

var months =["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var getMonth = function(value) {
    return months[value];
};
    
function GetData(month, year, department) {
    var params = {
        TableName: "LogEntries",
        IndexName: "month-index",
        KeyConditionExpression:  "#month = :mi",
        FilterExpression: "#year = :yi and department =:di",
        ExpressionAttributeNames: {
            "#month" : "month",
            "#year" : "year"
        },
        ExpressionAttributeValues:  {
        ":mi"   : month ? month : getMonth((new Date()).getMonth()),
        ":yi" : year ? year : (new Date()).getFullYear(),
        ":di"   : department
        },
        ProjectionExpression: 'info'
    };
    docClient.query(params, function(err, data) {
        if (err) {
            console.log(err);
            return 'error';
        } 
        else {
            return data.Items[0].info;
        }
    });
}
    
const handlers = {
    

    'LaunchRequest': function () {
        this.emit(':ask', 'Would you like to hear the current month\'s status report or a particular month, year, or departments?', 'I\'m sorry. I didn\'t catch that.');
    },

    'Update': function () {
        var monthName = this.event.request.intent.slots.Month.value;
        var year = this.event.request.intent.slots.Year.value;
        var department = this.event.request.intent.slots.Department.value;
        
        //run query with appropriate values
        //assign to info variable
        //append info variable to end of each emit
        
        if (!monthName && !year && !department){
            var currentMonth = getMonth((new Date()).getMonth());
            this.emit(':tell', currentMonth + '\'s status report is...');
        }
        else if (!monthName && !year && department){
            this.emit(':tell', 'The status report for the ' + department + ' department is...');
        }
        else if (!monthName && year && !department){
            this.emit(':tell', 'The status report for ' + year + ' is...');
        }
        else if (!monthName && year && department){
            this.emit(':tell', 'The status report for the ' + department + ' department in ' + year + ' is...');
        }
        else if (monthName && !year && !department){
             this.emit(':tell','The status report for  ' + monthName + ' is ...');
        }
        else if (monthName && !year && department){
            this.emit(':tell', 'The status report for the ' + department + ' department in ' + monthName + ' is...');
        }
        else if(monthName && year && !department){
             this.emit(':tell', 'The status report for ' + monthName + ' ' + year + ' is...');
        }
        else if(monthName && year && department){
            var temp = 'The status report for the ' + department + ' department in ' + monthName + ' ' + year + ' is ' + GetData(monthName, year, department);
            console.log(temp);
            this.emit(':tell', temp);
        }
        
    },
    
    'Help' : function(){
        this.emit(':tell', 'Say things like "Read April\'s status report" or Read April 2016 status report');
    },
    
    
    'AMAZON.HelpIntent': function () {
        const speechOutput = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;

        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
};

exports.handler = function (event, context, callback) {
    GetData('January', 2018, 'Billing');
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
