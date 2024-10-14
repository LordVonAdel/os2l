import { EventEmitter } from "events"

type OS2LServerOptions = {
  doPublish: boolean,
  port: number
}

export declare class OS2LServer extends EventEmitter {

  constructor(options: OS2LServerOptions);

  start(callback?: () => void): Promise<void>;
  stop(): void;
  feedback(name: string, state: boolean, page?: string): void;
  
}

type OS2LClientOptions = {
  port: number,
  host: string,
  useDNS_SD: boolean,
  autoReconnect: boolean,
  autoReconnectInterval: number
}

export declare class OS2LClient extends EventEmitter {

  constructor(options: OS2LClientOptions);

  connect(callback?: () => void): Promise<Void>;
  close(): void;
  buttonOn(name: string): void;
  buttonOff(name: string): void;
  command(id: number, param: number): void;
  beat(change: boolean, pos: number, bpm: number): void;
  custom(object: any): void;

  get isConnected(): boolean;

}
