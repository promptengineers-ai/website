import { MongoClient, Db, GridFSBucket } from 'mongodb';

if (!process.env.MONGO_DB_URI) {
  throw new Error('Please add your Mongo URI to .env');
}

const uri = process.env.MONGO_DB_URI;
const options = {
  serverSelectionTimeoutMS: 5000, // 5 seconds timeout for serverless
  socketTimeoutMS: 45000, // 45 seconds socket timeout
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverApi: {
    version: '1' as const,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _gridFSBuckets: Map<string, GridFSBucket> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

export async function getGridFSBucket(bucketName: string = 'resumes'): Promise<GridFSBucket> {
  if (!global._gridFSBuckets) {
    global._gridFSBuckets = new Map();
  }

  if (global._gridFSBuckets.has(bucketName)) {
    return global._gridFSBuckets.get(bucketName)!;
  }

  const db = await getDb();
  const bucket = new GridFSBucket(db, {
    bucketName: bucketName,
  });

  global._gridFSBuckets.set(bucketName, bucket);

  return bucket;
}

export default clientPromise;
