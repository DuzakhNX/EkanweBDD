import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { StatusBar, Style } from '@capacitor/status-bar';

// Fonction pour prendre une photo
export const takePicture = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    });
    return image.webPath;
  } catch (error) {
    console.error('Erreur lors de la prise de photo:', error);
    throw error;
  }
};

// Fonction pour sélectionner une image depuis la galerie
export const pickImage = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos
    });
    return image.webPath;
  } catch (error) {
    console.error('Erreur lors de la sélection de l\'image:', error);
    throw error;
  }
};

// Fonction pour obtenir la position actuelle
export const getCurrentPosition = async () => {
  try {
    const coordinates = await Geolocation.getCurrentPosition();
    return {
      latitude: coordinates.coords.latitude,
      longitude: coordinates.coords.longitude
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de la position:', error);
    throw error;
  }
};

// Fonction pour configurer la barre de statut
export const configureStatusBar = async () => {
  try {
    await StatusBar.setBackgroundColor({ color: '#FF6B2E' });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch (error) {
    console.error('Erreur lors de la configuration de la barre de statut:', error);
  }
}; 