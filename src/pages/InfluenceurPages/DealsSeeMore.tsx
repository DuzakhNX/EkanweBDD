import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import fillplus from "../../assets/fillplus.png";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { sendNotification } from "../../hooks/sendNotifications";
import profile from "../../assets/profile.png";
import sign from "../../assets/ekanwesign.png";

export default function DealsSeeMorePageInfluenceur() {
  const navigate = useNavigate();
  const { dealId } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50 pt-10">
      <header className="bg-gray-50 px-4 py-3 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-8 h-8 text-[#FF6B2E]" />
        </button>
        <span className="text-[#FF6B2E] text-3xl font-bold">Deals</span>
      </header>

      <main className="p-4">
        <div className="bg-white rounded-xl overflow-hidden shadow-md">
          <div className="relative aspect-[4/3] w-full">
            <img
              src={deal.imageUrl || profile}
              alt={deal.title}
              className="absolute inset-0 w-full h-full object-cover object-center rounded-t-xl"
            />
            <div className="absolute bottom-2 right-2 bg-white rounded-full p-1">
              <img src={fillplus} alt="Edit" className="h-6 w-6" />
            </div>
          </div>

          <div className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-bold text-[#1A2C24] mb-2">{deal.title}</h2>
                <div className="flex items-center gap-2 text-sm text-[#FF6B2E] mb-2">
                  <MapPin className="w-4 h-4" />
                  {deal.locationCoords && (
                    <a
                      href={`https://www.google.com/maps?q=${deal.locationCoords.lat},${deal.locationCoords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm"
                    >
                      Voir sur Google Maps
                    </a>
                  )}
                </div>
                <h3 className="text-xl text-[#1A2C24] font-bold mb-4">Description</h3>
                <p className="text-xs text-[#1A2C24] mb-2">{deal.description}</p>
              </div>
              <div>
                <span className="text-[#FF6B2E] text-sm font-bold">{deal.id}</span>
              </div>
            </div>

            <h3 className="text-xl text-[#1A2C24] font-bold mb-4">Intérêts</h3>
            <div className="flex gap-2 mb-4 flex-wrap">
              {deal.interest ? (
                <span className="px-4 py-2 text-[#1A2C24] text-sm border border-black rounded-lg">{deal.interest}</span>
              ) : (
                <span className="text-gray-400 text-sm">Aucun intérêt défini</span>
              )}
            </div>

            <div className="divide-y divide-black rounded-lg overflow-hidden">
              <InfoRow label="Type de Contenu" value={deal.typeOfContent || "Non spécifié"} />
              <InfoRow label="Date de Validité" value={deal.validUntil || "Non spécifiée"} />
              <InfoRow label="Conditions" value={deal.conditions || "Aucune condition"} />
            </div>

            <div className="flex gap-2 mt-6">
              <button
                className="flex-1 py-3 text-white font-medium bg-[#1A2C24] rounded-lg"
                onClick={() => navigate("/dealsinfluenceur")}
              >
                RETOUR
              </button>
              <button
                disabled={alreadyApplied}
                onClick={handleCandidature}
                className={`flex-1 py-3 text-white font-medium rounded-lg ${alreadyApplied ? "bg-gray-400 cursor-not-allowed" : "bg-[#FF6B2E]"
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

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-50">
    <span className="text-[#1A2C24] text-xl font-bold">{label}</span>
    <span className="text-sm text-[#1A2C24]">{value}</span>
  </div>
);
