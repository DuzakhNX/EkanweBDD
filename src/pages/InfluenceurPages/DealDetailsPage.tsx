import { ArrowLeft, MapPin, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import BottomNavbar from "./BottomNavbar";
import { sendNotification } from "../../hooks/sendNotifications";
import profile from "../../assets/profile.png";

export default function DealDetailsPageInfluenceur() {
  const navigate = useNavigate();
  const { dealId } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [status, setStatus] = useState("Envoyé");
  const [timeline, setTimeline] = useState<any[]>([]);
  const [uploads, setUploads] = useState<
    { image: string; likes: number; shares: number; isValidated: boolean; loading?: boolean }[]
  >([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [candidature, setCandidature] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDeal = async () => {
    if (!dealId) return;

    try {
      const dealRef = doc(db, "deals", dealId);
      const dealSnap = await getDoc(dealRef);

      if (dealSnap.exists()) {
        const dealData = dealSnap.data();
        setDeal({ id: dealSnap.id, ...dealData });

        const currentUserId = auth.currentUser?.uid;
        if (currentUserId && dealData?.candidatures) {
          const candidature = dealData.candidatures.find((c: any) => c.influenceurId === currentUserId);
          if (candidature) {
            setStatus(candidature.status);
            setCandidature(candidature || null);
            setHasReviewed(!!candidature.review);
            setUploads(candidature.proofs || []);
          }
        }
      }

      const eventsSnap = await getDocs(collection(db, "deals", dealId, "events"));
      setTimeline(eventsSnap.docs.map((doc) => doc.data()));
    } catch (error) {
      console.error("Erreur lors du fetch:", error);
    }
  };

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const syncProofsToFirestore = async (newProofs: any[]) => {
    const userId = auth.currentUser?.uid;
    if (!deal || !userId) return;

    const dealRef = doc(db, "deals", dealId!);
    const dealSnap = await getDoc(dealRef);
    if (!dealSnap.exists()) return;

    const data = dealSnap.data();
    const updated = data.candidatures.map((c: any) =>
      c.influenceurId === userId ? { ...c, proofs: newProofs } : c
    );

    await updateDoc(dealRef, { candidatures: updated });
  };

  const handleValidateUpload = async (index: number) => {
    const newUploads = [...uploads];
    newUploads[index].loading = true;
    setUploads(prev => {
      const newUploads = [...prev];
      newUploads[index].isValidated = true;
      return newUploads;
    });

    try {
      const cleanUploads = newUploads.map(({ loading, ...rest }) => rest);
      await syncProofsToFirestore(cleanUploads);
    } catch (err) {
      console.error("Erreur de validation individuelle :", err);
    } finally {
      newUploads[index].loading = false;
      setUploads([...newUploads]);
    }
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        if (reader.result) {
          const newUpload = { image: reader.result as string, likes: 0, shares: 0, isValidated: true };
          const newUploads = [...uploads, newUpload];
          setUploads(newUploads);
          await syncProofsToFirestore(newUploads);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteUpload = async (index: number) => {
    const newUploads = [...uploads];
    newUploads.splice(index, 1);
    setUploads(newUploads);
    await syncProofsToFirestore(newUploads);
  };

  const handleUpdateField = async (index: number, field: "likes" | "shares", value: number) => {
    const updated = [...uploads];
    updated[index][field] = value;
    setUploads(updated);
    await syncProofsToFirestore(updated);
  };

  const handleUndoMarkAsDone = async () => {
    if (loading || status !== "Approbation") return;
    setLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!deal || !userId) throw new Error("Utilisateur non connecté");

      const updatedCandidatures = deal.candidatures.map((cand: any) =>
        cand.influenceurId === userId ? { ...cand, status: "Accepté" } : cand
      );

      await updateDoc(doc(db, "deals", deal.id), { candidatures: updatedCandidatures });

      setStatus("Accepté");
    } catch (error) {
      console.error("Erreur lors du retour à l'état 'Accepté' :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDone = async () => {
    if (loading || status !== "Accepté") return;
    setLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!deal || !userId) throw new Error("Utilisateur non connecté");

      const updatedCandidatures = deal.candidatures.map((cand: any) =>
        cand.influenceurId === userId ? { ...cand, status: "Approbation", proofs: uploads } : cand
      );

      await updateDoc(doc(db, "deals", deal.id), { candidatures: updatedCandidatures });

      await sendNotification({
        toUserId: deal.merchantId,
        fromUserId: userId,
        message: "L'influenceur a terminé sa mission et attend votre validation.",
        relatedDealId: deal.id,
        targetRoute: "/suividealscommercant",
        type: "approval_request",
      });

      setStatus("Approbation");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du deal :", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStep = () => {
    const stepMap: any = {
      "Envoyé": 1,
      "Accepté": 2,
      "Approbation": 3,
      "Terminé": 4
    };
    return stepMap[status] || 1;
  };

  if (!deal) return <div className="p-4">Chargement...</div>;

  return (
    <div className="bg-[#f7f6ed] min-h-screen flex flex-col">
      <div className="flex items-center p-4 text-[#FF6B2E] text-lg font-medium">
        <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />
        <span className="ml-2">Deals</span>
      </div>

      <div className="w-full aspect-[4/3] overflow-hidden">
        <img src={deal.imageUrl || profile} alt="Deal" className="w-full h-full object-cover" />
      </div>

      <div className="px-4 py-2">
        <h2 className="text-2xl font-semibold text-[#1A2C24] mb-1">{deal.title}</h2>
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
          {deal.locationName && (
            <span
              className="underline text-sm"
            >
              {deal.locationName}
            </span>
          )}
        </div>
        <p className="text-gray-700 text-sm mb-4">{deal.description}</p>

        <h3 className="font-semibold text-[#1A2C24] mb-1">Intérêts</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {(deal.interests || []).map((tag: string, i: number) => (
            <span key={i} className="px-3 py-1 border border-black rounded-full text-sm">{tag}</span>
          ))}
        </div>

        <h3 className="font-semibold text-[#1A2C24] mb-1">Type de contenu</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {(deal.typeOfContent || []).map((tag: string, i: number) => (
            <span key={i} className="px-3 py-1 border border-black rounded-full text-sm">{tag}</span>
          ))}
        </div>
      </div>

      <div className="px-4 mb-4">
        <ProgressRibbon currentStep={getCurrentStep()} status={status} />
      </div>

      {status === "Accepté" && (
        <div className="px-4 mb-6">
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="mb-4" />
          {uploads.map((upload, i) => {
            const isValid = upload.likes > 0 && upload.shares > 0 && upload.image;

            return (
              <div key={i} className="mb-6 relative">
                {/* Image et bouton supprimer */}
                <div className="relative">
                  <img
                    src={upload.image}
                    alt={`Upload ${i}`}
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />
                  <button
                    onClick={() => handleDeleteUpload(i)}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow"
                  >
                    <Trash2 className="text-red-500 w-4 h-4" />
                  </button>
                </div>

                {/* Champs likes et partages */}
                <div className="flex gap-4 mb-2">
                  <input
                    type="number"
                    placeholder="Likes"
                    value={upload.likes}
                    onChange={(e) => handleUpdateField(i, "likes", parseInt(e.target.value))}
                    className="border px-2 py-1 rounded w-full"
                  />
                  <input
                    type="number"
                    placeholder="Shares"
                    value={upload.shares}
                    onChange={(e) => handleUpdateField(i, "shares", parseInt(e.target.value))}
                    className="border px-2 py-1 rounded w-full"
                  />
                </div>

                {!isValid && !upload.isValidated && (
                  <p className="text-red-500 text-sm mb-2">
                    Veuillez remplir tous les champs pour valider.
                  </p>
                )}

                {isValid && !upload.isValidated && (
                  <button
                    disabled={upload.loading}
                    onClick={() => handleValidateUpload(i)}
                    className={`w-full py-2 rounded text-white ${upload.loading ? "bg-gray-400" : "bg-orange-500"
                      }`}
                  >
                    {upload.loading ? "Validation..." : "Valider cet upload"}
                  </button>
                )}

                {/* Message de confirmation */}
                {upload.isValidated && (
                  <p className="text-green-600 font-semibold text-center">Upload validé ✅</p>
                )}
              </div>
            );
          })}



          <button
            onClick={handleMarkAsDone}
            className="w-full bg-[#FF6B2E] text-white py-2 rounded-lg font-semibold mt-2"
            disabled={loading}
          >
            {loading ? "Envoi..." : "Marquer comme terminé"}
          </button>
        </div>
      )}

      {status === "Approbation" && (
        <div className="px-4 mb-6 flex flex-col gap-3">
          <button disabled className="w-full bg-gray-400 text-white py-2 rounded-lg font-semibold">
            En attente d’approbation
          </button>
          <button
            onClick={handleUndoMarkAsDone}
            className="w-full border border-[#FF6B2E] text-[#FF6B2E] py-2 rounded-lg font-semibold"
            disabled={loading}
          >
            {loading ? "Retour..." : "Marquer comme non terminé"}
          </button>
        </div>
      )}

      {status === "Refusé" && (
        <div className="px-4 mb-6">
          <button disabled className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold">
            Refusé
          </button>
        </div>
      )}

      {status === "Terminé" && candidature.influreview && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Avis laissé :</h2>
          <p className="text-gray-700">"{candidature.influreview.comment}"</p>
        </div>
      )}

      {status === "Terminé" && (
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

const ProgressRibbon = ({ currentStep = 1, status }: { currentStep: number; status: string }) => {
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
