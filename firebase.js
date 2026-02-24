import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDRS3BBcG5cVz8M7WIZCZ3Whx8uzd6h5F0",
  authDomain: "anchored-13de6.firebaseapp.com",
  projectId: "anchored-13de6",
  storageBucket: "anchored-13de6.firebasestorage.app",
  messagingSenderId: "815905855475",
  appId: "1:815905855475:web:adb9136b1947b2b1dd2486",
  measurementId: "G-DL6YFVMEV5"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };

export const db = getFirestore(app);
