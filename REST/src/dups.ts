import * as fs from 'fs';
import * as path from 'path';
import * as run from 'child_process';
import { BASEPATH, SRCPATH, THUMBSPATH } from './config';

export var count = { status: 'none', value: 0};

export function checkDuplicates(folder: any) {  
    var folderPath = path.join(BASEPATH, SRCPATH, folder);
    console.log('checkDuplicates: ' + folderPath);
    try {
        const dirContents = fs.readdirSync(folderPath);
        // console.log(dirContents);
        var itemInfos = []
        for (var fileName of dirContents) {
            if (fs.statSync(path.join(folderPath, fileName)).isDirectory()) {
                // console.log('directory: ' + fileName);
                itemInfos.push(path.join(folder, fileName));
            } else {
                console.log('file: ' + fileName)
            }
            count.value++
        }
        // console.log(itemInfos);
        for (var item of itemInfos) {
            // console.log(item);
            checkDuplicates(item);
        }
        return;
    } catch (e) {
        console.log('Error: ', e)
        return { status: 'fail', msg: e }
    }

};