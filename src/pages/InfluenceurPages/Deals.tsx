import { useEffect, useRef, useState } from "react";
import {
  collection,
  // onSnapshot,
  query,
  doc,
  updateDoc,
  setDoc,
  arrayUnion,
  getDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase/firebase";
import cloche from "../../assets/clochenotification.png";
import sign from "../../assets/ekanwesign.png";
import loupe from "../../assets/loupe.png";
import menu from "../../assets/menu.png";
import save from "../../assets/save.png";
import fullsave from "../../assets/fullsave.png";
import BottomNavbar from "./BottomNavbar";
import { sendNotification } from "../../hooks/sendNotifications";
import profile from "../../assets/profile.png";
// import { MapPin } from "lucide-react";
import { getCurrentPosition, configureStatusBar } from "../../utils/capacitorUtils";

interface Deal {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: string;
  candidatures?: Array<{
    influenceurId: string;
    status: string;
    review?: {
      rating: number | string;
    };
  }>;
  merchantId: string;
  interest?: string;
}

interface SectionProps {
  title: string;
  refProp: React.RefObject<HTMLDivElement>;
  deals: Deal[];
  savedDeals: string[];
  toggleSave: (dealId: string) => void;
}

interface DealCardProps {
  deal: Deal;
  saved: boolean;
  onSave: (dealId: string) => void;
}

export default function DealsPageInfluenceur() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [savedDeals, setSavedDeals] = useState<string[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const popularRef = useRef<HTMLDivElement>(null);
  const otherRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const user = auth.currentUser;

  useEffect(() => {
    configureStatusBar();
    fetchUserLocation();
    fetchDeals();
  }, []);

  const fetchUserLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setUserLocation(position);
    } catch (error) {
      console.error("Erreur lors de la récupération de la position:", error);
    }
  };

  const fetchDeals = async () => {
    try {
      const dealsRef = collection(db, "deals");
      const q = query(dealsRef, where("status", "==", "active"));
      const querySnapshot = await getDocs(q);
      
      const dealsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Deal[];

      // Trier les deals par distance si la position est disponible
      if (userLocation) {
        dealsData.sort((a, b) => {
          const distanceA = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            a.location.latitude,
            a.location.longitude
          );
          const distanceB = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            b.location.latitude,
            b.location.longitude
          );
          return distanceA - distanceB;
        });
      }

      setDeals(dealsData);
      setLoadingPage(false);
    } catch (error) {
      console.error("Erreur lors de la récupération des deals:", error);
      setLoadingPage(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // const formatDistance = (distance: number) => {
  //   if (distance < 1) {
  //     return `${Math.round(distance * 1000)}m`;
  //   }
  //   return `${distance.toFixed(1)}km`;
  // };

  useEffect(() => {
    if (!user) return;
    const fetchSaved = async () => {
      const ref = doc(db, "saveDeal", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSavedDeals(snap.data()?.deals || []);
      }
    };
    fetchSaved();
  }, [user]);

  const toggleSave = async (dealId: string) => {
    if (!user) return;
    const ref = doc(db, "saveDeal", user.uid);
    const isSaved = savedDeals.includes(dealId);
    const updated = isSaved
      ? savedDeals.filter((id) => id !== dealId)
      : [...savedDeals, dealId];
    setSavedDeals(updated);

    const data = { deals: updated };
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, data);
    }
  };

  const filters = ["All", ...Array.from(new Set(deals.map((d) => d.interest).filter((interest): interest is string => interest !== undefined)))];
  const filteredDeals = selectedFilter === "All" ? deals : deals.filter((d) => d.interest === selectedFilter);
  const sortedByPopularity = [...filteredDeals].sort((a, b) => (b.candidatures?.length || 0) - (a.candidatures?.length || 0));
  const popularDeals = sortedByPopularity.slice(0, 5);
  const otherDeals = sortedByPopularity.slice(5);

  if (loadingPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5E7]">
        <div className="animate-spin-slow">
          <img src={sign} alt="Ekanwe Logo" className="w-16 h-16" />
        </div>
        <p className="mt-4 text-[#14210F]">Chargement en cours...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-32 pt-5">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-bold">Deals</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/notificationinfluenceur")}>
            <img src={cloche} alt="Notification" className="w-6 h-6" />
          </button>
          <img src={sign} alt="Ekanwe Sign" className="w-6 h-6" />
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex items-center bg-white/10 border border-black rounded-lg px-3 py-2">
          <img src={loupe} alt="loupe" className="w-6 h-6 mr-3" />
          <input type="text" placeholder="Recherche" className="flex-grow bg-transparent outline-none text-2xs" />
          <img src={menu} alt="Menu" className="w-6 h-6 ml-2" />
        </div>

        <div className="flex space-x-2 mt-3 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setSelectedFilter(item)}
              className={`border px-10 py-3 rounded-lg text-sm ${selectedFilter === item
                ? "bg-[#1A2C24] text-white"
                : "border-[#14210F] text-[#14210F] bg-white/10"
                }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <Section title="Populaire" refProp={popularRef} deals={popularDeals} savedDeals={savedDeals} toggleSave={toggleSave} />
      <Section title="Autres deals" refProp={otherRef} deals={otherDeals} savedDeals={savedDeals} toggleSave={toggleSave} />

      <BottomNavbar />
    </div>
  );
}

function Section({ title, refProp, deals, savedDeals, toggleSave }: SectionProps) {
  return (
    <>
      <div className="flex items-center px-4 justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <div ref={refProp} className="px-4 mb-6 space-y-4">
        {deals.length > 0 ? (
          deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} saved={savedDeals.includes(deal.id)} onSave={toggleSave} />
          ))
        ) : (
          <p className="text-sm px-4 text-gray-500">Aucun deal disponible</p>
        )}
      </div>
    </>
  );
}

function DealCard({ deal, saved, onSave }: DealCardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const dealRef = doc(db, "deals", deal.id);
      const dealSnap = await getDoc(dealRef);
      if (!dealSnap.exists()) return;
      const dealData = dealSnap.data();
      const found = dealData?.candidatures?.find((c: any) => c.influenceurId === user.uid);
      if (found) {
        setStatus(found.status);
      }
    };
    fetchStatus();
  }, [deal.id]);

  const handleApplyToDeal = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Veuillez vous connecter pour postuler.");
    setLoading(true);

    try {
      const dealRef = doc(db, "deals", deal.id);
      const dealSnap = await getDoc(dealRef);
      if (!dealSnap.exists()) throw new Error("Deal introuvable.");

      const dealData = dealSnap.data();
      const candidatures = dealData?.candidatures || [];
      if (candidatures.some((cand: any) => cand.influenceurId === user.uid)) {
        alert("Vous avez déjà postulé à ce deal.");
        setLoading(false);
        return;
      }

      const newCandidature = { influenceurId: user.uid, status: "Envoyé" };
      await updateDoc(dealRef, { candidatures: arrayUnion(newCandidature) });

      await sendNotification({
        toUserId: deal.merchantId,
        fromUserId: user.uid,
        message: "Un influenceur a postulé à votre deal !",
        type: "application",
        relatedDealId: deal.id,
        targetRoute: `/dealcandidatescommercant/${deal.id}`,
      });

      const chatId = [user.uid, deal.merchantId].sort().join("");
      const message = {
        senderId: user.uid,
        text: `Bonjour, je suis intéressé par le deal "${deal.title}".`,
        createdAt: new Date(),
      };

      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        await setDoc(chatRef, { messages: [message] });
      } else {
        await updateDoc(chatRef, { messages: arrayUnion(message) });
      }

      const updateUserChats = async (uid: string, receiverId: string, read: boolean) => {
        const ref = doc(db, "userchats", uid);
        const snap = await getDoc(ref);
        const newChat = { chatId, receiverId, lastMessage: message.text, updatedAt: Date.now(), read };
        if (snap.exists()) {
          const data = snap.data();
          const chats = data.chats || [];
          const idx = chats.findIndex((c: any) => c.chatId === chatId);
          if (idx !== -1) chats[idx] = newChat;
          else chats.push(newChat);
          await updateDoc(ref, { chats });
        } else {
          await setDoc(ref, { chats: [newChat] });
        }
      };

      await updateUserChats(user.uid, deal.merchantId, true);
      await updateUserChats(deal.merchantId, user.uid, false);
      alert("Votre candidature a été envoyée !");
      setStatus("Envoyé");
    } catch (err) {
      console.error("Erreur lors de la candidature :", err);
      alert("Une erreur est survenue lors de la candidature.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Veuillez vous connecter.");
    navigate(status ? `/dealdetailinfluenceur/${deal.id}` : `/dealsseemoreinfluenceur/${deal.id}`);
  };

  return (
    <div className="w-full bg-[#1A2C24] rounded-xl overflow-hidden shadow-lg">
      <div className="relative aspect-[16/9] w-full">
        <img
          src={deal.imageUrl || profile}
          alt={deal.title}
          className="absolute inset-0 w-full h-full object-cover object-center rounded-t-xl"
        />
        <button className="absolute bottom-4 right-4" onClick={() => onSave(deal.id)}>
          <img src={saved ? fullsave : save} alt="Save" className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">
        <h3 className="text-xl text-white font-bold mb-3">{deal.title || "Titre du Deal"}</h3>
        <p className="text-base text-white mb-6 line-clamp-2">{deal.description || "Description indisponible."}</p>
        <div className="mt-4">
          {status ? (
            <button
              disabled
              className={`w-full py-3 text-base font-semibold rounded-lg ${
                status === "Terminé"
                  ? "bg-green-700 text-white"
                  : status === "Approbation"
                  ? "bg-white/50 text-white"
                  : "bg-white/10 text-white"
              }`}
            >
              {status}
            </button>
          ) : (
            <div className="flex justify-between gap-4">
              <button
                className="text-white border border-white rounded-lg px-6 py-3 text-base font-medium"
                onClick={handleNavigation}
              >
                Voir plus
              </button>
              <button
                disabled={loading}
                className="bg-[#FF6B2E] border border-white text-white px-6 py-3 rounded-lg text-base font-semibold"
                onClick={handleApplyToDeal}
              >
                {loading ? "Envoi..." : "Dealer"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}