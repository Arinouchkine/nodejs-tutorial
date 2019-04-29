const { basicAuth } = require('./basic-auth');

describe('Basic auth', () => {
    let request;
    const response = {
        sendStatus: jest.fn()
    }
    const next = jest.fn();

    beforeEach(() => {
        request = {
            headers: {
                authorization: 'Basic '
            }
        };
    });

    it('Should send status 401 if authentication fails', () => {
        request.headers.authorization += Buffer.from('Hello:World').toString('base64')
        basicAuth(request, response);
        expect(response.sendStatus).toBeCalledWith(401);
    });

    it('Should call next() if authentication success', () => {
        request.headers.authorization += Buffer.from('node:password', 'utf8').toString('base64')
        basicAuth(request, response, next);
        expect(response.sendStatus).not.toBeCalled();
        expect(next).toBeCalled();
    });
});
