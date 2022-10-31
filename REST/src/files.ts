import * as fs from 'fs';
import * as path from 'path';
import * as run from 'child_process'

import { IMGTYPES, VIDTYPES, BASEPATH, SRCPATH, THUMBSPATH } from './config';

export default (folder: any) => {
    var folderPath = path.join(SRCPATH, folder)
    try {
        const dirContents = fs.readdirSync(path.join(BASEPATH, folderPath));
        console.log(dirContents);
        var itemInfos = []
        for (var fileName of dirContents) {           
            if (fs.statSync(path.join(BASEPATH, folderPath, fileName)).isDirectory()) {
                console.log('directory ' + fileName)
                itemInfos.push({status: 'dir', src: path.join(folderPath, fileName)})
            } else {               
                itemInfos.push(getThumbs(folder, fileName))
            }
        }
        return { status: 'ok', items: itemInfos };
    } catch (e) { 
        console.log('Error: ', e)
        return {status: 'fail', msg: e}
    }
};

function getThumbs(folder: string, fileName: string) {
    var from: string = path.join(SRCPATH, folder, fileName)
    var toFolder: string = path.join(THUMBSPATH, folder)
    var to: string = path.join(toFolder, fileName)
    var itemInfo = {status: 'wait', thumb: '', src: from}
    console.log('from: ', from)
    fs.mkdirSync(path.join(BASEPATH, toFolder), { recursive: true})
    var ext =  fileName.split('.').pop() || '';
    // handle image files
    if (IMGTYPES.includes(ext)) {
        console.log('to: ', to)
        itemInfo.thumb = to
        if (fs.existsSync(path.join(BASEPATH, to))) {
            console.log(fileName + ' found')
            itemInfo.status = 'ok'
        } else {
            console.log(fileName + ' needs to be made')
            run.exec(`gm convert "${path.join(BASEPATH, from)}" -resize 200x200 "${path.join(BASEPATH, to)}"`, (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                // console.log(`stdout: ${stdout}`);
            });
        }
    } else {
        if (VIDTYPES.includes(ext)) {
            to = to + ".png"
            console.log('to: ', to)
            itemInfo.thumb = to
            if (fs.existsSync(path.join(BASEPATH, to))) {
                console.log(fileName + ' found')
                itemInfo.status = 'ok'
            } else {
                console.log(fileName + ' needs to be made')
                run.exec(`ffmpeg -ss 1 -y -i "${path.join(BASEPATH, to)}" -r 1 -frames 1 -s 300x200 "${path.join(BASEPATH, to)}"`, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                        return;
                    }
                    console.log(`stdout: ${stdout}`);
                });
            }
        } else {
            itemInfo.status = 'other'
        }
    }
    return itemInfo
}
