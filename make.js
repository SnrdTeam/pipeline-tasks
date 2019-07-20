const fs = require('fs');
const fse = require('fs-extra');
const ncp = require('child_process');
const { promisify } = require('util');

const mkdir = fs.mkdirSync;
const ls = fs.readdirSync;
const copy = fse.copySync;

var rmdirRecursive = deleteFolderRecursive = function (path) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

var run = function (cl) {
    console.log();
    console.log('> ' + cl);
    var options = {
        stdio: 'inherit'
    };

    var output;
    try {
        output = ncp.execSync(cl, options);
    }
    catch (err) {
        console.error(err.output ? err.output.toString() : err.message);
        process.exit(1);
    }
    return (output || '').toString().trim();
}

const buildDir = "_build";
const srcDir = "Tasks";

var buildTask = function (taskName) {
    console.log(`Building task ${taskName} ...`);

    run(`npm install ./${srcDir}/${taskName}`);
    run(`node node_modules/typescript/bin/tsc --outDir ./${buildDir}/${taskName} --p ./${srcDir}/${taskName}`);

    ls(`${srcDir}/${taskName}`)
        .filter(file => file.endsWith(".json") || file.endsWith(".svg") || file.endsWith(".png"))
        .forEach(file => copy(`${srcDir}/${taskName}/${file}`, `${buildDir}/${taskName}/${file}`));

    run(`cd ${buildDir}/${taskName} && npm install --production && cd ../..`);

    console.log(`Building task ${taskName} complete.`);
}

var build = function () {
    if (fs.existsSync(buildDir))
        rmdirRecursive(buildDir);

    mkdir(buildDir);

    ls(srcDir)
        .filter(obj => fs.lstatSync(`${srcDir}/${obj}`).isDirectory())
        .forEach(task => buildTask(task));

    var extension_files = [
        "vss-extension.json",
        "extension-icon.png"
    ];

    extension_files.forEach(file => copy(file, `${buildDir}/${file}`));

    run(`cd ${buildDir} && node ../node_modules/tfx-cli/_build/tfx-cli.js extension create && cd ..`);
}

build();