const { MongoClient, ObjectID } = require('mongodb');

module.exports = class MessageService {
  getConnectedClient() {
    const client = new MongoClient(
      process.env.MONGO_CONNECTION_URL,
      { useNewUrlParser: true }
    );    
    return client.connect();
  }

  async getMessages() {
    const client = await this.getConnectedClient();
    const collection = client.db(process.env.MONGO_DB).collection('messages');
    const result = collection.find({}).toArray();
    await client.close();
    return result;
  }

  async getMessage(id) {
    const client = await this.getConnectedClient();
    const collection = client.db(process.env.MONGO_DB).collection('messages');
    const result = collection.findOne({
      _id: new ObjectID(id)
    });
    await client.close();
    return result;
  }

  isValid(message) {
    return message.author && message.quote;
  }

  async insertMessage(message) {
    if (!this.isValid(message)) return Promise.reject('invalid message');
    const client = await this.getConnectedClient();
    const collection = client.db(process.env.MONGO_DB).collection('messages');
    const result = await collection.insertOne(message);
    await client.close();
    return {
      ...message,
      _id: result.insertedId
    };
  }

  async updateMessage(message, id) {
    if (!this.isValid(message)) return Promise.reject('invalid message');
    const client = await this.getConnectedClient();
    const collection = client.db(process.env.MONGO_DB).collection('messages');
    const query = { _id: new ObjectID(id) };
    const result = await collection.updateOne(query, { $set: message });
    await client.close();
    return {
      isFind: result.matchedCount === 1,
      isModified: result.modifiedCount === 1
    };
  }

  async deleteMessage(id) {
    const client = await this.getConnectedClient();
    const collection = client.db(process.env.MONGO_DB).collection('messages');
    const query = { _id: new ObjectID(id) };
    const result = await collection.deleteOne(query);
    await client.close();
    return result.deletedCount === 1;
  }
}
