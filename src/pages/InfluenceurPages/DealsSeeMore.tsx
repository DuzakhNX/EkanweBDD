import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import fillplus from "../../assets/fillplus.png";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { sendNotification } from "../../hooks/sendNotifications";
import { Loader2 } from "lucide-react";

export default function DealSeeMore() {
  const navigate = useNavigate();
  const { dealId } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  interface Deal {
    influenceurId: string;
    title: string;
    description: string;
    interest: string; // Cela pourrait être un type enum si tu veux restreindre les valeurs possibles
    imageUrl?: string;
    candidatures?: { influenceurId: string; status: string }[]; // Liste des candidatures avec les informations sur l'influenceur
    merchantId: string;
  }

  useEffect(() => {
    const fetchDeal = async () => {
      if (!dealId) return;

      try {
        const dealRef = doc(db, "deals", dealId);
        const dealSnap = await getDoc(dealRef);

        if (dealSnap.exists()) {
          const data = dealSnap.data();
          setDeal({ id: dealSnap.id, ...data });

          if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            const hasApplied = data.candidatures?.includes(userId) || false;
            setAlreadyApplied(hasApplied);
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
    if (!auth.currentUser || alreadyApplied || !dealId) return;

    try {
      const dealRef = doc(db, "deals", dealId);
      const dealSnap = await getDoc(dealRef);

      if (!dealSnap.exists()) {
        alert("Deal introuvable.");
        return;
      }

      const dealData = dealSnap.data();
      const candidatures = dealData?.candidatures || [];

      if (candidatures.some((cand: Deal) => cand.influenceurId === auth.currentUser!.uid)) {
        alert("Vous avez déjà postulé à ce deal.");
        return;
      }
  
      const newCandidature = {
        influenceurId: auth.currentUser.uid,
        status: "pending",
      };

      await updateDoc(dealRef, {
        candidatures: arrayUnion(newCandidature),
      });

      if (deal?.merchantId) {
        await sendNotification({
          toUserId: deal.merchantId,
          fromUserId: auth.currentUser.uid,
          message: "Un influenceur a postulé à votre deal !",
          type: "application",
          relatedDealId: deal.id,
          targetRoute: `/dealCandidates/${deal.id}`,
        });
      }

      setAlreadyApplied(true);
      alert("Votre candidature a été envoyée !");
    } catch (error) {
      console.error("Erreur lors de la candidature:", error);
      alert("Erreur lors de la candidature.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Loader2 className="animate-spin w-12 h-12 text-orange-500" />
      </div>
    );
  }

  if (!deal) {
    return <div className="p-4 text-center">Deal introuvable.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      <header className="bg-gray-50 px-4 py-3 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate("/deals")}>
          <ArrowLeft className="w-8 h-8 text-[#FF6B2E]" />
        </button>
        <span className="text-[#FF6B2E] text-3xl font-bold">Deals</span>
      </header>

      <main className="p-4">
        <div className="bg-gray-50 rounded-xl overflow-hidden shadow-md">
          <div className="relative">
            <img
              src={deal.imageUrl || "https://via.placeholder.com/300x200?text=Deal"}
              alt="Deal"
              className="w-full h-48 object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-white rounded-full p-1">
              <img src={fillplus} alt="Edit" className="h-6 w-6" />
            </div>
          </div>

          <div className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-bold text-[#1A2C24] mb-2">{deal.title}</h2>
                <div className="flex items-center gap-2 text-sm text-[#FF6B2E] mb-5">
                  <MapPin className="w-4 h-4" />
                  <span>{deal.location || "Localisation inconnue"}</span>
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
                <span className="px-4 py-2 text-[#1A2C24] text-sm border border-black rounded-lg">
                  {deal.interest}
                </span>
              ) : (
                <span className="text-gray-400 text-sm">Aucun intérêt défini</span>
              )}
            </div>

            <div className="divide-y divide-black rounded-lg overflow-hidden">
              <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-50">
                <span className="text-[#1A2C24] text-xl font-bold">Type de Contenu</span>
                <span className="text-sm text-[#1A2C24]">{deal.typeOfContent || "Non spécifié"}</span>
              </div>
              <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-50">
                <span className="text-[#1A2C24] text-xl font-bold">Date de Validité</span>
                <span className="text-sm text-[#1A2C24]">{deal.validUntil || "Non spécifiée"}</span>
              </div>
              <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-50">
                <span className="text-[#1A2C24] text-xl font-bold">Conditions</span>
                <span className="text-sm text-[#1A2C24]">{deal.conditions || "Aucune condition"}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                className="flex-1 py-3 text-white font-medium bg-[#1A2C24] rounded-lg"
                onClick={() => navigate("/deals")}
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
