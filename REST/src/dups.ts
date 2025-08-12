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
            if (fs.statSync(path.join(folderPath, fileName)).isDirectory()) {
                // console.log('directory: ' + fileName);
                itemInfos.push(path.join(folder, fileName));
            } else {
                // console.log('file: ' + fileName)
                if (isHiddenFile(fileName)) {
                    console.log('skipping hidden file: ' + path.join(folder, fileName));
                    continue;
                }
                addImage({name: fileName, path: folder});
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