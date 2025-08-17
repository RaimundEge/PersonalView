import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import getFolderData from './files';
import { All, count, checkDuplicates, getFoldersWithDuplicates, deleteDup} from './dupsNew';

dotenv.config();

const app: Express = express();
const port = process.env.PORT||3000;

app.use(cors());
app.use(express.json()); // This parses JSON bodies

app.get('/', (req, res) => {
  if (req.query.opt) {
    console.log('Query: ' + req.query.opt + ' ' + req.query.waiting)
    res.send(JSON.stringify(getFolderData(req.query.opt, req.query.waiting)))
  } else {
    res.send("query argument missing")
  }
})

app.get('/checkDuplicates', (req, res) => {
  count.value = 0;
  checkDuplicates('.');
  console.log(All.length + " unique files");
  count.duplicates = count.value - All.length;
  count.status = "done";
  res.send(count);
 })

app.get('/getUniqueCount', (req, res) => {
  // console.log("getCount called");  
    count.value = All.length;
    count.status = "stale";
    res.send(count); 
})

app.get('/getFoldersWithDuplicates', async (req, res) => {
  const duplicates = getFoldersWithDuplicates();
  res.send(duplicates);
})

app.post('/deleteDup', (req, res) => {
  // console.log('deleteDup called with: ', req.body);
  if (req.body.folder && req.body.file) {
    // console.log('Deleting: ' + req.body.folder + ' ' + req.body.file);
    deleteDup(req.body.folder, req.body.file);
    res.send({status: "file recycled"});
  } else {
    res.send("query argument missing")
  }
})

const server = app.listen(port, () => {
  console.log(`PersonalView REST app listening on port ${port}`)
})

process.once('SIGINT', () => {
    console.log('Received SIGINT. Closing server...');
    server.close(() => {
      console.log('Server closed. Exiting process...');
      process.exit(0);
    });
});