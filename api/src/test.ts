/* eslint-disable no-console */
import cp from 'child_process';
import os from 'os';
import Queue from 'p-queue';
import R from 'ramda';
import { EventEmitter } from 'events';

/*
class Child {
  id: number;

  child: cp.ChildProcess;

  status: number;

  constructor(id: number) {
    this.child = cp.fork('./src/library/convert-video-worker.ts', {
      execArgv: ['node_modules\\ts-node\\dist\\bin.js'],
    });
    this.id = id;
    this.status = 0;
  }
}
*/

type Child = {
  id: number;
  child: cp.ChildProcess;
  status: number;
};

class Pool {
  pool: Child[];

  broker: EventEmitter;

  queue: Queue;

  constructor(num: number) {
    this.queue = new Queue({ concurrency: 1 });
    this.broker = new EventEmitter();
    this.pool = R.times(
      (index) => {
        const child = cp.fork('./src/library/convert-video-worker.ts', {
          execArgv: ['node_modules\\ts-node\\dist\\bin.js'],
        });

        child.on('message', (id) => {
          const childPool = this.pool.find((p) => p.id === id);
          if (childPool) {
            childPool.status = 0;
            this.broker.emit('message', id);
          }
        });

        return {
          id: index,
          child,
          status: 0,
        };
      }, num,
    );
  }

  process(message: string) {
    this.queue.add(async () => {
      console.log('message', message);
      const fork = this.pool.find((child) => child.status === 0);
      if (fork) {
        fork.status = 1;
        fork.child.send({
          id: fork.id,
          message,
        });
      } else {
        const newlyFreedChild: Child = await new Promise((resolve, reject) => {
          this.broker.on('message', (id: number) => {
            const childPool = this.pool.find((p) => p.id === id);
            if (!childPool) {
              return reject(new Error('Child not found'));
            }
            return resolve(childPool);
          });
        });

        newlyFreedChild.status = 1;
        newlyFreedChild.child.send({
          id: newlyFreedChild.id,
          message,
        });
      }
    });
  }

  async onIdle() {
    await this.queue.onIdle();
    await this.queue.onEmpty();
    console.log('close');
    // this.pool.map((p) => p.child.disconnect());
  }
}

(async () => {
  const pool = new Pool(4);

  pool.process('a');
  pool.process('b');
  pool.process('c');
  pool.process('d');
  pool.process('e');
  pool.process('g');

  console.log('pending', pool.queue.pending);
  await pool.onIdle();
})();
