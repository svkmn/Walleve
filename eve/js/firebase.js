(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyAYmCQRT5SxLxWOoV2F-N8KkOGU2cwftpA",
    authDomain: "wall-eve-b28aa.firebaseapp.com",
    projectId: "wall-eve-b28aa",
    storageBucket: "wall-eve-b28aa.firebasestorage.app",
    messagingSenderId: "99484213139",
    appId: "1:99484213139:web:c7ecdcecf7461958891266"
  };

  let db = null;

  async function loadFirebase() {
    if (db) return db;

    try {
      const firebaseApp = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js");
      const firestore = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
      const app = firebaseApp.initializeApp(firebaseConfig);
      db = firestore.getFirestore(app);
      return db;
    } catch (error) {
      console.warn("Firebase is unavailable right now. The page will keep working with local storage.", error);
      return null;
    }
  }

  window.wallEveLoadFirebase = loadFirebase;
})();