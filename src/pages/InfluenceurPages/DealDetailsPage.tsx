import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import BottomNavbar from "./BottomNavbar";
import { sendNotification } from "../../hooks/sendNotifications";
import profile from "../../assets/profile.png"

export default function DealDetailsPageInfluenceur() {
  const navigate = useNavigate();
  const { dealId } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [status, setStatus] = useState("Envoyé");
  const [timeline, setTimeline] = useState<any[]>([]);
  const [uploads, setUploads] = useState<{ image: string; likes: number; shares: number }[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);

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
              if (candidature.review) {
                setHasReviewed(true);
              }
              if (candidature.proofs) {
                setUploads(candidature.proofs);
              }
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
          return { ...cand, status: "Approbation", proofs: uploads };
        }
        return cand;
      });

      await updateDoc(dealRef, {
        candidatures: updatedCandidatures,
      });

      await sendNotification({
        toUserId: dealData.merchantId,
        fromUserId: currentUserId,
        message: "L'influenceur a Terminé sa mission et attend votre validation.",
        relatedDealId: dealId!,
        targetRoute: "/suividealscommercant",
        type: "approval_request",
      });

      setStatus("Approbation");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du deal :", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setUploads((prev) => [...prev, { image: reader.result as string, likes: 0, shares: 0 }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpdateLikes = (index: number, field: "likes" | "shares", value: number) => {
    const updated = [...uploads];
    updated[index][field] = value;
    setUploads(updated);
  };

  const getCurrentStep = () => {
    switch (status) {
      case "Envoyé": return 1;
      case "Accepté": return 2;
      case "Approbation": return 3;
      case "Terminé": return 4;
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
        <img src={deal.imageUrl || profile} alt="Commerçant" className="w-full h-full object-cover" />
      </div>

      <div className="px-4 py-2">
        <div className="flex justify-between mb-1 text-[#1A2C24] items-center text-2xl font-semibold">
          <span>{deal.title}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#FF6B2E] mb-2">
          <MapPin className="w-4 h-4" />
          <span>{deal.location || "Localisation inconnue"}</span>
        </div>
        <div className="text-sm text-gray-600 mb-2">
          <h3 className="font-semibold text-[#1A2C24] text-lg">Description</h3>
          <p>{deal.description}</p>
        </div>
        <div className="text-sm text-gray-600 mb-4">
          <h3 className="font-semibold text-[#1A2C24] text-lg">Intérêts</h3>
          <div className="flex flex-wrap gap-2">
            {(deal.interest || []).map((item: string, idx: number) => (
              <span key={idx} className="px-3 py-1 border border-black rounded-full text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <ProgressRibbon currentStep={getCurrentStep()} status={status} />
      </div>

      {status === "Accepté" && (
        <div className="px-4 mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">Captures d'écran des actions réalisées :</label>
          <input type="file" multiple onChange={handleImageUpload} className="mb-4" />

          {uploads.map((upload, index) => (
            <div key={index} className="mb-6">
              <img src={upload.image} alt={`Upload ${index}`} className="w-full h-48 object-cover mb-2 rounded-lg" />
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Likes"
                  value={upload.likes}
                  onChange={(e) => handleUpdateLikes(index, "likes", +e.target.value)}
                  className="border p-2 rounded w-1/2 bg-[#1A2C24] text-white"
                />
                <input
                  type="number"
                  placeholder="Partages"
                  value={upload.shares}
                  onChange={(e) => handleUpdateLikes(index, "shares", +e.target.value)}
                  className="border p-2 rounded w-1/2 bg-[#1A2C24] text-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === "Refusé" ? (
        <div className="px-4 mb-6">
          <button disabled className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold">
            Candidature Refusée
          </button>
        </div>
      ) : status === "Accepté" ? (
        <div className="px-4 mb-6">
          <button
            onClick={handleMarkAsDone}
            className="w-full bg-[#FF6B2E] text-white py-2 rounded-lg font-semibold"
          >
            Marquer comme Terminé
          </button>
        </div>
      ) : status === "Approbation" ? (
        <div className="px-4 mb-6">
          <button disabled className="w-full bg-gray-400 text-white py-2 rounded-lg font-semibold">
            En attente d'Approbation du commerçant
          </button>
        </div>
      ) : status === "Terminé" && (
        <div className="px-4 mb-6">
          <button
            onClick={() => !hasReviewed && navigate(`/reviewinfluenceur/${dealId}`)}
            disabled={hasReviewed}
            className={`w-full ${hasReviewed ? "bg-gray-400" : "bg-[#FF6B2E]"} text-white py-2 rounded-lg font-semibold`}
          >
            {hasReviewed ? "Déjà évalué" : "Noter le commerçant"}
          </button>
        </div>
      )}

      <div className="px-4 mb-20">
        <h3 className="font-semibold text-xl text-[#1A2C24]">Timeline</h3>
        <div className="pl-2 bg-[#F5F5E7]">
          <ul className="space-y-8 relative">
            <div className="absolute left-1.5 top-3 bottom-3 w-0.5 bg-gray-400"></div>
            {timeline.map((event, index) => (
              <li key={index} className="relative pl-8">
                <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-[#1A2C24] z-10" />
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

const ProgressRibbon = ({ currentStep = 1, status }: { currentStep: number, status: string }) => {
  if (status === "Refusé") {
    return (
      <div className="w-full bg-red-500 rounded-lg p-3 text-center">
        <span className="text-white font-bold">Candidature Refusée</span>
      </div>
    );
  }

  const steps = ["Envoyé", "Accepté", "Approbation", "Terminé"];
  return (
    <div className="w-full bg-[#1A2C24] rounded-lg p-3">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <span className={`text-[#FF6B2E] ${index < currentStep ? "font-bold" : "opacity-70"}`}>{step}</span>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 flex items-center">
                <div className={`h-0.5 ${index < currentStep - 1 ? "bg-[#FF6B2E]" : "bg-[#FF6B2E] opacity-30"} w-12`}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
