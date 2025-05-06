import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, updateDoc, where, query } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import loupe from "../../assets/loupe.png";
import menu from "../../assets/menu.png";
import cloche from "../../assets/clochenotification.png";
import sign from "../../assets/ekanwesign.png";
import Navbar from "./Navbar";
import profile from "../../assets/profile.png";
import { sendNotification } from "../../hooks/sendNotifications";

export default function SuivisDealsPageCommercant() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [candidatures, setCandidatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  const filters = ["Tous", "Envoyé", "Accepté", "Approbation", "Terminé", "Refusé"];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchUserRole = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setUserRole(snap.data().role);
      }
    };

    fetchUserRole();

    const dealsRef = collection(db, "deals");
    const q = query(dealsRef, where("merchantId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const merchantCandidatures: any[] = [];

      snapshot.forEach((docSnap) => {
        const deal = docSnap.data();
        const dealId = docSnap.id;
        const allCandidatures = deal.candidatures || [];

        allCandidatures.forEach((candidature: any, index: number) => {
          merchantCandidatures.push({
            ...candidature,
            candidatureIndex: index,
            dealId,
            dealInfo: deal,
          });
        });
      });

      setCandidatures(merchantCandidatures);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (
    dealId: string,
    candidatureIndex: number,
    newStatus: string
  ) => {
    try {
      setLoadingIndex(candidatureIndex);
      const dealRef = doc(db, "deals", dealId);
      const dealSnap = await getDoc(dealRef);

      if (dealSnap.exists()) {
        const dealData = dealSnap.data();
        const candidatures = dealData?.candidatures || [];

        const updatedCandidature = candidatures[candidatureIndex];
        updatedCandidature.status = newStatus;
        await updateDoc(dealRef, { candidatures });

        if (newStatus === "Accepté" || newStatus === "Refusé") {
          await sendNotification({
            toUserId: updatedCandidature.influenceurId,
            fromUserId: dealData.merchantId,
            message: `Votre candidature au deal "${dealData.title}" a été ${newStatus.toLowerCase()}.`,
            relatedDealId: dealId,
            type: "candidature_update",
            targetRoute: `/dealdetailinfluenceur/${dealId}`
          });
        }

        setLoadingIndex(null);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut :", error);
      setLoadingIndex(null);
    }
  };

  const filteredCandidatures =
    selectedFilter === "Tous"
      ? candidatures
      : candidatures.filter((c) => c.status === selectedFilter);

  const getProgressColor = (status: string) => {
    switch (status) {
      case "Approbation": return "bg-gray-500";
      case "Terminé": return "bg-[#1A2C24]";
      case "Accepté": return "bg-blue-900";
      default: return "bg-gray-500";
    }
  };

  const getProgressLabel = (status: string) => {
    switch (status) {
      case "Approbation": return "En attente de validation";
      case "Terminé": return "Mission terminée";
      case "Accepté": return "En cours ...";
      default: return status;
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

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-32 pt-5">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-bold">Suivi Candidatures</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/notificationcommercant")}> <img src={cloche} alt="Notification" className="w-6 h-6" /> </button>
          <img src={sign} alt="Ekanwe Sign" className="w-6 h-6 cursor-pointer" onClick={() => navigate(userRole === "influenceur" ? "/dealsinfluenceur" : "/dealscommercant")} />
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex items-center bg-white/10 border border-black rounded-lg px-3 py-2">
          <img src={loupe} alt="loupe" className="w-6 h-6 mr-3" />
          <input type="text" placeholder="Recherche" className="flex-grow outline-none bg-transparent text-2xs" />
          <img src={menu} alt="Menu" className="w-6 h-6 ml-2" />
        </div>

        <div className="flex space-x-2 mt-3 overflow-x-auto">
          {filters.map((item) => (
            <button key={item} onClick={() => setSelectedFilter(item)} className={`border px-7 py-3 rounded-lg text-base ${selectedFilter === item ? "bg-[#1A2C24] text-white" : "border-[#14210F] text-[#14210F] bg-white/10"}`}>{item}</button>
          ))}
        </div>
      </div>

      {filteredCandidatures.length === 0 ? (
        <div className="text-center mt-10 text-gray-500">Aucune candidature trouvée</div>
      ) : (
        filteredCandidatures.map((candidature, index) => {
          const chatId = [candidature.dealInfo?.merchantId, candidature.influenceurId].sort().join("");
          return (
            <div key={index} className="flex border border-black rounded-lg overflow-hidden bg-white/10 m-4 items-start cursor-pointer">
              <img src={candidature.dealInfo?.imageUrl || profile} alt={candidature.dealInfo?.title} className="aspect-square w-32 object-cover m-1 rounded-lg" />
              <div className="flex-1 p-1 flex flex-col justify-between">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-[#1A2C24]">{candidature.dealInfo?.title}</h2>
                  <span className="text-[#FF6B2E] text-xs font-bold">{candidature.dealId}</span>
                  <p className="text-xs text-gray-600 truncate">{candidature.dealInfo?.description}</p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    {candidature.status === "Envoyé" ? (
                      <>
                        <button className="bg-[#1A2C24] text-white px-2 py-1 rounded text-xs disabled:opacity-50" onClick={() => handleStatusChange(candidature.dealId, candidature.candidatureIndex, "Accepté")} disabled={loadingIndex === candidature.candidatureIndex}>{loadingIndex === candidature.candidatureIndex ? "..." : "Accepter"}</button>
                        <button className="bg-red-700 text-white px-2 py-1 rounded text-xs disabled:opacity-50" onClick={() => handleStatusChange(candidature.dealId, candidature.candidatureIndex, "Refusé")} disabled={loadingIndex === candidature.candidatureIndex}>{loadingIndex === candidature.candidatureIndex ? "..." : "Refuser"}</button>
                      </>
                    ) : (
                      <span className={`text-white text-xs font-semibold px-3 py-1 rounded-full ${getProgressColor(candidature.status)}`}>{getProgressLabel(candidature.status)}</span>
                    )}
                    <button className="bg-[#FF6B2E] text-white p-1 rounded-full" onClick={async () => {
                      const userRef = doc(db, "users", candidature.influenceurId);
                      const userSnap = await getDoc(userRef);
                      if (userSnap.exists()) {
                        const userData = userSnap.data();
                        navigate(`/chat/${chatId}`, {
                          state: {
                            pseudonyme: userData.pseudonyme || "",
                            photoURL: userData.photoURL || "",
                            receiverId: candidature.influenceurId,
                            role: userData.role,
                          },
                        });
                      }
                    }}>
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#14210F]" onClick={() => navigate(`/dealdetailcommercant/${candidature.dealId}/${candidature.influenceurId}`)} />
                </div>
              </div>
            </div>
          );
        })
      )}

      <Navbar />
    </div >
  );
}
