import path = require('path');
import { SecureFileHelpers } from './securefiles-common';
import tl = require('azure-pipelines-task-lib/task');

async function run() {
    let secureFileId: string;
    let secureFilePath: string;
    let secureFileHelpers: SecureFileHelpers;

    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        // download decrypted contents
        secureFileId = tl.getInput('secureFile', true);
        secureFilePath = tl.getInput('secureFilePath', true);
        secureFileHelpers = new SecureFileHelpers();
        await secureFileHelpers.downloadSecureFile(secureFileId, secureFilePath);
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();