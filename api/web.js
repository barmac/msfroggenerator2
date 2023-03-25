import fastify from 'fastify';
import { readFile } from 'fs/promises';
import { nanoid } from 'nanoid';

const app = fastify({ logger: true });
const flag = await readFile('/flag.txt', 'utf-8');

const designs = new Map();
const reports = [];

app.get('/api/get', (req, res) => {
    const { id } = req.query;
    if (!designs.has(id)) return res.send([]);
    return res.send(designs.get(id));
});

app.post('/api/create', {
    schema: {
        body: {
            type: 'array',
            minItems: 0,
            maxItems: 100,
            items: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        enum: ['base', 'msanger', 'msdrops', 'mseyes' , 'mskiss', 'msnose', 'mspoop', 'mstongue']
                    },
                    x: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1280
                    },
                    y: {
                        type: 'number',
                        minimum: 0,
                        maximum: 720
                    },
                    zIndex: {
                        type: 'integer',
                        minimum: 0,
                        maximum: 100
                    }
                }
            }
        }
    }
}, (req, res) => {
    // this is only here because we dont want you to cause OOMs
    // if you hit this and need to try again, restart the instance.
    if (designs.size > 100) {
        return res.send('Too many designs!');
    }
    const id = nanoid(10);
    designs.set(id, req.body);
    return res.send(id);
});

app.get('/api/reports/get', (req, res) => {
    return res.send(reports);
});

app.post('/api/reports/add', {
    schema: {
        body: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    maxLength: 1000,
                },
                screenshot: {
                    type: 'string',
                    maxLength: 500 * 1000
                }
            }
        }
    }
}, (req, res) => {
    const {url, screenshot} = req.body;

    if (req.headers.authorization !== `Bearer ${flag}`) {
        return res.status(403).send('Unauthorized!');
    }
    // this is only here because we dont want you to cause OOMs
    // if you hit this and need to try again, restart the instance.
    if (reports.length > 20) {
        return res.send('Too many reports!');
    }

    reports.push({ url, screenshot });

    return res.send('Report received!');
});

app.listen({
    host: '0.0.0.0',
    port: 8080
});