import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqPM6Dm2f6G_ENB3DSy1eVih7n8pOAAio",
  authDomain: "dressingroom-218a3.firebaseapp.com",
  projectId: "dressingroom-218a3",
  storageBucket: "dressingroom-218a3.firebasestorage.app",
  messagingSenderId: "591645173123",
  appId: "1:591645173123:web:215b9e3bfbdb765d8c02b6",
  measurementId: "G-ZSN6N6MT46"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase initialized");

async function fetchClothes() {
  const clothesCol = collection(db, 'clothes');
  const clothesSnapshot = await getDocs(clothesCol);
  const clothesList = clothesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return clothesList;
}

async function renderApp(activeTab = 'clothes') {
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = `
    <nav class="p-6 flex gap-4">
      <button onclick="renderApp('clothes')" class="px-4 py-2 bg-black text-white rounded-xl">Clothes</button>
      <button onclick="renderApp('collections')" class="px-4 py-2 bg-zinc-100 rounded-xl">Collections</button>
    </nav>
    <div id="content" class="p-6"></div>
  `;

  const contentContainer = document.getElementById('content');
  contentContainer.innerHTML = '<h1 class="text-3xl font-bold p-4">Loading...</h1>';
  
  try {
    if (activeTab === 'clothes') {
      const clothes = await fetchClothes();
      contentContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${clothes.map(item => `
            <div class="bg-white rounded-3xl border border-zinc-200 p-5">
              <img src="${item.image_url || 'https://picsum.photos/400/600'}" alt="${item.name}" class="w-full h-64 object-cover rounded-2xl mb-4" referrerPolicy="no-referrer" />
              <h3 class="text-lg font-bold">${item.name}</h3>
              <p class="text-zinc-500 text-sm">${item.type} - ${item.model}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else if (activeTab === 'collections') {
      const collectionsCol = collection(db, 'collections');
      const collectionsSnapshot = await getDocs(collectionsCol);
      const collectionsList = collectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      contentContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${collectionsList.map(col => `
            <div class="bg-white rounded-3xl border border-zinc-200 p-5">
              <h3 class="text-lg font-bold">${col.name}</h3>
              <p class="text-zinc-500 text-sm">${col.description || 'No description'}</p>
            </div>
          `).join('')}
        </div>
      `;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    contentContainer.innerHTML = '<h1 class="text-3xl font-bold p-4 text-red-500">Error loading data</h1>';
  }
}

// Make renderApp available globally
window.renderApp = renderApp;

renderApp();
