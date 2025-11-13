import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";


const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ums636c.mongodb.net/pawmart-user?retryWrites=true&w=majority`;

const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export default client;
