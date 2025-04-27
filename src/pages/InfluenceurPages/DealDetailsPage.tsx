import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, setDoc } from "firebase/firestore";
import BottomNavbar from "./BottomNavbar";
import { sendNotification } from "../../hooks/sendNotifications";

export default function DealDetailsPage() {
  const navigate = useNavigate();
  const { dealId, candidatureId } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [status, setStatus] = useState("sent");
  const [timeline, setTimeline] = useState<any[]>([]);
  const [review, setReview] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const dealDoc = await getDoc(doc(db, "deals", dealId!));
      if (dealDoc.exists()) setDeal(dealDoc.data());

      const candidatureRef = doc(db, "deals", dealId!, "candidatures", candidatureId!);
      const candidatureSnap = await getDoc(candidatureRef);
      if (candidatureSnap.exists()) {
        setStatus(candidatureSnap.data().status);
      }

      const timelineSnap = await getDocs(collection(doc(db, "deals", dealId!), "events"));
      setTimeline(timelineSnap.docs.map(doc => doc.data()));
    };
    fetchData();
  }, [dealId, candidatureId]);

  const handleMarkAsDone = async () => {
    const candidatureRef = doc(db, "deals", dealId!, "candidatures", candidatureId!);
    await updateDoc(candidatureRef, { status: "completed", progress: "completed" });

    await sendNotification({
      toUserId: deal.createdBy,
      fromUserId: auth.currentUser.uid,
      message: `L'influenceur a marqué le deal comme terminé.`,
      relatedDealId: dealId!,
      targetRoute: `/deals/${dealId}/candidatures/${candidatureId}/review`,
      type: "deal_completed"
    });

    setStatus("completed");
  };

  const handleReviewSubmit = async () => {
    const reviewRef = doc(db, "deals", dealId!, "candidatures", candidatureId!, "review");
    await setDoc(reviewRef, {
      author: auth.currentUser.uid,
      text: review,
      createdAt: new Date().toISOString()
    });
    alert("Review envoyée !");
    setReview("");
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

      {status === "completed" && (
        <div className="px-4 mb-6">
          <h3 className="font-bold text-xl mb-2">Laisser un avis</h3>
          <textarea
            className="w-full p-2 border border-gray-300 rounded"
            rows={4}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Partage ton retour sur le commerçant..."
          />
          <button
            onClick={handleReviewSubmit}
            className="mt-2 bg-[#1A2C24] text-white py-2 px-4 rounded-lg"
          >
            Soumettre
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