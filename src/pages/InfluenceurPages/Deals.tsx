import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase/firebase";
import cloche from "../../assets/clochenotification.png";
import sign from "../../assets/ekanwesign.png";
import loupe from "../../assets/loupe.png";
import menu from "../../assets/menu.png";
import save from "../../assets/save.png";
import fullsave from "../../assets/fullsave.png";
import BottomNavbar from "./BottomNavbar";
import { doc, updateDoc, setDoc, arrayUnion, getDoc } from "firebase/firestore";
import { sendNotification } from "../../hooks/sendNotifications";

export default function DealsPageInfluenceur() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [deals, setDeals] = useState<any[]>([]);
  const [savedDeals, setSavedDeals] = useState<string[]>([]);
  const popularRef = useRef<HTMLDivElement>(null);
  const otherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "deals"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDeals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setDeals(allDeals);
    });

    return () => unsubscribe();
  }, []);


  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction === "left" ? -370 : 370, behavior: "smooth" });
    }
  };

  const toggleSave = (dealId: string) => {
    setSavedDeals((prev) =>
      prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId]
    );
  };

  const filteredDeals = selectedFilter === "All"
    ? deals
    : deals.filter((d) => d.interest === selectedFilter);

  const sortedByPopularity = [...filteredDeals].sort((a, b) => (b.candidatures?.length || 0) - (a.candidatures?.length || 0));
  const popularDeals = sortedByPopularity.slice(0, 5);
  const otherDeals = sortedByPopularity.slice(5);

  const filters = ["All", ...Array.from(new Set(deals.map((d) => d.interest)))];

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
              className={`border px-10 py-3 rounded-lg text-sm ${selectedFilter === item ? "bg-[#1A2C24] text-white" : "border-[#14210F] text-[#14210F] bg-white/10"
                }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* POPULAIRES */}
      <div className="flex items-center px-4 justify-between mb-2">
        <h2 className="text-2xl font-bold">Populaire</h2>
        <div className="flex space-x-4 text-2xl">
          <button onClick={() => scroll(popularRef, "left")}>←</button>
          <button onClick={() => scroll(popularRef, "right")}>→</button>
        </div>
      </div>
      <div ref={popularRef} className="px-4 mb-6 flex space-x-4 overflow-x-auto scrollbar-hide">
        {popularDeals.length > 0 ? (
          popularDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} saved={savedDeals.includes(deal.id)} onSave={toggleSave} />
          ))
        ) : (
          <p className="text-sm px-4 text-gray-500">Aucun deal populaire</p>
        )}
      </div>

      {/* AUTRES */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Autre deals</h2>
          <div className="flex space-x-4 text-2xl">
            <button onClick={() => scroll(otherRef, "left")}>←</button>
            <button onClick={() => scroll(otherRef, "right")}>→</button>
          </div>
        </div>
        <div ref={otherRef} className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {otherDeals.length > 0 ? (
            otherDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} saved={savedDeals.includes(deal.id)} onSave={toggleSave} />
            ))
          ) : (
            <p className="text-sm px-4 text-gray-500">Aucun autre deal</p>
          )}
        </div>
      </div>
      <BottomNavbar />
    </div>
  );
}

const DealCard = ({ deal, saved, onSave }: any) => {
  const navigate = useNavigate();
  interface Cand {
    influenceurId: string;
    title: string;
    description: string;
    interest: string;
    imageUrl?: string;
    candidatures?: { influenceurId: string; status: string }[];
    merchantId: string;
  }

  const handleApplyToDeal = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Vous devez être connecté pour postuler.");
      return;
    }

    try {
      const dealRef = doc(db, "deals", deal.id);
      const dealSnap = await getDoc(dealRef);

      if (!dealSnap.exists()) {
        alert("Deal introuvable.");
        return;
      }

      const dealData = dealSnap.data();
      const candidatures = dealData?.candidatures || [];

      if (candidatures.some((cand: Cand) => cand.influenceurId === user.uid)) {
        alert("Vous avez déjà postulé à ce deal.");
        return;
      }

      const newCandidature = {
        influenceurId: user.uid,
        status: "Envoyé",
      };

      await updateDoc(dealRef, {
        candidatures: arrayUnion(newCandidature),
      });

      await sendNotification({
        toUserId: deal.merchantId,
        fromUserId: user.uid,
        message: "Un influenceur a postulé à votre deal !",
        type: "application",
        relatedDealId: deal.id,
        targetRoute: `/dealcandidatescommercant/${deal.id}`,
      });

      const combinedId = [user.uid, deal.merchantId].sort().join("");
      const chatRef = doc(db, "chats", combinedId);
      const chatSnap = await getDoc(chatRef);

      const firstMessage = {
        senderId: user.uid,
        text: `Hello, je suis intéressé par le deal "${deal.title}". Pouvez-vous m'en dire plus ?`,
        createdAt: new Date(),
      };

      if (!chatSnap.exists()) {
        await setDoc(chatRef, { messages: [firstMessage] });
      } else {
        await updateDoc(chatRef, {
          messages: arrayUnion(firstMessage),
        });
      }

      const updateUserChats = async (uid: string, receiverId: string, isSender: boolean) => {
        const userChatsRef = doc(db, "userchats", uid);
        const userChatsSnap = await getDoc(userChatsRef);

        const chatEntry = {
          chatId: combinedId,
          lastMessage: firstMessage.text,
          receiverId: receiverId,
          updatedAt: Date.now(),
          read: isSender,
        };

        if (userChatsSnap.exists()) {
          const data = userChatsSnap.data();
          const existingChats = data.chats || [];
          const index = existingChats.findIndex((c: any) => c.chatId === combinedId);

          if (index !== -1) {
            existingChats[index] = chatEntry;
          } else {
            existingChats.push(chatEntry);
          }

          await updateDoc(userChatsRef, {
            chats: existingChats,
          });
        } else {
          await setDoc(userChatsRef, {
            chats: [chatEntry],
          });
        }
      };

      await updateUserChats(user.uid, deal.merchantId, true);
      await updateUserChats(deal.merchantId, user.uid, false);

      alert("Votre candidature a été envoyée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la candidature :", error);
      alert("Erreur lors de la candidature. Veuillez réessayer.");
    }
  };

  const handleNavigation = async () => {
    const dealRef = doc(db, "deals", deal.id);
    const dealSnap = await getDoc(dealRef);
    const user = auth.currentUser;
    if (!user) {
      alert("Vous devez être connecté pour postuler.");
      return;
    }

    if (!dealSnap.exists()) {
      alert("Deal introuvable.");
      return;
    }

    const dealData = dealSnap.data();
    const candidatures = dealData?.candidatures || [];

    if (candidatures.some((cand: Cand) => cand.influenceurId === user.uid)) {
      navigate(`/dealdetailinfluenceur/${deal.id}`);
    } else {
      navigate(`/dealsseemoreinfluenceur/${deal.id}`)
    }
  }

  return (
    <div className="min-w-full bg-[#1A2C24] rounded-xl overflow-hidden shadow-lg">
      <div className="relative w-full h-40">
        <img
          src={deal.imageUrl || "https://via.placeholder.com/300x200?text=Deal"}
          alt={deal.title}
          className="w-full h-full object-cover rounded-t-xl"
        />
        <button className="absolute bottom-2 right-2" onClick={() => onSave(deal.id)}>
          <img src={saved ? fullsave : save} alt="Save" className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-lg text-white font-bold mb-1">{deal.title || "Titre du Deal"}</h3>
        <p className="text-sm text-white mb-3">{deal.description || "Description indisponible."}</p>
        <div className="flex justify-between mt-8">
          <button
            className="text-white border border-white rounded-lg px-4 py-2 text-sm"
            onClick={handleNavigation}
          >
            Voir plus
          </button>
          <button
            className="bg-[#FF6B2E] border border-white text-white px-4 py-2 rounded-lg text-sm font-semibold"
            onClick={handleApplyToDeal}
          >
            Dealer
          </button>
        </div>
      </div>
    </div>
  );
};
