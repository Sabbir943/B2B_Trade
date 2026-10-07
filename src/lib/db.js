import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "MONGODB_URI is missing. Add it to .env (e.g. mongodb://127.0.0.1:27017/b2b_trade)",
  );
}

const globalStore = globalThis;

if (!globalStore.__mongoClient) {
  globalStore.__mongoClient = new MongoClient(uri);
}

export const client = globalStore.__mongoClient;
export const db = client.db();

export const supportsTransactions =
  uri.startsWith("mongodb+srv://") || uri.includes("replicaSet=");
