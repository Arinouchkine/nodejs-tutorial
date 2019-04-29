const { Pool } = require('pg');
const fs = require('fs');
const util = require('util');
const unlink = util.promisify(fs.unlink);

module.exports = class FileService {
  constructor() {
    this.pool = new Pool();
  }

  async openTransaction() {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return client;
  }

  async validateTransaction(client) {
    await client.query('COMMIT');
    return client.release();
  }

  async abortTransaction(client) {
    await client.query('ROLLBACK');
    return client.release();
  }

  async saveFileInfos(fileInfo) {
    let client;
    try {
      client = await this.openTransaction();
      await client.query(
        'INSERT INTO filestore("file-name", "mime-type", "original-name", size, encoding) ' +
        'VALUES ($1, $2, $3, $4, $5)',
        [
          fileInfo.filename,
          fileInfo.mimetype,
          fileInfo.originalname,
          fileInfo.size,
          fileInfo.encoding
        ]
      );
      return this.validateTransaction(client);
    } catch(err) {
        console.log('error occurs: ', err);
        await this.abortTransaction(client);
        await unlink('data/upload/' + fileInfo.filename);
        return Promise.reject(err);
    }
  }

  async getFileInfos() {
    const client = await this.pool.connect();
    const result = await client.query(
      'SELECT id, "file-name", "mime-type", "original-name", size, encoding FROM filestore'
    );      
    client.release();
    return result.rows;
  }

  async getFile(id) {
    const client = await this.pool.connect();
    const result = await client.query(
      'SELECT "file-name", "mime-type", "original-name", size, encoding FROM filestore WHERE id=$1',
      [id]
    );
    client.release();
    if (result.rows.length === 0) return Promise.reject('no result');
    const fileInfo = result.rows[0];
    
    const fileReadStream = fs.createReadStream(
      __dirname + '/../data/upload/' + fileInfo['file-name']
    );
    return { fileReadStream, fileInfo };
  }

  async deleteFile(id) {
    let client;
    try {
      client = await this.openTransaction();
      const { rows } = await client.query(
        'SELECT "file-name" FROM filestore WHERE id=$1',
        [id]
      );
      if (rows.length === 0) throw 'no result';
      const fileName = rows[0]['file-name'];
      await client.query(
        'DELETE FROM filestore WHERE id=$1',
        [id]
      );
      await unlink(__dirname + '/../data/upload/' + fileName);
      return this.validateTransaction(client);
    } catch(err) {
      await this.abortTransaction(client);
      return Promise.reject(err);
    }
  }
}
