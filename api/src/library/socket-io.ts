import { Server } from 'socket.io';

const io = new Server({
  cors: {
    methods: ['GET', 'POST'],
    origin: '*',
  },
});

io.setMaxListeners(1);

io.on('connection', async (socket) => {
  console.log('connected');
});

export default io;
