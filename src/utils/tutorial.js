import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import tutorialPdf from '../../Dieta_29062026.pdf';

const tutorialFileName = 'Dieta_29062026.pdf';

const blobToBase64 = (blob) => (
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  })
);

export const openTutorial = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const response = await fetch(tutorialPdf);
      if (!response.ok) {
        throw new Error('No se pudo cargar el tutorial.');
      }

      const base64Data = await blobToBase64(await response.blob());
      const savedFile = await Filesystem.writeFile({
        path: tutorialFileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      await Share.share({
        title: 'Tutorial Vida Mediterránea',
        text: 'Tutorial de uso de Vida Mediterránea',
        url: savedFile.uri,
        dialogTitle: 'Abrir tutorial',
      });
      return;
    }

    window.open(tutorialPdf, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error('Error opening tutorial:', error);
    window.alert('No se pudo abrir el tutorial. Comprueba que tienes instalada una aplicación para leer archivos PDF.');
  }
};
