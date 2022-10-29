import * as fs from 'fs';
import * as path from 'path';
import * as run from 'child_process'

const basePath = '/mnt/diskB/Personal'
const thumbsPath = '/var/spool/Personal'

export default (folder: any) => {
    var folderPath = path.join(basePath, folder)
    const dirContents = fs.readdirSync(folderPath);
    console.log(dirContents);
    for (var item of dirContents) {
        getThumbs(item)
    }
    return dirContents;
};

function getThumbs(item: string) {
    if (fs.existsSync(path.join(thumbsPath, item)))
        console.log(item + ' found')
    else {
        console.log(item + ' needs to be made')
        run.exec('ls ' + thumbsPath, (error, stdout, stderr) => {
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
}
