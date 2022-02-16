import EventEmitter from 'events'
import http from 'http'
import https from 'https'

import { printClient, printError, printInfo, printSuccees, printWarn } from './log.service'
import { PingData, PingInfo } from './types'

const PING_START_ID = 0;
const PING_URL = process.env.PING_URL!;
const PING_INTERVAL = Number(process.env.PING_INTERVAL || 1000);
const SERVER_URL = process.env.SERVER_URL!;
const SERVER_TIMEOUT = Number(process.env.SERVER_TIMEOUT || 10000);
const MAX_DELIVERY_ATTEMPT = Number(process.env.MAX_DELIVERY_ATTEMPT || 10);

const pingState = {
  total: 0,
  succeed: 0,
  e500: 0,
  stuck: 0,
};

const emitter = new EventEmitter();

const ping = (pingId: number): void => {
  const date = new Date().getTime();
  https.get(PING_URL, (res) => {
    res.once('data', () => {
      const responseTime = new Date().getTime() - date;
      emitter.emit('send', { pingId, date, responseTime });
    });
    res.on('error', (err) => {
      throw new Error(err.message);
    });
  });
};

const sendPingData = ({
  pingId,
  date,
  responseTime,
  deliveryAttempt,
}: PingData): void => {
  pingState.total++;

  try {
    const data = JSON.stringify({
      pingId,
      date,
      responseTime,
      deliveryAttempt,
    });
    const options: http.RequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
      timeout: SERVER_TIMEOUT,
    };

    const req = http.request(SERVER_URL, options, (res) => {
      const body: Uint8Array[] = [];
      res.on('data', (chunk: Uint8Array) => body.push(chunk));
      res.on('end', () => {
        const resStr = Buffer.concat(body).toString();
        if (resStr === 'OK') {
          emitter.emit('succeed', {
            pingId,
            date,
            responseTime,
            deliveryAttempt,
          });
        } else if (res.statusCode === 500) {
          emitter.emit('e500', { pingId, date, responseTime, deliveryAttempt });
        }
      });
      res.on('error', () => {});
    });

    req.on('timeout', () => {
      emitter.emit('stuck', { pingId, date, responseTime, deliveryAttempt });
    });

    req.on('error', () => {
      process.exit();
    });

    req.write(data);
    req.end();
  } catch (err) {}
};

emitter.on('send', (data: PingInfo) => {
  printClient({ ...data, deliveryAttempt: 1 }, 'send');
  sendPingData({ ...data, deliveryAttempt: 1 });
});

emitter.on('succeed', (data: PingData) => {
  pingState.succeed++;
  printClient(data, 'succeed');
});

emitter.on('e500', (data: PingData) => {
  pingState.e500++;

  if (data.deliveryAttempt < MAX_DELIVERY_ATTEMPT) {
    const delay = 1000 * Math.pow(2, data.deliveryAttempt);
    printClient(data, 'e500');
    setTimeout(() => {
      sendPingData({ ...data, deliveryAttempt: data.deliveryAttempt + 1 });
    }, delay);
  }
});

emitter.on('stuck', (data: PingData) => {
  pingState.stuck++;

  if (data.deliveryAttempt < MAX_DELIVERY_ATTEMPT) {
    const delay = 1000 * Math.pow(2, data.deliveryAttempt);
    printClient(data, 'stuck');
    setTimeout(() => {
      sendPingData({ ...data, deliveryAttempt: data.deliveryAttempt + 1 });
    }, delay);
  }
});

process.on('SIGINT', () => {
  process.exit();
});

process.on('exit', () => {
  console.log('\n');
  const inProcess =
    pingState.total - pingState.succeed - pingState.e500 - pingState.stuck;
  printInfo('Всего сделано запросов', pingState.total.toString());
  printSuccees('Успешных запросов', pingState.succeed.toString());
  printError('Запросов с 500 ошибкой', pingState.e500.toString());
  printWarn('Запросов зависло', pingState.stuck.toString());
  if (inProcess) printInfo('Незавершенных запросов', inProcess.toString());
});

const main = () => {
  let i = PING_START_ID;
  setInterval(() => {
    i++;
    ping(i);
  }, PING_INTERVAL);
};

main();
