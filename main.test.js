const request = require('supertest');

jest.mock('./middleware/basic-auth', () => {
  return {
    basicAuth: (request, response, next) => next()
  };
});

jest.mock('./services/message', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getMessages: jest.fn(() => Promise.resolve(['fakeMessage'])),
      getMessage: jest.fn(() => Promise.resolve({ id: 51 })),
      insertMessage: jest.fn(() => Promise.resolve({ message: '', _id: 42 })),
      updateMessage: jest.fn(() => Promise.resolve({ isFind: true, isModified: true })),
      deleteMessage: jest.fn(() => Promise.resolve(true))
    };
  });
});

const mockedFileService = {
  getFileInfos: jest.fn(() => Promise.resolve(['fileInfos'])),
  saveFileInfos: jest.fn(() => Promise.resolve()),
  getFile: jest.fn(() => Promise.resolve({
    fileReadStream: {
      pipe: (response) => response.sendStatus(200)
    },
    fileInfo: {
      'original-name': 'realName',
      'mime-type': 'pdf',
      size: 51
    }
  })),
  deleteFile: jest.fn(() => Promise.resolve())
}

jest.mock('./services/file', () => {
  return jest.fn().mockImplementation(() => {
    return mockedFileService;
  });
});

const app = require('./main');

describe('Express router', () => {
  it('Should have nothing mapped on root', async () => {
      const response = await request(app).get('/');

      expect(response.statusCode).toBe(404);
  });

  describe('Message API', () => {
    it('Should return messages', async () => {
      const response = await request(app).get('/api/v1/message');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(['fakeMessage']);
    });

    it('Should return message according to id', async () => {
      const response = await request(app).get('/api/v1/message/1');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ id: 51 });
    });

    it('Should create new message', async () => {
      const response = await request(app)
        .post('/api/v1/message')
        .type('form')
        .send({ author: 'fakeAuthor' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: '', _id: 42 });
    });

    it('Should update message', async () => {
      const response = await request(app)
        .put('/api/v1/message/50')
        .type('form')
        .send({ author: 'fakeAuthor' });

      expect(response.statusCode).toBe(200);
    });

    it('Should delete message', async () => {
      const response = await request(app).delete('/api/v1/message/2');

      expect(response.statusCode).toBe(200);
    });
  });

  describe('File API', () => {
    it('Should send file', async () => {
      const response = await request(app).post('/api/v1/file')
        .attach('myFile', __dirname + '/data/map.pdf');
      expect(response.statusCode).toBe(200);
    });

    it('Should return error iwhen saveFileInfos fails', async () => {
      mockedFileService.saveFileInfos = jest.fn(() => Promise.reject('fail'));

      const response = await request(app).post('/api/v1/file')
        .attach('myFile', __dirname + '/data/map.pdf');
      expect(response.statusCode).toBe(500);
    });

    it('Should retrieve files infos', async() => {
      const response = await request(app).get('/api/v1/file');

      expect(response.statusCode).toBe(200);
    });

    it('Should download file', async() => {
      const response = await request(app).get('/api/v1/file/42');

      expect(mockedFileService.getFile).toBeCalledWith('42');
      expect(response.statusCode).toBe(200);
    });

    it('Should delete file', async() => {
      const response = await request(app).delete('/api/v1/file/42');

      expect(mockedFileService.deleteFile).toBeCalledWith('42');
      expect(response.statusCode).toBe(200);
    });
  });
});
