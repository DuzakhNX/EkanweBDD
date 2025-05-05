import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import sign from "../../assets/ekanwesign.png";
import loupe from "../../assets/loupe.png";
import menu from "../../assets/menu.png";
import BottomNavbar from "./BottomNavbar";

interface NotificationType {
  id: string;
  message: string;
  targetRoute?: string;
  read: boolean;
}

export default function NotificationPageInfluenceur() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notifRef = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(notifRef, (snapshot) => {
      const notifList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationType[];

      setNotifications(notifList);
    });

    return () => unsubscribe();
  }, []);


  const handleNotificationClick = async (notif: NotificationType) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const notifDocRef = doc(db, "users", user.uid, "notifications", notif.id);
      await updateDoc(notifDocRef, { read: true });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );

      if (notif.targetRoute) {
        navigate(notif.targetRoute);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification :", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-32 pt-5">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="relative">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-4 bg-red-500 text-white rounded-full text-xs px-2">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4" onClick={() => navigate("/dealsinfluenceur")}>
          <img src={sign} alt="Ekanwe Sign" className="w-6 h-6"/>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex items-center bg-white/10 border border-black rounded-lg px-3 py-2">
          <div className="text-xl mr-3">
            <img src={loupe} alt="loupe" className="w-6 h-6" />
          </div>
          <input
            type="text"
            placeholder="Recherche"
            className="flex-grow outline-none bg-transparent text-2xs"
          />
          <div className="text-gray-400 text-lg ml-2">
            <img src={menu} alt="Menu" className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="px-4">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-lg shadow-lg mb-4 cursor-pointer transition ${notif.read ? "bg-white" : "bg-orange-100"
                }`}
            >
              <p className="text-sm font-semibold">{notif.message}</p>
            </div>
          ))
        ) : (
          <div className="bg-[#F5F5E7] mt-20 p-2 rounded-lg shadow-lg mb-4">
            <p className="text-sm text-center text-gray-600">Aucune notification pour l'instant</p>
          </div>
        )}
      </div>

      <div className="px-4 mb-20 mt-20">
        <button
          onClick={() => navigate(-1)}
          className="w-full border border-black py-3 rounded-lg text-base text-[#1A2C24] bg-white/10"
        >
          Retour
        </button>
      </div>

      <BottomNavbar />
    </div>
  );
}
