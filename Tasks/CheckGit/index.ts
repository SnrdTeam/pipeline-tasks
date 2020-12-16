import tl = require('azure-pipelines-task-lib/task');
import shell = require('shelljs');

async function run() {
    try 
    {
        const branchName: string = tl.getInput('branch', true);
        const tagValidation: boolean = tl.getBoolInput('tagValidation', true);
        const headValidation: boolean = tl.getBoolInput('headValidation', true);

        if (!shell.which('git')) 
        {
            tl.setResult(tl.TaskResult.Failed, `git is required to run this script`, true);
            return;
        }
        
        //Get a current branch name which local HEAD points to
        let exec = shell.exec('git rev-parse --abbrev-ref HEAD', { silent: true });
        await checkGitExitCode(exec);
        const currentBranchName: string = exec.stdout.replace(/[\r\n]$/, '');
        
        console.log(`Current build branch name is "${currentBranchName}", expected branch name specified in the task is "${branchName}"`);
        
        if(currentBranchName !== branchName)
        {
            tl.setResult(tl.TaskResult.Failed, "Wrong branch", true);
            return;
        }

        //Get the hash of the local HEAD commit
        exec = shell.exec('git rev-parse HEAD', { silent: true });
        await checkGitExitCode(exec);
        const hashLocalHeadCommit: string = exec.stdout.replace(/[\r\n]$/, '');
        
        //Checking that the local hash of the head is equal to the remote head
        if(headValidation)
        {
            //Get the hash of the remote HEAD commit
            exec = shell.exec(`git rev-parse origin/${branchName}`, { silent: true })
            await checkGitExitCode(exec);
            const hashRemoteHeadCommit: string = exec.stdout.replace(/[\r\n]$/, '');
            
            console.log(`Current build HEAD hash is "${hashLocalHeadCommit}", expected HEAD hash is "${hashRemoteHeadCommit}"`);
            
            if(hashRemoteHeadCommit !== hashLocalHeadCommit)
            {
                tl.setResult(tl.TaskResult.Failed, "Local and remote HEAD do not match", true);
                return;
            }
        }
        
        //Checking Tag    
        if(tagValidation)
        {
            //Get the latest tag in current branch
            //If no tags exist, this command will return fatal error and non-zero return code for git
            exec = shell.exec('git describe --tags --abbrev=0', { silent: true });
            await checkGitExitCode(exec);
            const latestTagName: string = exec.stdout.replace(/[\r\n]$/, '');
            
            console.log(`Latest tag name is "${latestTagName}"`);
            
            //Get the hash of the commit pointed to by the tag
            exec = shell.exec(`git rev-list -n 1 "${latestTagName}"`, { silent: true });
            await checkGitExitCode(exec);
            const tagHash: string = exec.stdout.replace(/[\r\n]$/, '');
            
            console.log(`The last commit with a tag has a hash "${tagHash}", expected hash "${hashLocalHeadCommit}"`);
            
            if(hashLocalHeadCommit !== tagHash)
            {
                tl.setResult(tl.TaskResult.Failed, "Tag not found", true);
                return;
            }
        }
        
        tl.setResult(tl.TaskResult.Succeeded, '', true);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message, true);
    }
}

async function checkGitExitCode(application: shell.ShellString)
{
    if(application.code === 0)
    {
        return;
    }

    tl.setResult(tl.TaskResult.Failed, application.stderr, false);
    throw new Error("GIT CLI utility returned non-zero exit code");
}

run();