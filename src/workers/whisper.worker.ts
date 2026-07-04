import { pipeline } from '@xenova/transformers';

type SpeechRecognitionPipeline = (audioData: Float32Array) => Promise<{ text: string }>;
let transcriber: SpeechRecognitionPipeline | null = null;

self.onmessage = async (e) => {
  if (e.data.audio) {
    try {
      if (!transcriber) {
        // Initialize the pipeline
        transcriber = (await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en')) as unknown as SpeechRecognitionPipeline;
      }
      const output = await transcriber(e.data.audio);
      self.postMessage({ status: 'success', text: output.text });
    } catch (err: unknown) {
      self.postMessage({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }
};
