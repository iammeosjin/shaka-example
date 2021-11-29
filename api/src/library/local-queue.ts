import Queue from 'p-queue';

export default new Queue({ concurrency: 1 });
