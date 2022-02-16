export interface PingInfo {
  pingId: number;
  date: number;
  responseTime: number;
}

export interface PingData extends PingInfo {
  deliveryAttempt: number;
}

export type LogType = 'send' | 'succeed' | 'e500' | 'stuck';
