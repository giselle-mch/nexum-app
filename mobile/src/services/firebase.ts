import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAX_MFVf0s0UOX5HCpV1lg4ZJGSiLP1pjc",
  authDomain: "nexum-ba05a.firebaseapp.com",
  databaseURL: "https://nexum-ba05a-default-rtdb.firebaseio.com",
  projectId: "nexum-ba05a",
  messagingSenderId: "949428215648",
  appId: "1:949428215648:web:6e09cd3e72ad325fce8805",
  measurementId: "G-6QCQ1JVHDB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(
  app,
  Platform.OS === "web"
    ? {
        // Reduces WebChannel issues in some localhost/proxy/browser setups.
        experimentalForceLongPolling: true,
      }
    : {
        experimentalAutoDetectLongPolling: true,
      }
);
