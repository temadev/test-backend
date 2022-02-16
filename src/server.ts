import http from 'http'

import { printInfo, printServer, printWarn } from './log.service'
import { PingData } from './types'

const HOST = process.env.HOST || 'localhost';
const PORT = Number(process.env.SERVER_PORT || 8080);

const server = http.createServer(async (req, res) => {
  switch (req.method) {
    case 'POST':
      switch (req.url) {
        case '/data':
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const body = JSON.parse(Buffer.concat(buffers).toString());

          const chance = Math.random();
          if (chance < 0.6) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('OK');
            printServer(body);
            pingData.push(body);
          } else if (chance < 0.8) {
            res.statusCode = 500;
            res.end();
          }
          break;
      }
      break;
  }
});

const pingData: PingData[] = [];
server.listen(PORT, HOST, () => {
  printInfo(`Сервер запущен на ${HOST}:${PORT}`);
});

process.on('SIGINT', () => {
  process.exit();
});

process.on('exit', () => {
  const responseTimeSortArr = pingData
    .map((it) => it.responseTime)
    .sort((a, b) => a - b);
  const midTime =
    responseTimeSortArr.reduce((acc, it) => acc + it, 0) /
    responseTimeSortArr.length;
  const medianTime =
    responseTimeSortArr.length % 2
      ? responseTimeSortArr[Math.floor(responseTimeSortArr.length / 2)]
      : (responseTimeSortArr[responseTimeSortArr.length / 2] +
          responseTimeSortArr[responseTimeSortArr.length / 2 - 1]) /
        2;

  console.log('\n');
  if (midTime) printInfo('Среднее время пинга', Math.floor(midTime).toString());
  if (medianTime)
    printWarn('Медианное время пинга', Math.floor(medianTime).toString());
});
