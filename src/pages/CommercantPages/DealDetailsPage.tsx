import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { sendNotification } from "../../hooks/sendNotifications";

export default function DealDetailPageCommercant() {
  const navigate = useNavigate();
  const { dealId, influenceurId } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [candidature, setCandidature] = useState<any>(null);

  useEffect(() => {
    if (!dealId || !influenceurId) return;

    const fetchData = async () => {
      try {
        const dealRef = doc(db, "deals", dealId);
        const dealSnap = await getDoc(dealRef);

        if (dealSnap.exists()) {
          const dealData = dealSnap.data();
          setDeal({ id: dealSnap.id, ...dealData });

          const cand = dealData.candidatures.find(
            (c: any) => c.influenceurId === influenceurId
          );
          setCandidature(cand || null);
        }

      } catch (error) {
        console.error("Erreur lors du fetch:", error);
      }
    };

    fetchData();
  }, [dealId, influenceurId]);

  const handleApprove = async () => {
    if (!dealId || !influenceurId || !candidature) return;

    try {
      const dealRef = doc(db, "deals", dealId);
      const dealSnap = await getDoc(dealRef);

      if (!dealSnap.exists()) throw new Error("Deal introuvable");

      const dealData = dealSnap.data();

      const updatedCandidatures = dealData.candidatures.map((cand: any) => {
        if (cand.influenceurId === influenceurId) {
          return { ...cand, status: "Terminé" };
        }
        return cand;
      });

      await updateDoc(dealRef, { candidatures: updatedCandidatures });

      await sendNotification({
        toUserId: influenceurId,
        fromUserId: auth.currentUser?.uid!,
        message: `Votre prestation a été validée par le commerçant.`,
        relatedDealId: dealId,
        targetRoute: `/dealdetailinfluenceur/${dealId}`,
        type: "deal_approved",
      });

      setCandidature((prev: any) => ({ ...prev, status: "Terminé" }));
    } catch (error) {
      console.error("Erreur lors de l'Approbation :", error);
    }
  };

  const handleCancel = async () => {
    if (!dealId || !influenceurId) return;

    try {
      const dealRef = doc(db, "deals", dealId);
      const dealSnap = await getDoc(dealRef);

      if (!dealSnap.exists()) throw new Error("Deal introuvable");

      const dealData = dealSnap.data();

      const updatedCandidatures = dealData.candidatures.filter(
        (cand: any) => cand.influenceurId !== influenceurId
      );

      await updateDoc(dealRef, { candidatures: updatedCandidatures });

      await sendNotification({
        toUserId: influenceurId,
        fromUserId: auth.currentUser?.uid!,
        message: `Votre prestation a été résiliée par le commerçant.`,
        relatedDealId: dealId,
        targetRoute: `/suivisdealsinfluenceur`,
        type: "deal_cancelled",
      });
      navigate(-1);
    } catch (error) {
      console.error("Erreur lors de la résiliation :", error);
    }
  };

  if (!deal || !candidature) return <div className="p-4">Chargement...</div>;

  return (
    <div className="bg-[#f7f6ed] min-h-screen flex flex-col">
      <div className="flex items-center p-4 text-[#FF6B2E] text-lg font-medium">
        <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />
        <span className="ml-2">Retour</span>
      </div>

      <div className="w-full h-48">
        <img src={deal.imageUrl} alt="Deal" className="w-full h-full object-cover" />
      </div>

      <div className="px-4 py-2">
        <h1 className="text-2xl font-bold text-[#1A2C24] mb-2">{deal.title}</h1>
        <p className="text-sm text-gray-600 mb-4">{deal.description}</p>
      </div>

      <div className="px-4 mb-6">
        <ProgressRibbon currentStatus={candidature.status} />
      </div>

      {/* 📷 Captures et Stats */}
      {candidature.uploads && candidature.uploads.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Captures réalisées :</h2>
          {candidature.uploads.map((upload: any, index: number) => (
            <div key={index} className="mb-6">
              <img src={upload.image} alt="Capture" className="w-full h-48 object-cover mb-2 rounded-lg" />
              <div className="flex justify-between text-sm text-gray-700">
                <span>Likes : {upload.likes}</span>
                <span>Partages : {upload.shares}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📄 Review de l'influenceur */}
      {candidature.status === "Terminé" && candidature.review && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Avis laissé :</h2>
          <p className="text-gray-700">"{candidature.review.text}"</p>
        </div>
      )}

      {/* ✅ Boutons Approbation / Résiliation */}
      {candidature.status === "Approbation" && (
        <div className="px-4 flex flex-col gap-4 mb-10">
          <button
            onClick={handleApprove}
            className="w-full bg-[#1A2C24] text-white py-2 rounded-lg font-semibold"
          >
            Approuver
          </button>
          <button
            onClick={handleCancel}
            className="w-full border border-[#1A2C24] text-[#1A2C24] py-2 rounded-lg font-semibold"
          >
            Résilier
          </button>
        </div>
      )}
    </div>
  );
}

const ProgressRibbon = ({ currentStatus }: { currentStatus: string }) => {
  const steps = ["Envoyé", "Accepté", "Approbation", "Terminé"];
  const currentStep = {
    Envoyé: 1,
    Accepté: 2,
    Approbation: 3,
    Terminé: 4,
  }[currentStatus] || 1;

  return (
    <div className="w-full bg-[#1A2C24] rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <span className={`text-[#FF6B2E] ${index < currentStep ? "font-bold" : "opacity-50"}`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 flex items-center">
                <div className={`h-0.5 w-12 ${index < currentStep - 1 ? "bg-[#FF6B2E]" : "bg-gray-400"}`}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
