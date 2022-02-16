import bodyParser from 'body-parser'
import express from 'express'
import process from 'process'

import { printInfo, printServer, printWarn } from './log.service'
import { PingData } from './types'

const PORT = Number(process.env.SERVER_PORT || 8080);
const app = express();

const pingData: PingData[] = [];

app.use(bodyParser.json());

app.post('/data', (req, res) => {
  const chance = Math.random();
  if (chance < 0.6) {
    res.send('OK');
    printServer(req.body);
    pingData.push(req.body);
  } else if (chance < 0.8) {
    res.status(500).send();
  }
});

app.listen(PORT, () => {
  printInfo(`Сервер запущен на порту ${PORT}`);
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
