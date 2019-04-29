const FileService = require('./file');
const fileService = new FileService();

const mockedClient = {
  query: jest.fn(() => Promise.resolve({})),
  release: jest.fn(() => Promise.resolve())
};

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: () => Promise.resolve(mockedClient)
  }))
}));

jest.mock('fs', () => ({
  createReadStream: () => 'fakeCreateReadStream',
  unlink: (path, callback) => { callback(); }
}));

describe('FileService', () => {
  describe('openTransaction', () => {
    it('Should connect to pool, begin transaction and return client', async () => {
      const client = await fileService.openTransaction();

      expect(client).toBeTruthy();
      expect(mockedClient.query).toBeCalledWith('BEGIN');
    });
  });

  describe('validateTransaction', () => {
    it('Should commit then release client', async () => {
      await fileService.validateTransaction(mockedClient);

      expect(mockedClient.query).toBeCalledWith('COMMIT');
      expect(mockedClient.release).toBeCalled();
    });
  });

  describe('abortTransaction', () => {
    it('Should rollback then release client', async () => {
      await fileService.abortTransaction(mockedClient);

      expect(mockedClient.query).toBeCalledWith('ROLLBACK');
      expect(mockedClient.release).toBeCalled();
    });
  });

  describe('saveFileInfos', () => {
    it('Should insert fileInfo into database', async () => {
      const fileInfo = {
        filename: 'fakeFileName',
        mimetype: 'fakeMimeType',
        originalname: 'fakeOriginalName',
        size: 2,
        encoding: 'fakeEncoding'
      };
      await fileService.saveFileInfos(fileInfo);

      expect(mockedClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockedClient.query).toHaveBeenNthCalledWith(2,
        'INSERT INTO filestore("file-name", "mime-type", "original-name", size, encoding) VALUES ($1, $2, $3, $4, $5)',
        [
          fileInfo.filename,
          fileInfo.mimetype,
          fileInfo.originalname,
          fileInfo.size,
          fileInfo.encoding
        ]
      );
      expect(mockedClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    });
  });

  describe('getFileInfos', () => {
    it('Should retrieve fileInfo from database', async () => {
      mockedClient.query = jest.fn(() => Promise.resolve({ rows: 'fakeRows' }));

      const fileInfos = await fileService.getFileInfos();

      expect(fileInfos).toEqual('fakeRows');
      expect(mockedClient.query).toHaveBeenCalledWith(
        'SELECT id, "file-name", "mime-type", "original-name", size, encoding FROM filestore'
      );
      expect(mockedClient.release).toBeCalled();
    });
  });

  describe('getFile', () => {
    it('Should rerieve file infos from db then return them along with file stream', async () => {
      const fakeRows = [
        {
          'file-name': 'fakeFileName'
        }
      ];
      mockedClient.query = jest.fn(() => Promise.resolve({ rows: fakeRows }));

      const { fileReadStream, fileInfo } = await fileService.getFile(2);

      expect(fileReadStream).toEqual('fakeCreateReadStream');
      expect(fileInfo).toEqual(fakeRows[0]);
      expect(mockedClient.query).toHaveBeenCalledWith(
        'SELECT "file-name", "mime-type", "original-name", size, encoding FROM filestore WHERE id=$1',
        [2]
      );
      expect(mockedClient.release).toBeCalled();
    });

    it('Should throw error if file is not found on db', async () => {
      mockedClient.query = jest.fn(() => Promise.resolve({ rows: [] }));

      expect.assertions(1);
      try {
        await fileService.getFile(2);

      } catch(error) {
        expect(error).toMatch('no result');
      }
    });
  });

  describe('deleteFile', () => {
    it('Should delete file from db then from file system', async () => {
      const fakeRows = [
        {
          'file-name': 'fakeFileName'
        }
      ];
      mockedClient.query = jest.fn(() => Promise.resolve({ rows: fakeRows }));

      await fileService.deleteFile(2);
      expect(mockedClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockedClient.query).toHaveBeenNthCalledWith(2,
        'SELECT "file-name" FROM filestore WHERE id=$1',
        [2]
      );
      expect(mockedClient.query).toHaveBeenNthCalledWith(3,
        'DELETE FROM filestore WHERE id=$1',
        [2]
      );
      expect(mockedClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    });

    it('Should throw error if file is not found on db', async () => {
      mockedClient.query = jest.fn(() => Promise.resolve({ rows: [] }));

      expect.assertions(4);
      try {
        await fileService.deleteFile(2);

      } catch (error) {
        expect(mockedClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(mockedClient.query).toHaveBeenNthCalledWith(2,
          'SELECT "file-name" FROM filestore WHERE id=$1',
          [2]
        );
        expect(mockedClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
        expect(error).toMatch('no result');
      }
    });
  });
});
