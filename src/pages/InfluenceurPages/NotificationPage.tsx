import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
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

export default function NotifyPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const notifRef = collection(db, "users", user.uid, "notifications");
      const notifSnap = await getDocs(query(notifRef, orderBy("createdAt", "desc")));

      const notifList = notifSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationType[];

      setNotifications(notifList);
    };

    fetchNotifications();
  }, []);

  const handleNotificationClick = (notif: NotificationType) => {
    if (notif.targetRoute) {
      navigate(notif.targetRoute);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-32 pt-5">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex items-center space-x-4">
          <img src={sign} alt="Ekanwe Sign" className="w-6 h-6" />
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
              className="bg-white p-4 rounded-lg shadow-lg mb-4 cursor-pointer hover:bg-gray-100 transition"
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
