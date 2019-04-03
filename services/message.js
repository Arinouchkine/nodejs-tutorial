const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

module.exports = class MessageService {
  constructor() {
    readFile(__dirname + '/../data/quotes.json', {encoding: 'utf8'})
    .then(data => {
      this.quotes = JSON.parse(data);
    });
  }

  getConnectedClient() {
    const client = new MongoClient(
      process.env.MONGO_CONNECTION_URL,
      { useNewUrlParser: true }
    );
    return client.connect();
  }

  getMessages() {
    let client;
    return this.getConnectedClient()
      .then((connectedClient) => {
        client = connectedClient;
        const collection = client.db(process.env.MONGO_DB).collection('messages');
        return collection.find({}).toArray();
      })
      .then(result => {
        client.close();
        return result;
      });
  }

  getMessage(id) {
    return Promise.resolve(
      this.quotes.find(quote => {
        return quote.id == id;
      })
    );
  }

  isValid(message) {
    return message.author && message.quote;
  }

  insertMessage(message) {
    if (!this.isValid(message)) return Promise.reject('invalid message');
    const ids = this.quotes.map(quote => quote.id);
    const nextId = Math.max(...ids);
    const newMessage = {
      ...message,
      id: nextId + 1
    };
    this.quotes.push(newMessage);
    return Promise.resolve(newMessage);
  }

  updateMessage(message, id) {
    if (!this.isValid(message)) return Promise.reject('invalid message');
    const messageIndex = this.quotes.findIndex(
      quote => quote.id == id
    );
    if (messageIndex === -1) return Promise.resolve(null);
    this.quotes[messageIndex] = message;
    return Promise.resolve(message);
  }

  deleteMessage(id) {
    const messageIndex = this.quotes.findIndex(
      quote => quote.id == id
    );
    if (messageIndex === -1) return Promise.reject('not found');

    this.quotes.splice(messageIndex, 1);
    return Promise.resolve();
  }
}
