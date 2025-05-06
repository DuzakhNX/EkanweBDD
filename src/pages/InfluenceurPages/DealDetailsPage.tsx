import { ArrowLeft, MapPin, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import BottomNavbar from "./BottomNavbar";
import { sendNotification } from "../../hooks/sendNotifications";
import profile from "../../assets/profile.png";
import sign from "../../assets/ekanwesign.png";
import fullsave from "../../assets/fullsave.png";
import save from "../../assets/save.png";

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
  const [saved, setSaved] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

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

  const handleToggleSave = () => {
    setSaved(!saved);
  };

  const handleCandidature = () => {
    setAlreadyApplied(true);
  };

  if (!deal)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5E7]">
        <div className="animate-spin-slow">
          <img src={sign} alt="Ekanwe Logo" className="w-16 h-16" />
        </div>
        <p className="mt-4 text-[#14210F]">Chargement en cours...</p>
      </div>
    );

  return (
    <div className="bg-[#f7f6ed] min-h-screen flex flex-col">
      <div className="flex items-center p-4 text-[#FF6B2E] text-lg font-medium">
        <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />
        <span className="ml-2">Deals</span>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="relative aspect-[16/9] w-full">
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
            </div>
            <div>
              <span className="text-[#FF6B2E] text-sm font-bold bg-[#FF6B2E]/10 px-3 py-1 rounded-full">#{deal.id}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl text-[#1A2C24] font-bold mb-3">Description</h3>
              <p className="text-sm text-[#1A2C24] leading-relaxed">{deal.description}</p>
            </div>

            <div>
              <h3 className="text-xl text-[#1A2C24] font-bold mb-3">Intérêts</h3>
              <div className="flex gap-2 flex-wrap">
                {deal.interests ? (
                  <span className="px-4 py-2 text-[#1A2C24] text-sm border border-black/20 rounded-lg bg-gray-50">{deal.interest}</span>
                ) : (
                  <span className="text-gray-400 text-sm">Aucun intérêt défini</span>
                )}
              </div>
            </div>

            <div className="divide-y divide-black/10 rounded-lg overflow-hidden bg-gray-50">
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
      </div>

      <div className="px-4 mb-4">
        <h3 className="text-xl font-bold text-[#1A2C24] tracking-wide mt-5 mb-2">État de la candidature</h3>
        <ProgressRibbon currentStep={getCurrentStep()} status={status} />
      </div>

      {status === "Accepté" && (
        <div className="px-4 mb-6">
          <h3 className="text-xl font-bold text-[#1A2C24] tracking-wide mb-4">Preuves de réalisation</h3>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="mb-4 w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FF6B2E] file:text-white hover:file:bg-[#e55a1f]" 
          />
          {uploads.map((upload, i) => {
            const isValid = upload.likes > 0 && upload.shares > 0 && upload.image;

            return (
              <div key={i} className="mb-6 relative">
                <div className="relative">
                  <img
                    src={upload.image}
                    alt={`Upload ${i}`}
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />
                  <button
                    onClick={() => handleDeleteUpload(i)}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 transition-colors duration-200"
                  >
                    <Trash2 className="text-red-500 w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-4 mb-2">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600  mt-5 mb-1 font-bold">Nombre de likes</label>
                    <input
                      type="number"
                      placeholder="Likes"
                      value={upload.likes}
                      onChange={(e) => handleUpdateField(i, "likes", parseInt(e.target.value))}
                      className="w-full border border-gray-200 px-3 py-2 rounded-lg focus:border-[#FF6B2E] focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mt-5 mb-1 font-bold">Nombre de partages</label>
                    <input
                      type="number"
                      placeholder="Shares"
                      value={upload.shares}
                      onChange={(e) => handleUpdateField(i, "shares", parseInt(e.target.value))}
                      className="w-full border border-gray-200 px-3 py-2 rounded-lg focus:border-[#FF6B2E] focus:outline-none"
                    />
                  </div>
                </div>

                {!isValid && !upload.isValidated && (
                  <p className="text-red-500 text-sm mb-2 font-medium">
                    Veuillez remplir tous les champs pour valider.
                  </p>
                )}

                {isValid && !upload.isValidated && (
                  <button
                    disabled={upload.loading}
                    onClick={() => handleValidateUpload(i)}
                    className={`w-full py-2 rounded-lg text-white font-bold transition-colors duration-200 ${
                      upload.loading ? "bg-gray-400" : "bg-[#FF6B2E] hover:bg-[#e55a1f]"
                    }`}
                  >
                    {upload.loading ? "Validation..." : "Valider cet upload"}
                  </button>
                )}

                {upload.isValidated && (
                  <p className="text-green-600 font-bold text-center">Upload validé ✅</p>
                )}
              </div>
            );
          })}

          <button
            onClick={handleMarkAsDone}
            className="w-full bg-[#FF6B2E] text-white py-2 rounded-lg font-bold mt-2 hover:bg-[#e55a1f] transition-colors duration-200"
            disabled={loading}
          >
            {loading ? "Envoi..." : "Marquer comme terminé"}
          </button>
        </div>
      )}

      {status === "Approbation" && (
        <div className="px-4 mb-6 flex flex-col gap-3">
          <button disabled className="w-full bg-gray-400 text-white py-2 rounded-lg font-bold">
            En attente d'approbation
          </button>
          <button
            onClick={handleUndoMarkAsDone}
            className="w-full border-2 border-[#FF6B2E] text-[#FF6B2E] py-2 rounded-lg font-bold hover:bg-[#FF6B2E] hover:text-white transition-colors duration-200"
            disabled={loading}
          >
            {loading ? "Retour..." : "Marquer comme non terminé"}
          </button>
        </div>
      )}

      {status === "Refusé" && (
        <div className="px-4 mb-6">
          <button disabled className="w-full bg-red-500 text-white py-2 rounded-lg font-bold">
            Candidature Refusée
          </button>
        </div>
      )}

      {status === "Terminé" && candidature.influreview && (
        <div className="px-4 mb-6">
          <h3 className="text-xl font-bold text-[#1A2C24] tracking-wide mb-2">Avis laissé</h3>
          <p className="text-gray-700 text-sm leading-relaxed">"{candidature.influreview.comment}"</p>
        </div>
      )}

      {status === "Terminé" && (
        <div className="px-4 mb-6">
          <button
            onClick={() => !hasReviewed && navigate(`/reviewinfluenceur/${dealId}`)}
            disabled={hasReviewed}
            className={`w-full py-2 rounded-lg font-bold transition-colors duration-200 ${
              hasReviewed 
                ? "bg-gray-400 text-white" 
                : "bg-[#FF6B2E] text-white hover:bg-[#e55a1f]"
            }`}
          >
            {hasReviewed ? "Déjà évalué" : "Noter le commerçant"}
          </button>
        </div>
      )}

      <div className="px-4 mb-20">
        <h3 className="font-bold text-xl text-[#1A2C24] tracking-wide mb-4">Historique</h3>
        <div className="pl-2 bg-[#F5F5E7] rounded-lg p-4">
          <ul className="space-y-8 relative">
            <div className="absolute left-1.5 top-3 bottom-3 w-0.5 bg-gray-400"></div>
            {timeline.map((event, index) => (
              <li key={index} className="relative pl-8">
                <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-[#1A2C24] z-10" />
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700 font-medium">{event.text}</span>
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
      <div className="w-full bg-red-500 rounded-lg p-2 text-center">
        <span className="text-white text-sm font-bold">Refusé</span>
      </div>
    );
  }

  const steps = ["Envoyé", "Accepté", "Approbation", "Terminé"];
  return (
    <div className="w-full bg-[#1A2C24] rounded-lg p-3">
      <div className="flex items-center justify-between w-full">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <span className={`text-[#FF6B2E] text-sm whitespace-nowrap ${index < currentStep ? "font-bold" : "opacity-70"}`}>{step}</span>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 flex items-center">
                <div className={`h-0.5 ${index < currentStep - 1 ? "bg-[#FF6B2E]" : "bg-[#FF6B2E] opacity-30"} w-full`}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
