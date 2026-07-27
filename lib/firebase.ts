const FIREBASE_VERSION = "10.14.0";

const loadScript = (src: string) => {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("Browser only"));
    const existing = document.querySelector(`script[src=\"${src}\"]`);
    if (existing) {
      if ((window as any).firebase) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
};

const getFirebaseConfig = () => {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
  };
};

declare global {
  interface Window {
    firebase?: any;
  }
}

const ensureFirebase = async () => {
  if (typeof window === "undefined") {
    throw new Error("Firebase must be initialized in the browser.");
  }

  if (!window.firebase) {
    await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`);
    await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`);
    await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore-compat.js`);
  }

  const firebase = window.firebase;
  if (!firebase.apps.length) {
    const config = getFirebaseConfig();
    console.log("[Firebase] init config:", {
      apiKey: config.apiKey ? "***" : "<missing>",
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId,
    });
    if (!config.apiKey || !config.projectId || !config.appId) {
      throw new Error("Missing Firebase config. Add NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID, and NEXT_PUBLIC_FIREBASE_APP_ID to .env");
    }
    firebase.initializeApp(config);
  }

  if (firebase.auth && !firebase.auth().currentUser) {
    try {
      await firebase.auth().signInAnonymously();
      console.log("Firebase anonymous auth signed in.");
    } catch (error: any) {
      console.warn(
        "Firebase anonymous auth failed:",
        error,
        "— check that the Firebase project matches your .env, that Anonymous auth is enabled, and that the API key is valid."
      );
    }
  }

  return firebase;
};

export const getFirestore = async () => {
  const firebase = await ensureFirebase();
  return firebase.firestore();
};

const logFirestorePermissionError = (error: any, context: string) => {
  const code = error?.code || error?.message || "unknown";
  if (code === "permission-denied" || code === "FirebaseError: Missing or insufficient permissions.") {
    console.error(
      `[Firebase] ${context} failed due to Firestore rules. ` +
      "Ensure your Firestore security rules allow writes for authenticated users (request.auth != null)."
    );
  }
  console.warn(`Firebase ${context} failed:`, error);
};

export const saveLiveClassSession = async (session: any) => {
  try {
    const db = await getFirestore();
    console.log("[Firebase] Saving session with engagement data:", {
      engagement: session.engagement,
      attention: session.attention,
      participantCount: Object.keys(session.participation || {}).length,
    });
    return await db.collection("liveClassSessions").add(session);
  } catch (error: any) {
    logFirestorePermissionError(error, "session save");
    throw error;
  }
};

export const saveEnrollmentProfile = async (profile: any) => {
  try {
    const db = await getFirestore();
    return await db.collection("enrollmentProfiles").add(profile);
  } catch (error: any) {
    logFirestorePermissionError(error, "enrollment save");
    throw error;
  }
};
