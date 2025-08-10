import * as fs from 'fs';
import * as path from 'path';
import * as run from 'child_process';

import { IMGTYPES, VIDTYPES, AUDTYPES, DOWNTYPES, BASEPATH, SRCPATH, THUMBSPATH } from './config';

const inProgress: string[] = [];
const inWait = new Map<string, string>();
const MAXJOBS = 4;
const badFiles: string[] = [];

export default (folder: any, waiting: any) => {
    if (waiting == 'false') {
        inProgress.length = 0;
        inWait.clear();
        badFiles.length = 0;
    } else {
        console.log(`making: ${inProgress.length}, waiting: ${inWait.size}, bad: ${badFiles.length}` )
    }
    var folderPath = path.join(SRCPATH, folder)
    try {
        const dirContents = fs.readdirSync(path.join(BASEPATH, folderPath));
        // console.log(dirContents);
        var itemInfos = []
        for (var fileName of dirContents) {
            if (fs.statSync(path.join(BASEPATH, folderPath, fileName)).isDirectory()) {
                // console.log('directory ' + fileName)
                itemInfos.push({ status: 'dir', src: fileName })
            } else {
                var info = getThumbs(folder, fileName);
                if (info.status !== 'other') {
                    itemInfos.push(info);
                }
            }
        }
        return { status: 'ok', items: itemInfos };
    } catch (e) {
        console.log('Error: ', e)
        return { status: 'fail', msg: e }
    }
};

function getThumbs(folder: string, fileName: string) {
    var from: string = path.join(SRCPATH, folder, fileName)
    var toFolder: string = path.join(THUMBSPATH, folder)
    var to: string = path.join(toFolder, fileName)
    var itemInfo = { status: 'wait', thumb: '', src: from }
    // console.log('from: ', from)
    fs.mkdirSync(path.join(BASEPATH, toFolder), { recursive: true })
    var ext = fileName.split('.').pop() || '';
    // handle image files   
    if (IMGTYPES.includes(ext)) {
        // console.log('to: ', to)
        if (DOWNTYPES.includes(ext)) {
            to += '.gif';
        }
        itemInfo.thumb = to
        if (badFiles.includes(to)) {
            itemInfo.status = 'bad';
        } else {
            if (fs.existsSync(path.join(BASEPATH, to))) {
                if (DOWNTYPES.includes(ext)) {
                    itemInfo.status = 'down';
                } else {
                    itemInfo.status = 'image'
                }
            } else {
                makeThumb(to, `gm convert "${path.join(BASEPATH, from)}" -resize 200x200 "${path.join(BASEPATH, to)}"`);
            }
        }
    } else {
        if (VIDTYPES.includes(ext)) {
            to = to + ".png"
            // console.log('to: ', to)
            itemInfo.thumb = to;
            if (badFiles.includes(to)) {
                itemInfo.status = 'bad';
            } else {
                if (fs.existsSync(path.join(BASEPATH, to))) {
                    // console.log(fileName + ' found')
                    if (DOWNTYPES.includes(ext)) {
                        itemInfo.status = 'down';
                    } else {
                        itemInfo.status = 'video'
                    }
                    const index = inProgress.indexOf(to, 0);
                    if (index > -1) {
                        inProgress.splice(index, 1);
                    }
                } else {
                    makeThumb(to, `ffmpeg -t 1 -ss 0 -y -i "${path.join(BASEPATH, from)}" -r 1 -frames 1 -s 200x150 "${path.join(BASEPATH, to)}"`);
                }
            }
        } else {
            if (AUDTYPES.includes(ext)) {
                itemInfo.status = "audio"
            } else {
                itemInfo.status = 'other'
            }
        }
    }
    return itemInfo
};

async function makeThumb(to: string, cmd: string) {
    // console.log('inProgress length: ' + inProgress.length)
    if (inProgress.includes(to) || inWait.has(to)) {
        // console.log('in progress or waiting: ' + to)
    } else {
        if (inProgress.length < MAXJOBS) {
            // console.log('Making: ' + to)
            runNextJob(to, cmd);
        } else {
            // console.log('Waiting: ' + to)
            inWait.set(to, cmd);
        }
    }
};

async function runNextJob(to: string, cmd: string) {
    inProgress.push(to);
    run.exec('nice ' + cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`stderr: ${stderr}`);
            console.log(error);
            badFiles.push(to);
        }
        if (stdout) {
            console.log(`stdout: ${stdout}` + 'done: ' + to);
        }
        const index = inProgress.indexOf(to, 0);
        if (index > -1) {
            inProgress.splice(index, 1);
            // console.log('inProgress removing: ', to);
        }
        // check whether output was generated
        if (!fs.existsSync(path.join(BASEPATH, to))) {
            console.log('job failed for: ', to);
            badFiles.push(to);
        }
        // get next from inWait
        if (inWait.size > 0) {
            let [to, cmd] = [...inWait][0];
            inWait.delete(to);
            // console.log("removed from waiting: " + to);
            runNextJob(to, cmd);
        }
    });
};