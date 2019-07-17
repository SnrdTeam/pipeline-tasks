import path = require('path');
import { SecureFileHelpers } from './securefiles-common';
import tl = require('azure-pipelines-task-lib/task');

async function run() {
    let secureFileId: string;
    let secureFilePathEnvVar: string;
    let secureFileHelpers: SecureFileHelpers;

    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        // download decrypted contents
        secureFileId = tl.getInput('secureFile', true);
        secureFilePathEnvVar = tl.getInput('secureFilePathEnvVar', false)
        secureFileHelpers = new SecureFileHelpers();
        let secureFilePath: string = await secureFileHelpers.downloadSecureFile(secureFileId);

        if (tl.exist(secureFilePath)) {
            // set the secure file output variable.
            tl.setVariable('secureFilePath', secureFilePath);
        }
        if (secureFilePathEnvVar && secureFilePathEnvVar.length > 0) {
            tl.setVariable(secureFilePathEnvVar, secureFilePath)
        }
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();