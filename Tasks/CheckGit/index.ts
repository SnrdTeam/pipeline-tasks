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
            tl.setResult(tl.TaskResult.Failed, `GIT CLI utility is required to run this task`, true);
            return;
        }
        
        //Get a branches name and detached heads which local HEAD points to
        let exec = shell.exec('git branch -r --contains HEAD', { silent: true });
        await checkGitExitCode(exec);
        const branchesContainsHead: string[] = exec.stdout.split(/\r\n|\n|\r/)
            .map(branchName => branchName.trim())
            .filter(branchName => typeof branchName !== 'undefined' && branchName);
        
        console.log(`Identical source code is contained in branches ${branchesContainsHead.map(branch => `"${branch}"`).join(",")}. Expected branch name is "${branchName}"`);
        
        if(branchesContainsHead.indexOf(branchName) === -1)
        {
            tl.setResult(tl.TaskResult.Failed, `In the specified branch named ${branchName} does not contain required source codes`, true);
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
            exec = shell.exec(`git rev-parse ${branchName}`, { silent: true })
            await checkGitExitCode(exec);
            const hashRemoteHeadCommit: string = exec.stdout.replace(/[\r\n]$/, '');
            
            console.log(`The sources are expected to be the latest in the branch"`);
            
            if(hashRemoteHeadCommit !== hashLocalHeadCommit)
            {
                tl.setResult(tl.TaskResult.Failed, `Sources must refer to the last commit on the branch ${branchName}`, true);
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
            
            console.log(`Available tag name is "${latestTagName}"`);
            
            //Get the hash of the commit pointed to by the tag
            exec = shell.exec(`git rev-list -n 1 "${latestTagName}"`, { silent: true });
            await checkGitExitCode(exec);
            const tagHash: string = exec.stdout.replace(/[\r\n]$/, '');
            
            console.log(`The tag refers to a commit with a hash ${tagHash}, expected hash ${hashLocalHeadCommit}`);
            
            if(hashLocalHeadCommit !== tagHash)
            {
                tl.setResult(tl.TaskResult.Failed, "Sources must have a tag", true);
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