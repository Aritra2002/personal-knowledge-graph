import * as pdfjsLib from 'pdfjs-dist';

// Use bundled worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: { str?: string } | unknown) => ('str' in (item as Record<string, unknown>) ? (item as { str: string }).str : '')).join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText.trim();
};
