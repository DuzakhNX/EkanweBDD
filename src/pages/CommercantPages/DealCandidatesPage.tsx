import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import fillplus from "../../assets/fillplus.png";
import Navbar from "./Navbar";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, getDocs, collection } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import { sendNotification } from "../../hooks/sendNotifications";
import profile from "../../assets/profile.png";
import sign from "../../assets/ekanwesign.png";

export default function DealCandidatesPageCommercant() {
  const navigate = useNavigate();
  const { dealId } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);
  const [averageRatings, setAverageRatings] = useState<Record<string, number>>({});

  interface Candidature {
    influenceurId: string;
    status: string;
  }

  async function getAllDeals() {
    const snapshot = await getDocs(collection(db, "deals"));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  function calculateAverageRatings(deals: any[]) {
    const ratingMap: Record<string, { total: number; count: number }> = {};
    deals.forEach((deal) => {
      deal.candidatures?.forEach((cand: any) => {
        const uid = cand.influenceurId;
        const rating = cand.influreview?.rating;
        if (uid && typeof rating === "number") {
          if (!ratingMap[uid]) {
            ratingMap[uid] = { total: rating, count: 1 };
          } else {
            ratingMap[uid].total += rating;
            ratingMap[uid].count += 1;
          }
        }
      });
    });
    const averageMap: Record<string, number> = {};
    for (const uid in ratingMap) {
      averageMap[uid] = ratingMap[uid].total / ratingMap[uid].count;
    }
    return averageMap;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!dealId) return;
        const dealRef = doc(db, "deals", dealId);
        const dealSnap = await getDoc(dealRef);
        const deals = await getAllDeals();
        const averages = calculateAverageRatings(deals);
        setAverageRatings(averages);

        if (dealSnap.exists()) {
          const dealData = dealSnap.data();
          setDeal(dealData);

          const candidatureList = dealData.candidatures || [];

          const allCandidates = await Promise.all(
            candidatureList.map(async (candidature: Candidature) => {
              const userId = candidature.influenceurId;
              const userSnap = await getDoc(doc(db, "users", userId));

              if (!userSnap.exists()) return null;

              return {
                influenceurId: userId,
                userInfo: userSnap.data(),
                status: candidature.status || "Envoyé",
              };
            })
          );

          setCandidates(allCandidates.filter(Boolean));
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dealId]);

  const renderStars = (rating: number) => {
    return Array(5).fill(null).map((_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-orange-500' : 'text-gray-300'}`}>★</span>
    ));
  };

  const updateStatus = async (influenceurId: string, status: string) => {
    setButtonLoading(influenceurId + status);
    const dealRef = doc(db, "deals", dealId!);

    try {
      const dealDoc = await getDoc(dealRef);
      if (!dealDoc.exists()) return;

      const dealData = dealDoc.data();
      const updatedCandidatures = dealData.candidatures.map((candidature: any) =>
        candidature.influenceurId === influenceurId
          ? { ...candidature, status }
          : candidature
      );

      await updateDoc(dealRef, { candidatures: updatedCandidatures });

      await sendNotification({
        toUserId: influenceurId,
        message: `Votre candidature a été ${status === "Accepté" ? "acceptée" : "refusée"}.`,
        relatedDealId: dealId!,
        targetRoute: `/dealdetailinfluenceur/${dealId}`,
        fromUserId: auth.currentUser?.uid || "",
        type: "status_update",
      });

      setCandidates(prev => prev.map(c =>
        c.influenceurId === influenceurId ? { ...c, status } : c
      ));
    } catch (error) {
      console.error("Erreur mise à jour statut :", error);
    } finally {
      setButtonLoading(null);
    }
  };

  const cancelContract = async (influenceurId: string) => {
    setButtonLoading(influenceurId + "cancel");
    const dealRef = doc(db, "deals", dealId!);

    try {
      const dealDoc = await getDoc(dealRef);
      if (!dealDoc.exists()) return;

      const dealData = dealDoc.data();
      const updatedCandidatures = dealData.candidatures.filter(
        (candidature: any) => candidature.influenceurId !== influenceurId
      );

      await updateDoc(dealRef, { candidatures: updatedCandidatures });

      await sendNotification({
        toUserId: influenceurId,
        message: `Votre contrat a été résilié.`,
        relatedDealId: dealId!,
        targetRoute: `/dealdetailinfluenceur/${dealId}`,
        fromUserId: auth.currentUser?.uid || "",
        type: "contract_cancelled",
      });

      setCandidates(prev => prev.filter(c => c.influenceurId !== influenceurId));
    } catch (error) {
      console.error("Erreur résiliation :", error);
    } finally {
      setButtonLoading(null);
    }
  };

  const refuseCandidate = async (influenceurId: string) => {
    setButtonLoading(influenceurId + "refus");
    const dealRef = doc(db, "deals", dealId!);

    try {
      const dealDoc = await getDoc(dealRef);
      if (!dealDoc.exists()) return;

      const dealData = dealDoc.data();
      const updatedCandidatures = dealData.candidatures.map((candidature: any) =>
        candidature.influenceurId === influenceurId
          ? { ...candidature, status: "Refusé" }
          : candidature
      );

      await updateDoc(dealRef, { candidatures: updatedCandidatures });

      await sendNotification({
        toUserId: influenceurId,
        message: `Votre candidature a été refusée.`,
        relatedDealId: dealId!,
        targetRoute: `/dealdetailinfluenceur/${dealId}`,
        fromUserId: auth.currentUser?.uid || "",
        type: "candidature_refused",
      });

      setCandidates(prev => prev.map(c =>
        c.influenceurId === influenceurId ? { ...c, status: "Refusé" } : c
      ));
    } catch (error) {
      console.error("Erreur refus candidature :", error);
    } finally {
      setButtonLoading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5E7]">
      <div className="bg-white py-3 px-4 flex items-center border-b justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-[#FF6B2E]">
          <ArrowLeft className="h-6 w-6 mr-1" />
          <span className="text-xl font-medium">Retour</span>
        </button>
        <img
          src={sign}
          onClick={() => navigate("/dealscommercant")}
          className="h-6 w-6 cursor-pointer"
          alt="ekanwe-logo"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5E7]">
          <div className="animate-spin-slow">
            <img src={sign} alt="Ekanwe Logo" className="w-16 h-16" />
          </div>
          <p className="mt-4 text-[#14210F]">Chargement en cours...</p>
        </div>
      ) : (
        deal && (
          <>
            <div className="relative">
              <img
                src={deal.imageUrl || profile}
                alt="Deal"
                className="w-full h-48 object-cover"
              />
              <button className="absolute bottom-2 right-2 rounded-full p-1">
                <img src={fillplus} alt="Edit" className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 bg-white border-b">
              <h1 className="text-3xl font-bold text-[#1A2C24] mb-1">{deal.title}</h1>
              <div className="flex items-center text-sm text-[#FF6B2E]">
                <MapPin className="w-5 h-5 mr-1" />
                {deal.location || "Non défini"}
              </div>
            </div>

            <div className="p-4 bg-white border-b">
              <h2 className="font-bold mb-2 text-xl text-[#1A2C24]">Description du Deal</h2>
              <p className="text-[#1A2C24] text-sm">{deal.description || "Aucune description fournie."}</p>
            </div>

            <div className="p-4 bg-white border-b">
              <h2 className="font-bold mb-2 text-xl text-[#1A2C24]">Candidats</h2>
              {candidates.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun candidat pour ce deal pour l'instant.</p>
              ) : (
                <div className="space-y-3">
                  {candidates.map((cand) => (
                    <div
                      key={cand.influenceurId}
                      className="p-3 rounded-lg border border-black bg-white cursor-pointer"
                      onClick={() => navigate(`/profilpubliccommercant/${cand.influenceurId}`, { state: { userId: cand.influenceurId } })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-16 h-16 rounded overflow-hidden mr-3">
                            <img
                              src={cand.userInfo?.photoURL || profile}
                              alt={cand.userInfo?.pseudonyme || "Influenceur"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-[#1A2C24]">
                              {cand.userInfo?.pseudonyme || "Utilisateur"}
                            </p>
                            <div className="flex mt-1">{renderStars(Math.round(averageRatings[cand.influenceurId] || 0))}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {cand.status === "Envoyé" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(cand.influenceurId, "Accepté");
                                }}
                                disabled={buttonLoading === cand.influenceurId + "Accepté"}
                                className="bg-[#1A2C24] text-white text-xs px-3 py-1 rounded disabled:opacity-50"
                              >
                                {buttonLoading === cand.influenceurId + "Accepté" ? "..." : "ACCEPTER"}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  refuseCandidate(cand.influenceurId);
                                }}
                                disabled={buttonLoading === cand.influenceurId + "refus"}
                                className="text-[#1A2C24] border border-[#1A2C24] text-xs px-3 py-1 rounded disabled:opacity-50"
                              >
                                {buttonLoading === cand.influenceurId + "refus" ? "..." : "REFUSER"}
                              </button>
                            </>
                          )}
                          {cand.status === "Accepté" && (
                            <>
                              <span className="bg-gray-300 px-3 py-1 text-xs rounded">EN COURS</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelContract(cand.influenceurId);
                                }}
                                disabled={buttonLoading === cand.influenceurId + "cancel"}
                                className="text-red-500 text-xs underline disabled:opacity-50"
                              >
                                {buttonLoading === cand.influenceurId + "cancel" ? "..." : "RÉSILIER"}
                              </button>
                            </>
                          )}
                          {cand.status === "Refusé" && (
                            <span className="text-red-500 text-xs font-bold">REFUSÉ</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )
      )}

      <div className="w-full mt-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 py-3 bg-[#1A2C24] text-white font-bold text-center w-full"
        >
          RETOUR
        </button>
      </div>
      <Navbar />
    </div>
  );
}
