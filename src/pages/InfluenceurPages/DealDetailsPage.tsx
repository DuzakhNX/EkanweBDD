import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import BottomNavbar from "./BottomNavbar";
import { sendNotification } from "../../hooks/sendNotifications";

export default function DealDetailsPage() {
  const navigate = useNavigate();
  const { dealId } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [status, setStatus] = useState("pending");
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    if (!dealId) return;
  
    const fetchData = async () => {
      try {
        const dealRef = doc(db, "deals", dealId);
        const dealSnap = await getDoc(dealRef);
  
        if (dealSnap.exists()) {
          const dealData = dealSnap.data();
          setDeal({ id: dealSnap.id, ...dealData });
  
          const currentUserId = auth.currentUser?.uid;
          if (currentUserId && dealData?.candidatures) {
            const candidature = dealData.candidatures.find(
              (c: any) => c.influenceurId === currentUserId
            );
            if (candidature) {
              setStatus(candidature.status);
            }
          }
        }
  
        const eventsSnap = await getDocs(collection(db, "deals", dealId, "events"));
        setTimeline(eventsSnap.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Erreur lors du fetch:", error);
      }
    };
  
    fetchData();
  }, [dealId]);
  

  const handleMarkAsDone = async () => {
    try {
      const dealRef = doc(db, "deals", dealId!);
      const dealSnap = await getDoc(dealRef);
  
      if (!dealSnap.exists()) throw new Error("Deal introuvable");
  
      const dealData = dealSnap.data();
      const currentUserId = auth.currentUser?.uid;
  
      if (!currentUserId) throw new Error("Utilisateur non connecté");
  
      const updatedCandidatures = dealData?.candidatures?.map((cand: any) => {
        if (cand.influenceurId === currentUserId) {
          return { ...cand, status: "completed", progress: "completed" };
        }
        return cand;
      });
  
      await updateDoc(dealRef, {
        candidatures: updatedCandidatures,
      });
  
      await sendNotification({
        toUserId: dealData.merchantId,
        fromUserId: currentUserId,
        message: `L'influenceur a marqué le deal comme terminé.`,
        relatedDealId: dealId!,
        targetRoute: `/dealinfluenceur`,
        type: "deal_completed",
      });
  
      setStatus("completed");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du deal :", error);
    }
  };

  const getCurrentStep = () => {
    switch (status) {
      case "sent": return 1;
      case "accepted": return 2;
      case "completed": return 3;
      default: return 1;
    }
  };

  if (!deal) return <div className="p-4">Chargement...</div>;

  return (
    <div className="bg-[#f7f6ed] min-h-screen flex flex-col">
      <div className="flex items-center p-4 text-[#FF6B2E] text-lg font-medium">
        <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />
        <span className="ml-2">Deals</span>
      </div>

      <div className="w-full h-48">
        <img src={deal.imageUrl} alt="Commerçant" className="w-full h-full object-cover" />
      </div>

      <div className="px-4 py-2">
        <div className="flex justify-between mb-1 text-[#1A2C24] items-center text-2xl font-semibold">
          <span>{deal.title}</span>
          <span className="text-[#FF6B2E] text-sm">{dealId}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#FF6B2E] mb-4">
          <MapPin className="w-4 h-4" />
          <button>{deal.location || "Localisation inconnue"}</button>
        </div>
        <div className="text-sm text-gray-600 mt-2 mb-5">
          <h3 className="font-semibold text-[#1A2C24] text-xl mb-2">Description</h3>
          {deal.description}
        </div>
      </div>

      <div className="px-4 mb-6">
        <ProgressRibbon currentStep={getCurrentStep()} />
      </div>

      <div className="px-4 mb-6">
        {status !== "completed" && (
          <button
            onClick={handleMarkAsDone}
            className="w-full bg-[#FF6B2E] text-white py-2 rounded-lg font-semibold"
          >
            Marquer comme terminé
          </button>
        )}
      </div>

      <div className="px-4 mb-20">
        <h3 className="font-semibold text-xl text-[#1A2C24]">Timeline</h3>
        <div className="pl-2 bg-[#F5F5E7]">
          <ul className="space-y-8 relative">
            <div className="absolute left-1.5 top-3 bottom-3 w-0.5 bg-gray-400"></div>
            {timeline.map((event, index) => (
              <li key={index} className="relative pl-8">
                <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-[#1A2C24] z-10">
                  <div className="absolute -inset-1 border border-[#1A2C24] rounded-full"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700">{event.text}</span>
                  <span className="text-xs text-gray-500 mt-1">{event.date}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <BottomNavbar />
    </div>
  );
}

const ProgressRibbon = ({ currentStep = 1 }: { currentStep: number }) => {
  const steps = ["Envoyé", "Accepté", "Effectué"];
  return (
    <div className="w-full bg-[#1A2C24] rounded-lg p-3">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <span className={`text-[#FF6B2E] ${index < currentStep ? 'font-bold' : 'opacity-70'}`}>{step}</span>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 flex items-center">
                {index < currentStep - 1 ? (
                  <div className="h-0.5 bg-[#FF6B2E] w-12"></div>
                ) : (
                  <div className="h-0.5 bg-[#FF6B2E] opacity-30 w-12"></div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};