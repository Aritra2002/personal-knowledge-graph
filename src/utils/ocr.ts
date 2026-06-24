import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Point pdfjs to the worker from public or node_modules. We can rely on CDN for simplicity in this frontend app.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const extractTextFromImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(file, 'eng').then(({ data: { text } }) => {
      resolve(text);
    }).catch(reject);
  });
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer as any).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      resolve(fullText.trim());
    } catch (e) {
      reject(e);
    }
  });
};

export const processFileForOCR = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf') {
    return await extractTextFromPDF(file);
  } else if (file.type.startsWith('image/')) {
    return await extractTextFromImage(file);
  } else {
    throw new Error('Unsupported file type for OCR. Please upload a PDF or Image.');
  }
};
