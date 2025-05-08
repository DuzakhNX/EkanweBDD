import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { sendNotification } from "../../hooks/sendNotifications";
import profile from "../../assets/profile.png";
import sign from "../../assets/ekanwesign.png";
import fullsave from "../../assets/fullsave.png";
import save from "../../assets/save.png";

export default function DealsSeeMorePageInfluenceur() {
  const navigate = useNavigate();
  const { dealId } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchDeal = async () => {
      if (!dealId) return;

      try {
        const dealRef = doc(db, "deals", dealId);
        const dealSnap = await getDoc(dealRef);

        if (dealSnap.exists()) {
          const data = dealSnap.data();
          setDeal({ id: dealSnap.id, ...data });

          const userId = auth.currentUser?.uid;
          if (userId && data.candidatures) {
            const applied = data.candidatures.some((c: any) => c.influenceurId === userId);
            setAlreadyApplied(applied);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du deal:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [dealId]);

  const handleCandidature = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Veuillez vous connecter pour postuler.");
      return;
    }

    try {
      const dealRef = doc(db, "deals", deal.id);
      const dealSnap = await getDoc(dealRef);
      if (!dealSnap.exists()) return alert("Deal introuvable.");

      const dealData = dealSnap.data();
      const candidatures = dealData?.candidatures || [];

      if (candidatures.some((cand: any) => cand.influenceurId === user.uid)) {
        setAlreadyApplied(true);
        return alert("Vous avez déjà postulé à ce deal.");
      }

      const newCandidature = {
        influenceurId: user.uid,
        status: "Envoyé",
      };

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
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      const firstMessage = {
        senderId: user.uid,
        text: `Hello, je suis intéressé par le deal "${deal.title}". Pouvez-vous m'en dire plus ?`,
        createdAt: new Date(),
      };

      if (!chatSnap.exists()) {
        await setDoc(chatRef, { messages: [firstMessage] });
      } else {
        await updateDoc(chatRef, { messages: arrayUnion(firstMessage) });
      }

      const updateUserChats = async (uid: string, receiverId: string, read: boolean) => {
        const ref = doc(db, "userchats", uid);
        const snap = await getDoc(ref);
        const entry = {
          chatId,
          lastMessage: firstMessage.text,
          receiverId,
          updatedAt: Date.now(),
          read,
        };

        if (snap.exists()) {
          const data = snap.data();
          const chats = data.chats || [];
          const idx = chats.findIndex((c: any) => c.chatId === chatId);
          if (idx !== -1) chats[idx] = entry;
          else chats.push(entry);
          await updateDoc(ref, { chats });
        } else {
          await setDoc(ref, { chats: [entry] });
        }
      };

      await updateUserChats(user.uid, deal.merchantId, true);
      await updateUserChats(deal.merchantId, user.uid, false);

      setAlreadyApplied(true);
      alert("Votre candidature a été envoyée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la candidature :", error);
      alert("Une erreur est survenue.");
    }
  };

  const handleToggleSave = () => {
    setSaved(!saved);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5E7]">
        <div className="animate-spin-slow">
          <img src={sign} alt="Ekanwe Logo" className="w-16 h-16" />
        </div>
        <p className="mt-4 text-[#14210F]">Chargement en cours...</p>
      </div>
    );
  }

  if (!deal) {
    return <div className="p-4 text-center">Deal introuvable.</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F5E7] pt-10">
      <header className="bg-white px-4 py-3 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-8 h-8 text-[#FF6B2E]" />
        </button>
        <span className="text-[#FF6B2E] text-3xl font-bold">Deals</span>
      </header>

      <main className="p-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <img
              src={deal.imageUrl || profile}
              alt={deal.title}
              className="w-full h-full object-cover"
            />
            <button
              className="absolute top-4 right-4 bg-[#1A2C24]/90 p-2 rounded-full shadow-lg hover:bg-[#1A2C24] transition-colors duration-200"
              onClick={handleToggleSave}
            >
              <img src={saved ? fullsave : save} alt="Save" className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1A2C24] mb-3">{deal.title}</h2>
                <div className="flex items-center gap-2 text-sm text-[#FF6B2E] mb-3">
                  <MapPin className="w-4 h-4" />
                  <div className="flex flex-col">
                    {deal.locationName && (
                      <span className="text-[#1A2C24] font-medium">{deal.locationName}</span>
                    )}
                    {deal.locationCoords && (
                      <a
                        href={`https://www.google.com/maps?q=${deal.locationCoords.lat},${deal.locationCoords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FF6B2E] hover:underline text-xs"
                      >
                        Voir sur Google Maps
                      </a>
                    )}
                  </div>
                </div>
                <h3 className="text-xl text-[#1A2C24] font-bold mb-3">Description</h3>
                <p className="text-sm text-[#1A2C24] mb-4 leading-relaxed">{deal.description}</p>
              </div>
              <div>
                <span className="text-[#FF6B2E] text-sm font-bold bg-[#FF6B2E]/10 px-3 py-1 rounded-full">#{deal.id}</span>
              </div>
            </div>

            <h3 className="text-xl text-[#1A2C24] font-bold mb-3">Intérêts</h3>
            <div className="flex gap-2 mb-6 flex-wrap">
              {deal.interests && deal.interests.length > 0 ? (
                deal.interests.map((interest: string, index: number) => (
                  <span key={index} className="px-4 py-2 text-[#1A2C24] text-sm border border-black/20 rounded-lg bg-gray-50">
                    {interest}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">Aucun intérêt défini</span>
              )}
            </div>

            <div className="divide-y divide-black/10 rounded-lg overflow-hidden bg-gray-50 mb-6">
              <div className="w-full flex items-center justify-between px-4 py-4">
                <span className="text-[#1A2C24] text-lg font-bold">Type de Contenu</span>
                <span className="text-sm text-[#1A2C24] max-w-[60%] text-right">{deal.typeOfContent || "Non spécifié"}</span>
              </div>
              <div className="w-full flex items-center justify-between px-4 py-4">
                <span className="text-[#1A2C24] text-lg font-bold">Date de Validité</span>
                <span className="text-sm text-[#1A2C24] max-w-[60%] text-right">{deal.validUntil || "Non spécifiée"}</span>
              </div>
              <div className="w-full flex items-center justify-between px-4 py-4">
                <span className="text-[#1A2C24] text-lg font-bold">Conditions</span>
                <span className="text-sm text-[#1A2C24] max-w-[60%] text-right">{deal.conditions || "Aucune condition"}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 text-white font-medium bg-[#1A2C24] rounded-lg hover:bg-[#1A2C24]/90 transition-colors duration-200"
                onClick={() => navigate("/dealsinfluenceur")}
              >
                RETOUR
              </button>
              <button
                disabled={alreadyApplied}
                onClick={handleCandidature}
                className={`flex-1 py-3 text-white font-medium rounded-lg transition-colors duration-200 ${
                  alreadyApplied ? "bg-gray-400 cursor-not-allowed" : "bg-[#FF6B2E] hover:bg-[#FF6B2E]/90"
                }`}
              >
                {alreadyApplied ? "Candidature envoyée" : "EXÉCUTER"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
