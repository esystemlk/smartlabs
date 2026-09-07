import Constants from 'expo-constants';

/**
 * Public Firebase web config for project `smart-labs-ekk8j` — the SAME project
 * the website uses, so accounts and credits are shared. These values are public
 * by design (Firebase security is enforced by Auth + Firestore rules, not by
 * hiding the config).
 */
export const firebaseConfig = {
  projectId: 'smart-labs-ekk8j',
  appId: '1:43848204138:web:1aafd9e847ef780b60ef13',
  apiKey: 'AIzaSyCOwWJwPln4v4ihUBu-3L5QRj34UR-ext0',
  authDomain: 'smart-labs-ekk8j.firebaseapp.com',
  storageBucket: 'smart-labs-ekk8j.firebasestorage.app',
  messagingSenderId: '43848204138',
};

/** Base URL of the Next.js backend that hosts the scoring / TTS / question APIs. */
export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://www.smartlabs.lk';
