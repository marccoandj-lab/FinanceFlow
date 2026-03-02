import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDOFNyYI80qML4liZETIDxqLSrh6UuSyxU",
  authDomain: "financeflow-97221.firebaseapp.com",
  projectId: "financeflow-97221",
  storageBucket: "financeflow-97221.firebasestorage.app",
  messagingSenderId: "177010368302",
  appId: "1:177010368302:web:26219e82a95055b48ae4bf"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;
