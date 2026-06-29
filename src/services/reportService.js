import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export const reportUser = async (reporterUid, reportedUid, reason) => {
  // Prevent duplicate reports
  const q = query(
    collection(db, "reports"),
    where("reporterUid", "==", reporterUid),
    where("reportedUid", "==", reportedUid),
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error("You have already reported this user.");
  }

  await addDoc(collection(db, "reports"), {
    reporterUid,
    reportedUid,
    reason,
    timestamp: serverTimestamp(),
  });
};
