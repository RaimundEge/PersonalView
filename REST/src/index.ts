import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import getFolderData from './files';
import { count, checkDuplicates, getFoldersWithDuplicates} from './dups';

dotenv.config();

const app: Express = express();
const port = process.env.PORT||3000;

app.use(cors());

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
  count.status = "done";
  res.send("working on it: " + JSON.stringify(count));
 })

app.get('/getCount', (req, res) => {
  console.log("getCount called");
  res.send(count);
})

app.get('/getDuplicates', async (req, res) => {
  const duplicates = await getFoldersWithDuplicates();
  res.send(duplicates);
})

app.listen(port, () => {
  console.log(`PersonalView REST app listening on port ${port}`)
})