import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";




const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export default client;
