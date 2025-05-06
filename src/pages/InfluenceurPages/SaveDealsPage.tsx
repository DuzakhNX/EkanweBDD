import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { arrayUnion, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import cloche from "../../assets/clochenotification.png";
import sign from "../../assets/ekanwesign.png";
import loupe from "../../assets/loupe.png";
import menu from "../../assets/menu.png";
import BottomNavbar from "./BottomNavbar";
import fullsave from "../../assets/fullsave.png";
import profile from "../../assets/profile.png";
import { sendNotification } from "../../hooks/sendNotifications";

export default function SaveDealsPageInfluenceur() {
  const navigate = useNavigate();
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user?.uid) return;

    const saveRef = doc(db, "saveDeal", user.uid);
    const unsubscribe = onSnapshot(saveRef, async (snap) => {
      const data = snap.data();
      const dealIds: string[] = data?.deals || [];
      const dealsFetched = await Promise.all(
        dealIds.map(async (id) => {
          const dealSnap = await getDoc(doc(db, "deals", id));
          if (dealSnap.exists()) return { id, ...dealSnap.data() };
          return null;
        })
      );
      setSavedDeals(dealsFetched.filter(Boolean));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleToggleSave = async (dealId: string) => {
    if (!user?.uid) return;
    const saveRef = doc(db, "saveDeal", user.uid);
    const snap = await getDoc(saveRef);
    const current = snap.exists() ? snap.data().deals || [] : [];
    const updated = current.includes(dealId)
      ? current.filter((id: string) => id !== dealId)
      : [...current, dealId];

    await setDoc(saveRef, { deals: updated });
  };

  const getStatus = (deal: any) => {
    const uid = auth.currentUser?.uid;
    return deal.candidatures?.find((c: any) => c.influenceurId === uid)?.status;
  };

  const handleApplyToDeal = async (deal: any) => {
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
      } catch (err) {
        console.error("Erreur lors de la candidature :", err);
        alert("Une erreur est survenue lors de la candidature.");
      } finally {
        setLoading(false);
      }
    };

  const renderStatusButton = (status: string, deal: any) => {
    const common = "w-full py-2 text-white font-semibold rounded-lg text-sm text-center";
    if (status === "Envoyé") return <button disabled className={`${common} bg-gray-500`}>Candidature envoyée</button>;
    if (status === "Accepté") return <button disabled className={`${common} bg-blue-500`}>Accepté</button>;
    if (status === "Approbation") return <button disabled className={`${common} bg-yellow-500`}>En attente validation</button>;
    if (status === "Terminé") return <button disabled className={`${common} bg-green-700`}>Mission terminée</button>;
    return (
      <button
        className={`${common} bg-[#FF6B2E]`}
        onClick={() => handleApplyToDeal(deal)}
      >
        Dealer
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-32 pt-5">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-bold">Enregistrés</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/notificationinfluenceur")}>
            <img src={cloche} alt="Notification" className="w-6 h-6" />
          </button>
          <img src={sign} alt="Ekanwe Sign" className="w-6 h-6 cursor-pointer" onClick={() => navigate("/dealsinfluenceur")} />
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex items-center bg-white/10 border border-black rounded-lg px-3 py-2">
          <img src={loupe} alt="loupe" className="w-6 h-6 mr-3" />
          <input type="text" placeholder="Recherche" className="flex-grow bg-transparent outline-none text-2xs" />
          <img src={menu} alt="Menu" className="w-6 h-6 ml-2" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5E7]">
          <div className="animate-spin-slow">
            <img src={sign} alt="Ekanwe Logo" className="w-16 h-16" />
          </div>
          <p className="mt-4 text-[#14210F]">Chargement en cours...</p>
        </div>
      ) : savedDeals.length === 0 ? (
        <p className="text-center text-gray-600 mt-10">Aucun deal enregistré.</p>
      ) : (
        <div className="px-4 space-y-6">
          {savedDeals.map((deal: any, index: number) => {
            const status = getStatus(deal);
            return (
              <div key={index} className="bg-[#1A2C24] rounded-xl overflow-hidden shadow-lg">
                <div className="relative aspect-[16/9] w-full">
                  <img
                    src={deal.imageUrl || profile}
                    alt={deal.title}
                    className="absolute inset-0 w-full h-full object-cover object-center rounded-t-xl"
                  />
                  <button
                    className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors duration-200"
                    onClick={() => handleToggleSave(deal.id)}
                  >
                    <img src={fullsave} alt="save" className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="text-lg text-white font-bold mb-2">{deal.title}</h3>
                  <p className="text-sm text-white/90 mb-4 line-clamp-2">{deal.description}</p>
                  <div className="flex justify-between items-center gap-3">
                    <button
                      className="text-white border border-white/50 rounded-lg px-4 py-2 text-sm hover:bg-white/10 transition-colors duration-200"
                      onClick={() => navigate(`/dealsseemoreinfluenceur/${deal.id}`)}
                    >
                      Voir plus
                    </button>
                    {renderStatusButton(status, deal)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNavbar />
    </div>
  );
}
