import { MongoClient } from 'mongodb';
import { MONGO_URL, MONGO_DBNAME, MONGO_COLLECTION } from './config';

const dbPromise = MongoClient.connect(MONGO_URL);
var db: any;

export async function find(key: any) {
  const db = await dbPromise.then((client) => client.db(MONGO_DBNAME));
  console.log('checking: ', key);
  const result = await db.collection(MONGO_COLLECTION).findOne(key);
  console.log(result)
  return result;
}

export async function getDuplicates() {
    if (!db) {
        db = await dbPromise.then((client) => client.db(MONGO_DBNAME));
    }
    console.log('Looking for Duplicates: ');
    const result = await db.collection(MONGO_COLLECTION).find({$expr: {$gt: [ {$size: "$paths"}, 1]}}).toArray();
    console.log(result.length + ' duplicates found' );
    return result;
}

export async function addImage(record: any) {
    if (!db) {
        db = await dbPromise.then((client) => client.db(MONGO_DBNAME));
    }
    // console.log('checking: ', record.name);
    const result = await db.collection(MONGO_COLLECTION).findOne({name: record.name});
    if (!result) {
        // console.log('inserting: ', record.name);
        await db.collection(MONGO_COLLECTION).insertOne({ name: record.name, paths: [ record.path ]});
    } else {
        // console.log('already exists: ', record.name);
        var pathList = result.paths.filter((r: any) => r == record.path);
        if (pathList.length == 0) {
            console.log(record.name +' - adding path: ', record.path);
            await db.collection(MONGO_COLLECTION).updateOne({name: record.name}, {$push: {paths: record.path}});
        } else {
            // console.log('path already exists: ', record.path);
        }
    }
} 