import tl = require('azure-pipelines-task-lib/task');

console.log("Cleaning up secure file...");
let secureFilePath = tl.getInput('secureFilePath', true);
if (tl.exist(secureFilePath)) {
    tl.debug('Deleting secure file at: ' + secureFilePath);
    tl.rmRF(secureFilePath);
}
console.log("Secure file clean up completed.");