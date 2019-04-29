const {Pool} = require('pg');
const fs = require('fs');
const util = require('util');
const unlink = util.promisify(fs.unlink);

module.exports = class FileService {
    constructor(){
       /* const client = new Client();
        client.connect()
            .then(()=>{
                console.log('PG OK');
            })
            .catch(error=>{
                console.log('err0r',error);
            });*/
       this.pool = new Pool();
    }

    openTransaction() {
        let client;
        return this.pool.connect()
            .then(connectedClient => {
                client = connectedClient;
                return client.query('BEGIN');
            })
            .then(() => client);
    }

    validateTransaction(client) {
        return client.query('COMMIT')
            .then(() => {
                client.release();
            });
    }

    abortTransaction(client) {
        return client.query('ROLLBACK')
            .then(() => {
                client.release();
            });
    }

/* version previos
    getConnectedClient(){
        const client = new Client();
        return client.connect()
            .then(()=>client)
            .catch(error=>{
                console.log('err0r PG KO',error);
                throw error;
            });
    }
*/
    saveFileInfos(fileInfo){
        let client;
        return this.openTransaction()
            .then(()=>{
                return client.query(
                    'INSERT INTO filestore("file-name","mime-type", "original-name", size, encoding) VALUES ($1,$2,$3,$4,$5)',
                    [
                        fileInfo.filename,
                        fileInfo.mimetype,
                        fileInfo.originalname,
                        fileInfo.size,
                        fileInfo.encoding
                    ]
                );
            })
            .then(()=>{
                return this.validateTransaction(client);
            })
            .catch(
                err=>{
                    console.log("error save file", err);
                    return this.abortTransaction(client).then(()=>{
                        return unlink('upload/temp/'+fileInfo.filename);
                    })
                        .then(()=>Promise.reject(err));
                }
            );
    }

    getFileInfos(){
        let client;
        return this.pool.connect()
            .then( connectedCloient=>{
                client = connectedCloient;
                return client.query(
                    'SELECT id, "file-name","mime-type", "original-name", size, encoding FROM filestore'
                );
            })
            .then((result)=>{
                client.release();
                return result.rows;
            });
    }

    getFile(id){
        let client;
        return this.pool.connect()
            .then(connectedClient=>{
                client = connectedClient;
                return client.query('' +
                    'SELECT "file-name","mime-type", "original-name", size, encoding FROM filestore WHERE id=$1',
                    [id]);
            })
            .then(result => {
                if(result.rows.length === 0) return Promise.reject('no result');
                const fileInfo = result.rows[0];
                const fileReadStream = fs.createReadStream(__dirname+'/../upload/temp/'+fileInfo['file-name']);
                return {fileReadStream, fileInfo};
            })
    }

    deleteFile(id){
        let client;
        let fileName;
        return this.openTransaction()
            .then(connectedClient=>{
                client = connectedClient;
                return client.query(
                    'SELECT "file-name" FROM filestore WHERE id=$1',
                    [id]
                )

            })
            .then(({rows})=>{
                if (rows.length===0) return Promise.reject('no result 2');
                fileName = rows[0]['file-name'];
                return client.query(
                    'DELETE FROM filestore WHERE id=$1',
                    [id]
                );

            })
            .then(()=>{
                return unlink(__dirname+'/../upload/temp/'+fileName);
            })
            .then(()=>{
                return this.validateTransaction(client);
            })
            .catch((err)=>{
                return this.abortTransaction(client)
                    .then(()=>Promise.reject(err));
            });
    }
}