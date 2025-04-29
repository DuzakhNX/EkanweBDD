import { useEffect, useState } from "react";
import { collectionGroup, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import Navbar from "./Navbar";
import {
  Heart,
  Eye,
  Share2,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import cloche from "../../assets/clochenotification.png";
import sign from "../../assets/ekanwesign.png";
import save from "../../assets/save.png";
import fullsave from "../../assets/fullsave.png";

export default function DashboardPageCommercant() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<Record<number, boolean>>({});

  const toggleSave = (index: number) => {
    setSavedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collectionGroup(db, "review"), (snapshot) => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
  
      const filtered = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((review: any) => review.toUserId === currentUser.uid);
  
      setReviews(filtered);
    });
  
    return () => unsubscribe();
  }, []);
  

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < rating ? "text-[#FF6B2E]" : "text-gray-300"}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5E7] text-[#14210F]">
      <div className="bg-[#F5F5E7] mt-2 py-2 px-4 flex items-center mb-5 justify-between">
        <h1 className="text-3xl text-[#1A2C24] font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/notificationcommercant")}>
            <img src={cloche} alt="cloche" className="w-7 h-7" />
          </button>
          <img src={sign} alt="Ekanwe Sign" className="w-7 h-7" />
        </div>
      </div>

      <div className="px-4 mb-11">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl text-[#1A2C24] font-bold">Avis des influenceurs</h2>
          <div className="flex items-center justify-center bg-[#14210F] text-white h-6 w-6 rounded-full text-xs">
            <MoreHorizontal className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-400 bg-opacity-20">
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <div
                key={index}
                className="bg-[#1A2C24] text-white rounded-lg overflow-hidden p-4"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">
                      {review.fromUsername || "Influenceur"}
                    </h3>
                    <p className="text-sm mt-1">{review.comment || "Aucun commentaire."}</p>
                    <div className="flex mt-2">{renderStars(review.rating)}</div>
                  </div>
                  <button
                    className="focus:outline-none"
                    onClick={() => toggleSave(index)}
                  >
                    <img
                      src={savedItems[index] ? fullsave : save}
                      alt="Save"
                      className="w-6 h-6"
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[#F5F5E7] text-[#14210F] px-3 py-2 text-xs mt-4 rounded-lg">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    <span className="font-medium">{review.likes || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="font-medium">{review.views || 0}</span>
                    <TrendingUp className="h-3 w-3 ml-1 text-green-500" />
                  </div>
                  <div className="flex items-center">
                    <Share2 className="h-4 w-4 mr-1" />
                    <span className="font-medium">{review.shares || 0}</span>
                    <TrendingDown className="h-3 w-3 ml-1 text-red-500" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-700">Aucun avis pour l'instant.</div>
          )}
        </div>
      </div>

      <Navbar />
    </div>
  );
}
