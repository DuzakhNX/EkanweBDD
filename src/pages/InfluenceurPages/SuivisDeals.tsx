import { useEffect, useState } from "react";
import loupe from "../../assets/loupe.png";
import cloche from "../../assets/clochenotification.png";
import sign from "../../assets/ekanwesign.png";
import menu from "../../assets/menu.png";
import { ArrowRight, MessageCircle } from "lucide-react";
import BottomNavbar from "./BottomNavbar";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import profile from "../../assets/profile.png";

const SuivisDealsPageInfluenceur = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const filters = ["Tous", "Envoyé", "Accepté", "Refusé", "Terminé"];
  const [candidatures, setCandidatures] = useState<any[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const dealsRef = collection(db, "deals");

    const unsubscribe = onSnapshot(dealsRef, (snapshot) => {
      const myCandidatures: any[] = [];

      snapshot.forEach((docSnap) => {
        const deal = docSnap.data();
        const dealId = docSnap.id;
        const allCandidatures = deal.candidatures || [];

        allCandidatures.forEach((candidature: any, index: number) => {
          if (candidature.influenceurId === user.uid) {
            myCandidatures.push({
              ...candidature,
              dealId,
              dealInfo: deal,
              candidatureIndex: index,
            });
          }
        });
      });

      setCandidatures(myCandidatures);
    });

    return () => unsubscribe();
  }, []);

  const getProgressStyles = (status: string) => {
    const stages = ["Envoyé", "Accepté", "Terminé"];
    const currentStageIndex = stages.indexOf(status);

    return {
      Envoyé: { text: "font-bold text-[#1A2C24]" },
      Accepté: { text: currentStageIndex >= 1 ? "font-bold text-[#1A2C24]" : "text-gray-500" },
      completed: { text: currentStageIndex >= 2 ? "font-bold text-[#1A2C24]" : "text-gray-500" },
      line1: currentStageIndex >= 1 ? "bg-[#1A2C24] h-0.5 w-10 mx-1" : "bg-gray-300 h-0.5 w-10 mx-1 border-dashed",
      line2: currentStageIndex >= 2 ? "bg-[#1A2C24] h-0.5 w-10 mx-1" : "bg-gray-300 h-0.5 w-10 mx-1 border-dashed",
    };
  };

  const filteredCandidatures = selectedFilter === "Tous"
    ? candidatures
    : candidatures.filter((c) => c.status === selectedFilter);

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-32 pt-5">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-bold">Suivi Deals</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/notificationinfluenceur")}> <img src={cloche} alt="Notification" className="w-6 h-6" /> </button>
          <img src={sign} alt="Ekanwe Sign" className="w-6 h-6" onClick={() => navigate("/dealsinfluenceur")} />
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
        <div className="text-center mt-10 text-gray-500">Aucun deal trouvé</div>
      ) : (
        filteredCandidatures.map((candidature, index) => {
          const progressStyles = getProgressStyles(candidature.status);
          const chatId = [auth.currentUser?.uid, candidature.dealInfo?.merchantId].sort().join("");

          return (
            <div key={index} className="relative flex border border-black rounded-lg overflow-hidden bg-white/10 m-4 items-start cursor-pointer" onClick={() => navigate(`/dealdetailinfluenceur/${candidature.dealId}`)}>
              <img src={candidature.dealInfo?.imageUrl || profile} alt={candidature.dealInfo?.title} className="aspect-square w-32 object-cover m-1 rounded-lg" />
              <div className="flex-1 p-1 flex flex-col justify-between">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-[#1A2C24]">{candidature.dealInfo?.title}</h2>
                  <span className="text-[#FF6B2E] text-xs font-bold">{candidature.dealId}</span>
                  <p className="text-xs text-gray-600 truncate">{candidature.dealInfo?.description}</p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    <span className={`text-xs ${progressStyles.Envoyé.text}`}>Envoyé</span>
                    <div className={progressStyles.line1}></div>
                    <span className={`text-xs ${progressStyles.Accepté.text}`}>Accepté</span>
                    <div className={progressStyles.line2}></div>
                    <span className={`text-xs ${progressStyles.completed.text}`}>Effectué</span>
                  </div>
                  {/* onClick={async () => {
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
                                      }} */}
                  <button onClick={ async(e) => {
                    e.stopPropagation();
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
                  }}
                  className="bg-[#FF6B2E] text-white p-1 rounded-full ml-2">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-5 h-5 text-[#14210F] ml-2" />
                </div>
              </div>
            </div>
          );
        })
      )}

      <BottomNavbar />
    </div >
  );
};

export default SuivisDealsPageInfluenceur;
