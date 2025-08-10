import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import getFolderData from './files'
import { count, checkDuplicates } from './dups';

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
  count.status = "checking";
  checkDuplicates('.');
  count.status = "done";
  res.send("working on it: " + JSON.stringify(count)) 
})

app.get('/getCount', (req, res) => {
  res.send(count);
})

app.listen(port, () => {
  console.log(`PersonalView REST app listening on port ${port}`)
})