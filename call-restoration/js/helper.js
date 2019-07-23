'use strict';

//Object for logging into a textarea
const cLogger = function(element){
    const logRecords = [];
    const textArea = element;
    this.write = function(logRecord){
        logRecords.push(logRecord.toString());
        render();
    };
    function render(){
        textArea.value = logRecords.join("\r\n");
        textArea.scrollTop = textArea.scrollHeight;
    }
};
