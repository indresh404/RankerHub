import { query, collection, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const fetchUserProfileByUsername = async (username) => {
  if (!username) return null;

  try {
    const q1 = query(collection(db, "users"), where("githubUsername", "==", username));
    const snapshot1 = await getDocs(q1);
    if (!snapshot1.empty) {
      return snapshot1.docs[0].data();
    }

    const docRef = doc(db, "users", username);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }

    return null;
  } catch (error) {
    console.error("Error fetching comparison user:", error);
    throw error;
  }
};