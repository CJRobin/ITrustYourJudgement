'use strict';
const Alexa = require('alexa-sdk');
var AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});
AWS.config.update({region: 'us-east-1'});

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
var continuedText;

    function GetData(month, year, department, callback) {
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
            //console.log(data.Items[0].info);
            callback(data.Items[0].info);
            
        }
    });
}

function ParseInfo(infoText, callback) {
    var textLength = 25;
    if(infoText.length >= textLength) {
        //var regex = /[a-z0-9]{1}\. [A-Z0-9]/;
        //var findPos = regex.exec(infoText.substring(25, infoText.length));
        //if(findPos != null) {           
            //var endPos = findPos.index + 25;
           // continuedText = infoText.substring(endPos+2, infoText.length);
           // callback(infoText.substring(0, endPos+2), true);
        //}
    } else {
        callback(infoText, false); 
    }
}
    
const handlers = {
    

    'LaunchRequest': function () {
        this.emit(':ask', 'Would you like to hear the current month\'s status report, or a particular month, year, or departments?', 'I\'m sorry. I didn\'t catch that.');
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
            var self = this;
            GetData(currentMonth, (new Date()).getFullYear(), 'general', function(info, isThereMore){
                self.emit(':tell', 'The current status report is: ' + info);  
                // ParseInfo(info, function(newInfo, isThereMore) {
                //     if(isThereMore) {
                //         self.emit(':ask', 'The current status report is: ' + newInfo + ", would you like to hear more?");
                //     } else {
                //         self.emit(':tell', 'The current status report is: ' + newInfo);                    
                //     }
                // });
            });
           
        }
        else if (!monthName && !year && department){
            var currentMonth = getMonth((new Date()).getMonth());
            var self = this;
            GetData(currentMonth, (new Date()).getFullYear(), department, function(info, isThereMore){
                self.emit(':tell', 'The current status report for the ' + department + ' department is: ' + info);
                // ParseInfo(info, function(newInfo, isThereMore) {
                //     if(isThereMore) {
                //         self.emit(':ask', 'The current status report for the ' + department + ' department is: ' + newInfo + ", would you like to hear more?");
                //     } else {
                //         self.emit(':tell', 'The current status report for the ' + department + ' department is: ' + newInfo);                  
                //     }
                // });
            });
        }
        else if (!monthName && year && !department){
            var currentMonth = getMonth((new Date()).getMonth());
            var self = this;
            GetData(currentMonth, parseInt(year), 'general', function(info){
                self.emit(':tell', 'The status report for ' + year + ' is: ' + info);
            });
            //doesnt work with int, only with string, check back later
        }
        else if (!monthName && year && department){
            var currentMonth = getMonth((new Date()).getMonth());
            var self = this;
            GetData(currentMonth, parseInt(year), department, function(info){
                self.emit(':tell', 'The status report for the ' + department + ' department in ' + year + ' is: ' + info);
            });
        }
        
       
        else if (monthName && !year && !department){
            var self = this;
            GetData(monthName, (new Date()).getFullYear(), 'general', function(info){
                self.emit(':tell', 'The status report for ' + monthName + ' is: ' + info );
            });
        }
       
        else if (monthName && !year && department){
            var self = this;
            GetData(monthName, (new Date()).getFullYear(), department, function(info){
                self.emit(':tell', 'The status report for '+ department + 'in ' + monthName + ' is: ' + info );
            });
        }

        else if(monthName && year && !department){
            var self = this;
            GetData(monthName, parseInt(year), 'general', function(info){
                self.emit(':tell', 'The general status report for '+ department + 'in ' + monthName + ' is: ' + info );
            });
        }
        else if(monthName && year && department){
            var self = this;
            GetData(monthName, parseInt(year), department, function(info){
                self.emit(':tell', 'The status report for the ' + department + ' department in ' + monthName + ' ' + year + ' is: ' + info);
                // ParseInfo(info, function(newInfo, isThereMore) {
                //     if(isThereMore) {
                //         self.emit(':ask', 'The status report for the ' + department + ' department in ' + monthName + ' ' + year + ' is: ' + newInfo + "; would you like to hear more?");
                
                //     } else {
                //         self.emit(':tell', 'The status report for the ' + department + ' department in ' + monthName + ' ' + year + ' is: ' + newInfo);                        
                //     }
                // });
            });
        }
    },
    'Continue' : function(){
        var confirm = this.event.request.intent.slots.Yes.value;
        if (confirm) {
            this.emit(':tell', continuedText);
            continuedText = '';
        }else {
           this.emit(':tell', 'well too bad?'); 
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
    var regex = /[a-z0-9]{1}\. [A-Z0-9]/;
    var infoText = 'Apple’s board of directors has declared a cash dividend of $0.63 per share of the Company’s common stock. The dividend is payable on February 15, 2018 to shareholders of record as of the close of business on February 12, 2018. 2018';
    var newPos = regex.exec(infoText.substring(25, infoText.length));
    var endPos = newPos.index + 25;
    // continuedText = infoText.substring(endPos+1, infoText.length);
    if(newPos != null) { 
    console.log('THIS IS WHERE ' + infoText.substring(endPos+2, infoText.length))
    }
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};


// get data is returning undefined