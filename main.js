const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();
const v1 = express.Router();
require('dotenv').config();

const { basicAuth } = require('./middleware/basic-auth');
const MessageService = require('./services/message');
const messageService = new MessageService();
const FileService = require('./services/file');
const fileService = new FileService();
const upload = multer({ dest: 'data/upload/' });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api/v1', v1);

v1.get('/message', async (request, response) => {
    const data = await messageService.getMessages();
    response.send(data);
});

v1.get('/message/:id', async (request, response) => {
    const id = request.params.id;
    try {
        const message = await messageService.getMessage(id);
        message ? response.send(message) : response.sendStatus(404);
    } catch (error) {
        response.sendStatus(400).end(error);
    }
});

v1.post('/message', basicAuth, async (request, response) => {
    const message = request.body;
    try {
        const result = await messageService.insertMessage(message);
        response.send(result);
    } catch (error) {
        console.log('error occurs: ', error);
        response.sendStatus(400).end(error);
    }
});

v1.put('/message/:id', basicAuth, async (request, response) => {
    const id = request.params.id;
    const message = request.body;
    try {
        const result = await messageService.updateMessage(message, id);
        if (!result.isFind) return response.sendStatus(404);
        if (!result.isModified) return response.sendStatus(304);
        response.sendStatus(200);
    } catch (error) {
        console.log('error occurs: ', error);
        response.sendStatus(400).end(error);
    }
});

v1.delete('/message/:id', basicAuth, async (request, response) => {
    const id = request.params.id;
    try {
        const isDeleted = await messageService.deleteMessage(id);
        response.sendStatus(isDeleted ? 200 : 404);
    } catch (error) {
        response.sendStatus(400).end(error);
    }
});

v1.post('/file', upload.single('myFile'), async (request, response) => {
    try  {
        await fileService.saveFileInfos(request.file);
        response.sendStatus(200);
    } catch (error) {
        console.log('error occurs during save: ', error);
        response.sendStatus(500).end(error);
    }
});

v1.get('/file', async (request, response) => {
    try {
        const result = await fileService.getFileInfos();
        response.send(result);
    } catch (error) {
        console.log('error occurs: ', error);
        response.sendStatus(500).end(error);
    }
});

v1.get('/file/:id', async (request, response) => {
    const id = request.params.id;
    try {
        const { fileReadStream, fileInfo } = await fileService.getFile(id);
        response.setHeader(
            'Content-disposition',
            'attachment; filename=' + fileInfo['original-name']
        );
        response.setHeader('Content-type', fileInfo['mime-type']);
        response.setHeader('Content-length', fileInfo.size);
        fileReadStream.pipe(response);
    } catch (error) {
        console.log('error occurs: ', error);
        response.sendStatus(404).end(error);
    }
});

v1.delete('/file/:id', async (request, response) => {
    const id = request.params.id;
    try {
        await fileService.deleteFile(id);
        response.sendStatus(200);
    } catch (error) {
        console.log('error occurs: ', error);
        response.sendStatus(500).end(error);
    }
});

module.exports = app;
