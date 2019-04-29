const MessageService = require('./message');
const messageService = new MessageService();

const mockedCollection = {
    find: jest.fn(() => ({
        toArray: jest.fn(() => Promise.resolve(['fakeMessages']))
    })),
    findOne: jest.fn(() => Promise.resolve('fakeMessage')),
    insertOne: jest.fn(() => Promise.resolve({ insertedId: 'fakeInsertedId' })),
    updateOne: jest.fn(() => Promise.resolve({ matchedCount: 1, modifiedCount: 1 })),
    deleteOne: jest.fn(() => Promise.resolve({ deletedCount: 1 })),
};
const mockedDb = {
    collection: jest.fn(() => mockedCollection)
};
const mockedClient = {
  db: jest.fn(() => mockedDb),
  close: jest.fn(() => {})
};

jest.mock('mongodb', () => ({
    MongoClient: jest.fn().mockImplementation(() => ({
        connect: () => Promise.resolve(mockedClient)
    })),
    ObjectID: jest.fn().mockImplementation((id) => ({ oid: `fakeObjectId${id}` }))
}));

describe('MessageService', () => {
    describe('getConnectedClient', () => {
        it('Should instanciate new Client and connect it', async () => {
            const client = await messageService.getConnectedClient();

            expect(client).toBeTruthy();
        });
    });

    describe('getMessages', () => {
        it('Should retrieve messages from mongo then close client', async () => {
            const messages = await messageService.getMessages();

            expect(messages).toEqual(['fakeMessages']);
            expect(mockedDb.collection).toBeCalledWith('messages');
            expect(mockedCollection.find).toBeCalledWith({});
            expect(mockedClient.close).toBeCalled();
        });
    });

    describe('getMessage', () => {
        it('Should retrieve message by id from mongo then close client', async () => {
            const message = await messageService.getMessage(42);

            expect(message).toEqual('fakeMessage');
            expect(mockedDb.collection).toBeCalledWith('messages');
            expect(mockedCollection.findOne).toBeCalledWith({ _id: { oid: 'fakeObjectId42' } });
            expect(mockedClient.close).toBeCalled();
        });
    });

    describe('insertMessage', () => {
        it('Should insert valid message then close client', async () => {
            const message = {
                author: 'fakeAuthor',
                quote: 'fakeQuote'
            };
            const result = await messageService.insertMessage(message);

            expect(result).toEqual({
                ...message,
                _id: 'fakeInsertedId'
            });
            expect(mockedDb.collection).toBeCalledWith('messages');
            expect(mockedCollection.insertOne).toBeCalledWith(message);
            expect(mockedClient.close).toBeCalled();
        });

        it('Should reject invalid message', async () => {
            const message = {
               quote: 'fakeQuote'
            };
            expect.assertions(1);
            try {
              await messageService.insertMessage(message);
            } catch (e) {
              expect(e).toMatch('invalid message');
            }
        });
    });

    describe('updateMessage', () => {
        it('Should update valid message then close client', async () => {
            const message = {
                author: 'fakeAuthor',
                quote: 'fakeQuote'
            };
            const result = await messageService.updateMessage(message, 42);
            expect(result).toEqual({
                isFind: true,
                isModified: true
            });
            expect(mockedDb.collection).toBeCalledWith('messages');
            expect(mockedCollection.updateOne).toBeCalledWith(
                { _id: { oid: 'fakeObjectId42' } },
                { $set: message }
            );
            expect(mockedClient.close).toBeCalled();
        });

        it('Should reject invalid message', async () => {
            const message = {
               quote: 'fakeQuote'
            };
            expect.assertions(1);
            try {
              await messageService.updateMessage(message, 42);
            } catch (error) {
              expect(error).toMatch('invalid message');
            }
        });
    });

    describe('deleteMessage', () => {
        it('Should delete message then close client', async () => {
            const result = await messageService.deleteMessage(42);

            expect(result).toBe(true);
            expect(mockedDb.collection).toBeCalledWith('messages');
            expect(mockedCollection.deleteOne).toBeCalledWith({ _id: { oid: 'fakeObjectId42' } });
            expect(mockedClient.close).toBeCalled();
        });
    });
});
