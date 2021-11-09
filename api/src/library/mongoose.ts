import mongoose from 'mongoose';

export async function start(
  uri?: string,
): Promise<void> {
  await mongoose.connect(
    uri || process.env.MONGODB_URI || 'mongodb://localhost/player',
    {},
  );
}

export async function stop() {
  await mongoose.disconnect();
}
