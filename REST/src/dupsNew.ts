import * as fs from 'fs';
import * as path from 'path';
import { isHiddenFile } from "is-hidden-file";
import * as run from 'child_process';
import { BASEPATH, SRCPATH, THUMBSPATH } from './config';

export var count = { status: 'none', value: 0, duplicates: 0};

interface Image {
    name: string;
    size: number;
    paths: string[];    
}
export const All: Image[] = [];

export async function checkDuplicates(folder: any) {
    // console.log('checkDuplicates called for folder: ' + folder);
    count.value = 0;
    All.length = 0; // clear the All array
    checkDuplicatesSync(folder);
    console.log(All.length + " unique files");
    count.duplicates = count.value - All.length;
    count.status = "done";
}

function checkDuplicatesSync(folder: any) {  
    var folderPath = path.join(BASEPATH, SRCPATH, folder);
    // console.log('checkDuplicates in folder: ' + folderPath);
    try {
        const dirContents = fs.readdirSync(folderPath);
        // console.log(dirContents);
        var itemInfos = []
        for (var fileName of dirContents) {
            if (folder == '.' && !fileName.match(/^2[0-9]{3}$/)) {
                // console.log('skipping: ' + fileName);
                continue;
            }
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
        }
        // console.log(itemInfos);
        for (var item of itemInfos) {
            // console.log(item);
            checkDuplicatesSync(item);
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

function addImage(record: any) {
    if (count.value%1000==0) console.log(count.value + ' files checked');
    count.value++  
    var result = null;
    for (const item of All) {
        if (item.name === record.name && item.size === record.size) {
            result = item;
            break;
        }
    }
    if (!result) {
        // console.log('inserting: ', record);
        All.push({ name: record.name, size: record.size, paths: [ record.path ]});
    } else { 
        // console.log('found: ', result);           
        var pathList = result.paths.filter((r: any) => r == record.path);
        if (pathList.length == 0) {           
            // console.log('adding path: ', record.path);
            result.paths.push(record.path);
        }      
    }
} 

export function getFoldersWithDuplicates() {
    // console.log('Looking for Duplicates: ');
    var dups = [];
    for (const image of All) {
        if (image.paths.length > 1) {
            dups.push(image);
        }
    }
    console.log(dups.length + ' files that are stored in more than one folder found');
    const folders: any = [];
    for (const file of dups) {
        // loop over paths
        for (const path of file.paths) {
            // construct file copy with path removed
            var others = [];
            for (var p of file.paths) {
                if (p != path) {
                    others.push(p);
                }
            }
            const fileCopy = { name: file.name, others: others };
            // check whether path is already in folders 
            var found = false;
            for (const f of folders) {
                if (f.name == path) {
                    found = true;
                    // console.log('found existing path: ' + path);
                    f.files.push(fileCopy);
                } 
            }
            if (!found) {
                // console.log('adding new path: ' + path);
                folders.push({ name: path, files: [fileCopy] });
            }
        }
    }
    return folders;
}  

export function deleteDup(folder: string, file: string) {
    // console.log('deleteDup called with: ', folder, file);   
    const fromPath = path.join(BASEPATH, SRCPATH, folder);
    const filePath = path.join(fromPath, file);
    const toPath = path.join(BASEPATH, SRCPATH, 'RecycleBin', folder);
    if (fs.existsSync(filePath)) {
        if (!fs.existsSync(toPath)) {
            fs.mkdirSync(toPath, { recursive: true });
        }
        console.log(filePath + ' recycled to: ' + toPath);
        fs.renameSync(filePath, path.join(toPath, file));
    } else {
        console.log('File not found: ' + filePath);
    }
}