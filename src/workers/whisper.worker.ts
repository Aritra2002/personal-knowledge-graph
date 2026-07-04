import { pipeline } from '@xenova/transformers';

let transcriber: any = null;

self.onmessage = async (e) => {
  if (e.data.audio) {
    try {
      if (!transcriber) {
        // Initialize the pipeline
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
      }
      const output = await transcriber(e.data.audio);
      self.postMessage({ status: 'success', text: output.text });
    } catch (err: any) {
      self.postMessage({ status: 'error', message: err.message });
    }
  }
};
