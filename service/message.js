const {MongoClient, ObjectID} = require('mongodb');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

module.exports = class MessageService {
    constructor(){

    }

    getConnectedClient()
    {
        const client = new MongoClient(process.env.APP_MONGO, {useNewUrlParser:true});
        return client.connect();
    }
    getMessages(){
        let client;
        return this.getConnectedClient()
            .then((connectedClient)=>{
                client = connectedClient;
                const collection = client.db(process.env.APP_DATABASE).collection(process.env.APP_COLLECTION);
                return collection.find({}).toArray();
            })
            .then(result=>{
               client.close();
               return result;
            });
    }
    getMessage(id){
        let client;
        return this.getConnectedClient()
            .then((connecteddClient)=>{
                client = connecteddClient;
                const collection = client.db(process.env.APP_DATABASE).collection(process.env.APP_COLLECTION);
                return collection.findOne({
                    _id: new ObjectID(id)
                })
            })
            .then(result=>{
                client.close();
                return result;
            })

        return Promise.resolve(
            this.quotes.find(quote =>{
                return quote.id == id;
            })
        )
    }
    insertMessage(message)
    {
        if (!message.author||!message.quote) return  Promise.reject('invalide message');
        const newMessage = {
            ...message,
        }
        let client;
        return this.getConnectedClient()
            .then((connecteddClient)=>{
                client = connecteddClient;
                const collection = client.db(process.env.APP_DATABASE).collection(process.env.APP_COLLECTION);
                return collection.insertOne(newMessage);
            })
            .then(result=>{
                client.close();
                return result;
            })

    }
    updateMessage(message, id)
    {
        if (!message.author||!message.quote) return  Promise.reject('invalide message');

        let client;
        return this.getConnectedClient()
            .then((connecteddClient)=>{
                client = connecteddClient;
                const collection = client.db(process.env.APP_DATABASE).collection(process.env.APP_COLLECTION);
                const query = { _id: new ObjectID(id)};
                return collection.updateOne(query, {$set: message});
            })
            .then(result=>{
                client.close();
                return {
                    isFind: result.matchedCount === 1,
                    isModified: result.modifiedCount ===1
                };
            })

       /* const messageIndex = this.quotes.findIndex(
            quote => quote.id == id
        );
        if(messageIndex === -1)return Promise.resolve(null);
        this.quotes[messageIndex] = message;
        return Promise.resolve(message);*/
    }
    deleteMessage(id)
    {

        let client;
        return this.getConnectedClient()
            .then((connecteddClient)=>{
                client = connecteddClient;
                const collection = client.db(process.env.APP_DATABASE).collection(process.env.APP_COLLECTION);
                const query = { _id: new ObjectID(id)};
                return collection.deleteOne(query);
            })
            .then(result=>{
                client.close();
                return result.deletedCount === 1;
            })

        /* const messageIndex = this.quotes.findIndex(
             quote => quote.id == id
         );
         if(messageIndex === -1)return Promise.reject('invalide id');
         this.quotes.splice(messageIndex,1);
         return Promise.resolve('message supprimer');*/
    }
}