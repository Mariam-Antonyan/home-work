import http from 'http';

interface Request {
    url: string;
    method: string;
    headers: { [key: string]: string };
}

interface Response {
    statusCode: number;
    headers: { [key: string]: string };
    body: string;
}

type RequestHandler = (request: Request) => Response;

const handleRequest: RequestHandler = (request) => {
    const { url, method, headers } = request;

    const response: Response = {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Hello, TypeScript!',
    };

    console.log(`Received ${method} request for ${url}`);
    console.log('Headers:', headers);

    return response;
};

const server = http.createServer((req, res) => {
    const request: Request = {
        url: req.url || '',
        method: req.method || '',
        headers: req.headers,
    };

    const response = handleRequest(request);

    res.writeHead(response.statusCode, response.headers);
    res.end(response.body);
});

const port = 3000;

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
