import { CustomerDocumentType } from '../types';

export const DOCUMENT_TYPE_LABELS: Record<CustomerDocumentType, string> = {
  commercial_register: 'السجل التجاري',
  tax_card: 'البطاقة الضريبية',
  contract: 'عقد الاتفاق / التوريد',
  guarantee_cheque: 'شيك ضمان',
  national_id: 'بطاقة الرقم القومي للمفوض',
  other: 'مستند آخر',
};

/**
 * Reads a user-uploaded file and compresses images so they sync seamlessly in cloud
 */
export async function processUploadFile(file: File): Promise<{
  dataUrl: string;
  name: string;
  type: string;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    // If it's an image, resize & compress to ensure crisp readability while staying lightweight (~100-300KB)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              dataUrl: e.target?.result as string,
              name: file.name,
              type: file.type,
              size: file.size,
            });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

          resolve({
            dataUrl: compressedDataUrl,
            name: file.name,
            type: 'image/jpeg',
            size: Math.round((compressedDataUrl.length * 3) / 4),
          });
        };
        img.onerror = () => {
          resolve({
            dataUrl: e.target?.result as string,
            name: file.name,
            type: file.type,
            size: file.size,
          });
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      // PDF or other documents
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          dataUrl: e.target?.result as string,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
