import tl = require('azure-pipelines-task-lib/task');

let secureFilePath = tl.getInput('secureFilePath', true);
if (tl.exist(secureFilePath)) {
    tl.debug('Deleting secure file at: ' + secureFilePath);
    tl.rmRF(secureFilePath);
}