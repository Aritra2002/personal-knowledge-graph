import { pipeline, env } from '@xenova/transformers';

// Disable local models loading in favor of CDN
env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber: any = null;

export const transcribeAudioBlob = async (blob: Blob): Promise<string> => {
  if (!transcriber) {
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
  }
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const audioData = audioBuffer.getChannelData(0);
  
  const result = await transcriber(audioData);
  return result.text;
};

export const speakText = (text: string) => {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  
  // Only speak actual text without markdown syntax when possible, but for simplicity we just read it.
  const plainText = text.replace(/[#*`_\[\]>]/g, '');
  const utterance = new SpeechSynthesisUtterance(plainText);
  
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
