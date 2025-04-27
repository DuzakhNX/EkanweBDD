import { db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const sendNotification = async ({
  toUserId,
  message,
  type,
  fromUserId,
  relatedDealId,
  targetRoute
}: {
  toUserId: string;
  message: string;
  type: string;
  fromUserId: string;
  relatedDealId?: string;
  targetRoute?: string;
}) => {
  try {
    const notifRef = collection(db, "users", toUserId, "notifications");
    await addDoc(notifRef, {
      message,
      type,
      fromUserId,
      relatedDealId: relatedDealId || null,
      targetRoute: targetRoute || null,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification :", error);
  }
};
