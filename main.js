const express = require('express');
const app = express();
const v1 = express.Router();
require('dotenv').config();
const util = require('util');
const fs = require('fs');
const MessageService = require('./service/message');
const messageService = new MessageService();
const FileService = require('./service/file');
const fileService = new FileService();
const bodyParser = require('body-parser');
const multer = require('multer');

const readFile = util.promisify(fs.readFile);
const upload = multer({dest: 'upload/temp/'});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api/v1',v1);

const basicAuth = (request,response, next) =>
{
    const authorization = request.headers.authorization;
    console.log('authorization', authorization);
    const encoded = authorization.replace('Basic','');
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    console.log('decoded', decoded);
    //const login = decoded.split(':')[0];
   // const password = decoded.split(':')[1];
    const [login,password]=decoded.split(':');
    if (login==='node'&&password==='password')return next();

    response.sendStatus(401);
}

v1.get('/message',/*(request, response)=>{
    messageService.getMessages().then(
        data => {
            console.log('data: ',data)
            response.send(data);
        }
    )
    */
    async (request, response)=>{
        const data = await messageService.getMessages();
        response.send(data);
    /*
    readFile('./upload/quotes.json')
        .then(data=>{
            response.send(data);
        });*/
});
v1.get('/message/:id',/*(request, response)=>{
    const id = request.params.id;
    console.log(id);
    messageService.getMessage(id).then(
        message => {
            message? response.send(message):response.sendStatus(404);
        }
    )
        .catch(error=>{
            response.sendStatus(400).end(error);
        });*/
    async (request, response)=>{
        try {
            const id = request.params.id;
            const message = await messageService.getMessage(id);
            message? response.send(message):response.sendStatus(404);
            
        }
        catch (e) {
            response.sendStatus(400).end(e);
        }
   // response.send('ok');
});

v1.post('/message', basicAuth, /*(request,response)=>{
    const message = request.body;
    messageService.insertMessage(message).then(
        result=>{
            response.send(result);
        }
    )
        .catch(error=>{
            console.log('error ',error);
            response.sendStatus(400).end(error);
        })
        */
    async (request,response)=>{
        const message = request.body;
        try {
            const result = await messageService.insertMessage(message);
            response.send(result);
        }
        catch (e) {
            response.sendStatus(400).end(e);
        }
   /* console.log(message);
    response.send('ok');*/
})

v1.put('/message/:id', basicAuth, (request, response)=>{
    const id = request.params.id;
    const message = request.body;
    messageService.updateMessage(message, id)
        .then((res)=>{
            response.sendStatus(!res.isFind?404:(!res.isModified?304:200));
        })
        .catch(error=>{
            console.log('error', error);
            response.sendStatus(400).end(error);});

});

v1.delete('/message/:id', basicAuth, (request, response)=>{
    const id = request.params.id;
    messageService.deleteMessage(id)
        .then((isDeleted)=>{
                response.sendStatus(isDeleted?200:404);
        }
        )
    .catch(error=>{
        response.sendStatus(400).end(error);
    });
});

v1.post('/file', upload.single('MyFile'),(request, response)=>{
    console.log('file? ', request.file);
    fileService.saveFileInfos(request.file)
    .then(()=>{
        response.sendStatus(200);
    })
        .catch(err=>{
            console.log('save KO ', err);
            response.sendStatus(400).end(err);
        })
});
/* ancient version
v1.get('/file',(request, response)=>{
    //response.download('./upload/Diagrammme_UML_examen_01-04-2019.odt');

    const readStream = fs.createReadStream('./upload/Diagrammme_UML_examen_01-04-2019.pdf');
    readStream.pipe(response);
})
*/
v1.get('/file',(request, response)=> {
    fileService.getFileInfos()
        .then(result=>{
            response.send(result);
        })
        .catch(err=>{
            console.log('error get all file infos',err);
            response.sendStatus(500).end(err);
        })
});

v1.get('/file/:id', (request, response)=> {
    const id = request.params.id;
    fileService.getFile(id)
        .then(({fileReadStream, fileInfo})=>{
            response.setHeader('Content-disposition', 'attachment; filename = '+fileInfo['original-name']);
            response.setHeader('Content-type', fileInfo['mime-type']);
            response.setHeader('Content-length', fileInfo.size);
            fileReadStream.pipe(response);
        })
        .catch(err=>{
            console.log('err une file ', err);
            response.sendStatus(404).end(err);
        })
});

v1.delete('/file/:id',(request, response)=> {
    const id = request.params.id;
    fileService.deleteFile(id)
        .then(()=> {
            response.sendStatus(200);
        })
        .catch(err=>{
            console.log('err une file ', err);
            response.sendStatus(500).end(err);
        })
});

module.exports = app;
