import chalk from 'chalk'

import { LogType, PingData } from './types'

const printInfo = (message: string | number, title?: string): void => {
  title = (title || 'INFO').padEnd(7);
  console.log(`${chalk.bgBlue(title)} ${message}`);
};

const printError = (message: string | number, title?: string): void => {
  title = (title || 'ERROR').padEnd(7);
  console.log(`${chalk.bgRed(title)} ${message}`);
};

const printWarn = (message: string | number, title?: string): void => {
  title = (title || 'WARN').padEnd(7);
  console.log(`${chalk.bgMagenta(title)} ${message}`);
};

const printSuccees = (message: string | number, title?: string): void => {
  title = (title || 'SUCCEES').padEnd(7);
  console.log(`${chalk.bgGreen(title)} ${message}`);
};

const printClient = (data: PingData, logType: LogType): void => {
  const { pingId, date, responseTime, deliveryAttempt } = data;
  const id = pingId.toString().padEnd(6);
  switch (logType) {
    case 'send':
      printInfo(
        `${id} ${responseTime}ms | ${new Date(date).toLocaleString('ru-RU')}`,
        'SEND',
      );
      return;
    case 'e500':
      printError(
        `${id} ${deliveryAttempt > 1 ? 'попыток: ' + deliveryAttempt : ''}`,
        'ERR500',
      );
      return;
    case 'stuck':
      printWarn(
        `${id} ${deliveryAttempt > 1 ? 'попыток: ' + deliveryAttempt : ''}`,
        'STUCK',
      );
      return;
    case 'succeed':
      printSuccees(
        `${id} ${deliveryAttempt > 1 ? 'попыток: ' + deliveryAttempt : ''}`,
        'SUCCEED',
      );
      return;
    default:
      return;
  }
};

const printServer = (data: PingData): void => {
  const { pingId, date, responseTime, deliveryAttempt } = data;
  const id = pingId.toString().padEnd(6);
  printInfo(
    `${id} ${responseTime}ms | ${new Date(date).toLocaleString('ru-RU')} | ${
      deliveryAttempt > 1 ? 'попыток: ' + deliveryAttempt : ''
    }`,
    'DATA',
  );
};

export {
  printInfo,
  printError,
  printWarn,
  printSuccees,
  printClient,
  printServer,
};
