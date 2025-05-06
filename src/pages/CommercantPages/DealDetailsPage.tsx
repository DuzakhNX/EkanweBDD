import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { sendNotification } from "../../hooks/sendNotifications";
import profile from "../../assets/profile.png";
import sign from "../../assets/ekanwesign.png";

export default function DealDetailPageCommercant() {
  const navigate = useNavigate();
  const { dealId, influenceurId } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [candidature, setCandidature] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!dealId || !influenceurId) return;
        const dealRef = doc(db, "deals", dealId);
        const dealSnap = await getDoc(dealRef);

        if (dealSnap.exists()) {
          const dealData = dealSnap.data();
          setDeal({ id: dealSnap.id, ...dealData });

          const cand = dealData.candidatures.find((c: any) => c.influenceurId === influenceurId);
          if (cand) {
            setCandidature(cand || null);
            setHasReviewed(!!cand.influreview);
          }
        }
      } catch (error) {
        console.error("Erreur lors du fetch:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dealId, influenceurId]);

  const handleApprove = async () => {
    if (!dealId || !influenceurId || !candidature) return;
    setApproving(true);
    try {
      const dealRef = doc(db, "deals", dealId);
      const dealSnap = await getDoc(dealRef);

      if (!dealSnap.exists()) throw new Error("Deal introuvable");
      const dealData = dealSnap.data();

      const updatedCandidatures = dealData.candidatures.map((cand: any) =>
        cand.influenceurId === influenceurId ? { ...cand, status: "Terminé" } : cand
      );

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
      console.error("Erreur lors de l'approbation :", error);
    } finally {
      setApproving(false);
    }
  };

  const handleCancel = async () => {
    if (!dealId || !influenceurId) return;
    setCancelling(true);
    try {
      const dealRef = doc(db, "deals", dealId);
      const dealSnap = await getDoc(dealRef);
      if (!dealSnap.exists()) throw new Error("Deal introuvable");
      const dealData = dealSnap.data();

      const updatedCandidatures = dealData.candidatures.map((cand: any) =>
        cand.influenceurId === influenceurId ? { ...cand, status: "Refusé" } : cand
      );

      await updateDoc(dealRef, { candidatures: updatedCandidatures });

      await sendNotification({
        toUserId: influenceurId,
        fromUserId: auth.currentUser?.uid!,
        message: `Votre candidature a été résiliée par le commerçant.`,
        relatedDealId: dealId,
        targetRoute: `/suivisdealsinfluenceur`,
        type: "deal_cancelled",
      });

      navigate(-1);
    } catch (error) {
      console.error("Erreur lors de la résiliation :", error);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5E7]">
        <img src={sign} alt="Ekanwe Logo" className="w-16 h-16 animate-spin" />
        <p className="mt-4 text-[#14210F]">Chargement en cours...</p>
      </div>
    );
  }

  if (!deal || !candidature) return <div className="p-4">Données introuvables</div>;

  return (
    <div className="bg-[#f7f6ed] min-h-screen flex flex-col">
      <div className="flex items-center p-4 justify-between text-[#FF6B2E] text-lg font-medium">
        <div className="flex items-center">
          <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />
          <span className="ml-2">Retour</span>
        </div>
        <img src={sign} className="w-6 h-6 cursor-pointer" onClick={() => navigate("/dealscommercant")} />
      </div>

      <div className="w-full h-48 overflow-hidden">
        <img src={deal.imageUrl || profile} alt="Deal" className="w-full h-full object-cover object-center" />
      </div>

      <div className="px-4 py-2">
        <div className="flex justify-between mb-2 text-[#1A2C24] items-center text-2xl font-semibold">
          <span>{deal.title}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#FF6B2E] mb-5">
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
          {deal.locationName && (
            <a
              className="underline text-sm"
            >
              {deal.locationName}
            </a>
          )}
        </div>
        <div className="text-sm text-gray-600 mb-5">
          <h3 className="font-semibold text-[#1A2C24] text-lg mb-2">Description</h3>
          <p>{deal.description}</p>
        </div>
        <div className="text-sm text-gray-600 mb-4">
          <h3 className="font-semibold text-[#1A2C24] text-lg mb-2">Intérêts</h3>
          <div className="flex flex-wrap gap-2">
            {(deal.interests || []).map((item: string, idx: number) => (
              <span key={idx} className="px-3 py-1 border border-black rounded-full text-sm">{item}</span>
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-600 mb-4">
          <h3 className="font-semibold text-[#1A2C24] text-lg mb-2">Type de contenu</h3>
          <div className="flex flex-wrap gap-2">
            {(deal.typeOfContent || []).map((item: string, idx: number) => (
              <span key={idx} className="px-3 py-1 border border-black rounded-full text-sm">{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <ProgressRibbon currentStatus={candidature.status} />
      </div>

      {["Accepté", "Approbation", "Terminé"].includes(candidature.status) &&
        candidature.proofs &&
        candidature.proofs.length > 0 && (
          <div className="px-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Captures réalisées :</h2>
            {candidature.proofs.map((proof: any, index: number) => (
              <div key={index} className="mb-6">
                <img src={proof.image} alt="Capture" className="w-full h-48 object-cover mb-2 rounded-lg" />
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Likes : {proof.likes}</span>
                  <span>Nombre de vue : {proof.shares}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      {candidature.status === "Terminé" && candidature.review && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Avis laissé :</h2>
          <p className="text-gray-700">"{candidature.review.comment}"</p>
        </div>
      )}

      {candidature.status === "Terminé" && (
        <div className="px-4 mb-6">
          <button
            onClick={() => !hasReviewed && navigate(`/reviewcommercant/${dealId}/${influenceurId}`)}
            disabled={hasReviewed}
            className={`w-full ${hasReviewed ? "bg-gray-400" : "bg-[#FF6B2E]"} text-white py-2 rounded-lg font-semibold`}
          >
            {hasReviewed ? "Déjà évalué" : "Noter l'influenceur"}
          </button>
        </div>
      )}

      {candidature.status === "Approbation" && (
        <div className="px-4 flex flex-col gap-4 mb-10">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="w-full bg-[#1A2C24] text-white py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {approving ? "Approbation..." : "Approuver"}
          </button>
        </div>
      )}

      {candidature.status === "Envoyé" && (
        <div className="px-4 flex flex-col gap-4 mb-10">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full border border-[#1A2C24] text-[#1A2C24] py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {cancelling ? "Résiliation..." : "Résilier"}
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
    <div className="w-full bg-[#1A2C24] rounded-lg p-3 mb-4 overflow-x-hidden">
      <div className="flex items-center justify-between w-full">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-shrink-0">
            <span className={`text-[#FF6B2E] text-xs sm:text-sm ${index < currentStep ? "font-bold" : "opacity-50"}`}>{step}</span>
            {index < steps.length - 1 && (
              <div className="flex-shrink mx-1 sm:mx-2 flex items-center">
                <div className={`h-0.5 w-4 sm:w-8 ${index < currentStep - 1 ? "bg-[#FF6B2E]" : "bg-gray-400"}`}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
