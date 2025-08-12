import * as fs from 'fs';
import * as path from 'path';
import { isHiddenFile } from "is-hidden-file";
import * as run from 'child_process';
import { BASEPATH, SRCPATH, THUMBSPATH } from './config';
import { addImage } from './mongo';

export var count = { status: 'none', value: 0};

export async function checkDuplicates(folder: any) {  
    var folderPath = path.join(BASEPATH, SRCPATH, folder);
    // console.log('checkDuplicates in folder: ' + folderPath);
    try {
        const dirContents = fs.readdirSync(folderPath);
        // console.log(dirContents);
        var itemInfos = []
        for (var fileName of dirContents) {
            var stats = fs.statSync(path.join(folderPath, fileName));
            if (stats.isDirectory()) {
                // console.log('directory: ' + fileName);
                itemInfos.push(path.join(folder, fileName));
            } else {
                // console.log('file: ' + fileName)
                if (checkFileName(fileName)) {
                    addImage({name: fileName, size: stats.size, path: folder});
                }               
            }
            count.value++
        }
        // console.log(itemInfos);
        for (var item of itemInfos) {
            // console.log(item);
            await checkDuplicates(item);
        }
        return;
    } catch (e) {
        console.log('Error: ', e)
        return { status: 'fail', msg: e }
    }

};

function checkFileName(name: any) {
    let skip = false
    if (isHiddenFile(name)) skip = true;
    if (name == "Folder.jpg") skip = true;
    if (name == "Thumbs.db") skip = true;
    // if (skip) {
    //     console.log('skipping file: ' + name);
    // }
    return !skip;
}