import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, updateDoc, where, query } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import loupe from "../../assets/loupe.png";
import menu from "../../assets/menu.png";
import cloche from "../../assets/clochenotification.png";
import sign from "../../assets/ekanwesign.png";
import Navbar from "./Navbar";
import profile from "../../assets/profile.png"

export default function SuivisDealsPageCommercant() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [candidatures, setCandidatures] = useState<any[]>([]);

  const filters = ["Tous", "Envoyé", "Accepté", "Terminé", "Refusé"];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

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
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (dealId: string, candidatureIndex: number, newStatus: string) => {
    try {
      const dealRef = doc(db, "deals", dealId);
      const dealSnap = await getDoc(dealRef);

      if (dealSnap.exists()) {
        const dealData = dealSnap.data();
        const candidatures = dealData?.candidatures || [];

        candidatures[candidatureIndex].status = newStatus;

        await updateDoc(dealRef, { candidatures });

        console.log(`Statut mis à jour en ${newStatus}`);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut :", error);
    }
  };

  const filteredCandidatures = selectedFilter === "Tous"
    ? candidatures
    : candidatures.filter((c) => c.status === selectedFilter);

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-32 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-bold">Suivi Candidatures</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/notificationcommercant")}>
            <img src={cloche} alt="Notification" className="w-6 h-6" />
          </button>
          <img src={sign} alt="Ekanwe Sign" className="w-6 h-6" />
        </div>
      </div>

      {/* Recherche */}
      <div className="px-4 mb-4">
        <div className="flex items-center bg-white/10 border border-black rounded-lg px-3 py-2">
          <img src={loupe} alt="loupe" className="w-6 h-6 mr-3" />
          <input
            type="text"
            placeholder="Recherche"
            className="flex-grow outline-none bg-transparent text-2xs"
          />
          <img src={menu} alt="Menu" className="w-6 h-6 ml-2" />
        </div>

        <div className="flex space-x-2 mt-3 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setSelectedFilter(item)}
              className={`border px-7 py-3 rounded-lg text-base ${selectedFilter === item
                  ? "bg-[#1A2C24] text-white"
                  : "border-[#14210F] text-[#14210F] bg-white/10"
                }`}
            >
              {item === "Tous" ? "Tous" : item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des candidatures */}
      {filteredCandidatures.length === 0 ? (
        <div className="text-center mt-10 text-gray-500">Aucune candidature trouvée</div>
      ) : (
        filteredCandidatures.map((candidature, index) => (
          <div
            key={index}
            className="flex border border-black rounded-lg overflow-hidden bg-white/10 m-4 items-start cursor-pointer"
            onClick= {() => navigate(`dealdetailcommercant/${candidature.dealId}/${candidature.influenceurId}`)}
          >
            <img
              src={candidature.dealInfo?.imageUrl || profile}
              alt={candidature.dealInfo?.title}
              className="w-32 h-32 object-cover m-1 rounded-lg"
            />
            <div className="flex-1 p-1 flex flex-col justify-between">
              <div className="mb-2">
                <h2 className="text-xl font-bold text-[#1A2C24]">{candidature.dealInfo?.title}</h2>
                <span className="text-[#FF6B2E] text-xs font-bold">{candidature.dealId}</span>
                <p className="text-xs text-gray-600 truncate">{candidature.dealInfo?.description}</p>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold">{candidature.status}</span>
                  {candidature.status === "Envoyé" && (
                    <>
                      <button
                        className="bg-[#1A2C24] text-white px-2 py-1 rounded text-xs"
                        onClick={() => handleStatusChange(candidature.dealId, candidature.candidatureIndex, "Accepté")}
                      >
                        Accepter
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        onClick={() => handleStatusChange(candidature.dealId, candidature.candidatureIndex, "Refusé")}
                      >
                        Refuser
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center">
                  <span
                    className="flex items-end justify-end"
                  >
                    <ArrowRight className="w-5 h-5 text-[#14210F]" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
      <Navbar />
    </div>
  );
}
