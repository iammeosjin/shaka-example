import { File } from '../../models/file';

export default {
  File: {
    url(root: File) {
      if (!root.hash) {
        return null;
      }
      return `http://127.0.0.1:5000/ipfs/${root.hash}/play.mpd`;
    },
  },
};
