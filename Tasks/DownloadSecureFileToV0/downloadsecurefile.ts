import path = require('path');
import { SecureFileHelpers } from './securefiles-common';
import tl = require('azure-pipelines-task-lib/task');

async function run() {
    let secureFileId: string;
    let secureFilePath: string;
    let overwrite: boolean;
    let secureFileHelpers: SecureFileHelpers;

    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        console.log("Extracting secure file content...");
        // download decrypted contents
        secureFileId = tl.getInput('secureFile', true);
        secureFilePath = tl.getInput('secureFilePath', true);
        overwrite = tl.getBoolInput("overwrite", true);
        secureFileHelpers = new SecureFileHelpers();
        await secureFileHelpers.downloadSecureFile(secureFileId, secureFilePath, overwrite);
        console.log("Secure file downloaded susccessfully.");
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();