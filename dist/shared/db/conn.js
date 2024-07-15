import { MongoClient } from "mongodb";
const connectionStr = process.env.MONGO_URI || 'mongodb+srv://nacho98nacho98:dsw123@cluster0.z5xdoug.mongodb.net/';
const cli = new MongoClient(connectionStr);
try {
    await cli.connect();
    console.log('Connected to MongoDB');
}
catch (error) {
    console.error('Error connecting to MongoDB:', error);
}
export let db = cli.db('crm');
//# sourceMappingURL=conn.js.map