import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where, getDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import cloche from "../../assets/clochenotification.png";
import sign from "../../assets/ekanwesign.png";
import loupe from "../../assets/loupe.png";
import menu from "../../assets/menu.png";
import save from "../../assets/save.png";
import fullsave from "../../assets/fullsave.png";
import plus from "../../assets/plus.png";
import Navbar from "./Navbar";
import profile from "../../assets/profile.png";

export default function DealsPageCommercant() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("Deals");
  const [savedItems, setSavedItems] = useState<Record<number, boolean>>({});
  const [deals, setDeals] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const propositionRef = useRef<HTMLDivElement>(null);
  const influencerRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -370 : 370,
        behavior: "smooth",
      });
    }
  };

  const toggleSave = (index: number) => {
    setSavedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(null).map((_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-[#FF6B2E]' : 'text-gray-300'}`}>★</span>
    ));
  };

  const handleSignClick = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const role = userSnap.data()?.role;
      if (role === "influenceur") navigate("/dealsinfluenceur");
      else navigate("/dealscommercant");
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return navigate("/login");

    const dealsQuery = query(collection(db, "deals"), where("merchantId", "==", user.uid));
    const influencersQuery = query(collection(db, "users"), where("role", "==", "influenceur"));

    const unsubscribeDeals = onSnapshot(dealsQuery, (snapshot) => {
      const dealsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeals(dealsData);
      setLoading(false);
    });

    const unsubscribeInfluencers = onSnapshot(influencersQuery, (snapshot) => {
      const influencersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInfluencers(influencersData);
    });

    return () => {
      unsubscribeDeals();
      unsubscribeInfluencers();
    };
  }, []);

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
        <h1 className="text-3xl font-bold">Deals</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/notificationcommercant")}>
            <img src={cloche} alt="Notify" className="w-6 h-6" />
          </button>
          <button onClick={handleSignClick}>
            <img src={sign} alt="Ekanwe Sign" className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex items-center bg-white/10 border border-black rounded-lg px-3 py-2">
          <img src={loupe} alt="loupe" className="w-6 h-6 mr-3" />
          <input type="text" placeholder="Recherche" className="flex-grow bg-transparent text-2xs outline-none" />
          <img src={menu} alt="Menu" className="w-6 h-6 ml-2" />
        </div>

        <div className="flex space-x-2 mt-3 overflow-x-auto">
          {["Deals", "Influenceurs"].map(item => (
            <button
              key={item}
              onClick={() => setSelectedFilter(item)}
              className={`border px-12 py-3 rounded-lg text-sm ${selectedFilter === item ? "bg-[#1A2C24] text-white" : "border-[#14210F] text-[#14210F] bg-white/10"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {selectedFilter === "Deals" && (
        <>
          <div className="px-4 py-2">
            <button
              className="w-full flex gap-2 items-center justify-between p-3 border border-black bg-[#FF6B2E] text-[#1A2C24] font-bold py-1 rounded-lg"
              onClick={() => navigate("/merchantdetailcommercant")}
            >
              Faire un deal
              <img src={plus} alt="plus" className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center px-4 justify-between mb-2 mt-4">
            <h2 className="text-xl font-bold">Proposition de deal</h2>
            <div className="flex space-x-4 text-2xl">
              <button onClick={() => scroll(propositionRef, "left")}>←</button>
              <button onClick={() => scroll(propositionRef, "right")}>→</button>
            </div>
          </div>

          <div ref={propositionRef} className="px-4 mb-6 flex space-x-4 overflow-x-auto scrollbar-hide">
            {deals.length === 0 ? (
              <div className="text-center text-gray-500 mt-4">Aucun deal trouvé.</div>
            ) : (
              deals.map((deal, index) => (
                <div key={deal.id} className="min-w-[80%] bg-[#1A2C24] rounded-xl overflow-hidden shadow-lg flex flex-col">
                  <div className="flex p-4">
                    <div className="w-1/2 pr-2">
                      <div className="h-32 rounded-lg overflow-hidden">
                        <img
                          src={deal.imageUrl || profile}
                          alt={deal.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="w-1/2 pl-2 flex flex-col">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg text-white font-bold mb-1">{deal.title || "Sans titre"}</h3>
                        <button onClick={() => toggleSave(index)}>
                          <img src={savedItems[index] ? fullsave : save} alt="Save" className="w-6 h-6" />
                        </button>
                      </div>
                      <p className="text-xs text-white mb-2">
                        <span className="font-bold">Description :</span> {deal.description || "-"}
                      </p>
                      <div className="flex mt-auto">
                        {renderStars(deal.rating || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0 mt-auto">
                    <div className="flex justify-between">
                      <button
                        className="text-white border border-white rounded-lg px-4 py-2 text-sm"
                        onClick={() => navigate(`/dealcandidatescommercant/${deal.id}`)}
                      >
                        Voir plus
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {selectedFilter === "Influenceurs" && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Influenceurs</h2>
            <div className="flex space-x-4 text-2xl">
              <button onClick={() => scroll(influencerRef, "left")}>←</button>
              <button onClick={() => scroll(influencerRef, "right")}>→</button>
            </div>
          </div>
          <div ref={influencerRef} className="flex space-x-4 overflow-x-auto scrollbar-hide">
            {influencers.length === 0 ? (
              <div className="text-center text-gray-500 mt-4">Aucun influenceur trouvé.</div>
            ) : (
              influencers.map((influencer, index) => (
                <div key={influencer.id} className="min-w-[80%] bg-[#1A2C24] rounded-xl overflow-hidden shadow-lg">
                  <div className="relative w-full h-40">
                    <img
                      src={influencer.photoURL || profile}
                      alt={influencer.username}
                      className="w-full h-full object-cover rounded-t-xl"
                      onClick={() => navigate(`/profilpubliccommercant/${influencer.id}`)}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg text-white font-bold mb-1">{influencer.pseudonyme || "Influenceur"}</h3>
                      <button onClick={() => toggleSave(index + 100)}>
                        <img
                          src={savedItems[index + 100] ? fullsave : save}
                          alt="Save"
                          className="w-6 h-6"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Navbar />
    </div>
  );
}
