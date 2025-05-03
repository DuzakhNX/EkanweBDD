import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import Navbar from "./Navbar";
import {
  Heart,
  Eye,
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
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalShares: 0,
    totalCompletedDeals: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  const toggleSave = (index: number) => {
    setSavedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    const fetchStatsAndReviews = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const dealsSnap = await getDocs(collection(db, "deals"));
      let allReviews: any[] = [];
      let likes = 0;
      let shares = 0;
      let ratings: number[] = [];
      let completedDeals = 0;

      for (const deal of dealsSnap.docs) {
        const dealData = deal.data();
        if (dealData.merchantId !== currentUser.uid) continue;

        const candidatures = dealData.candidatures || [];
        for (const c of candidatures) {
          if (c.status === "Terminé") completedDeals++;
          if (c.proofs && Array.isArray(c.proofs)) {
            c.proofs.forEach((proof: any) => {
              likes += proof.likes || 0;
              shares += proof.shares || 0;
            });
          }

          if (c.review) {
            allReviews.push({
              userId: c.review.userId,
              username: c.review.fromUsername,
              avatar: c.review.avatar || null,
              rating: c.review.rating || 0,
              comment: c.review.comment || "",
              likes: c.proofs?.reduce((acc: number, p: any) => acc + (p.likes || 0), 0) || 0,
              shares: c.proofs?.reduce((acc: number, p: any) => acc + (p.shares || 0), 0) || 0,
              dealId: deal.id,
              influenceurId: c.influenceurId,
            });

            ratings.push(c.review.rating);
          }
        }
      }

      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      setReviews(allReviews);
      setStats({
        totalLikes: likes,
        totalShares: shares,
        totalCompletedDeals: completedDeals,
        averageRating: parseFloat(avgRating.toFixed(1)),
      });
      setLoading(false);
    };

    fetchStatsAndReviews();
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
    <div className="flex flex-col min-h-screen bg-[#F5F5E7] text-[#14210F]">
      {/* Header */}
      <div className="bg-[#F5F5E7] mt-2 py-2 px-4 flex items-center mb-5 justify-between">
        <h1 className="text-3xl text-[#1A2C24] font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/notificationcommercant")}>
            <img src={cloche} alt="cloche" className="w-7 h-7" />
          </button>
          <button
            onClick={() => navigate(auth.currentUser?.uid && localStorage.getItem("role") === "influenceur" ? "/dealsinfluenceur" : "/dealscommercant")}
          >
            <img src={sign} alt="Ekanwe Sign" className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="px-4 mb-6 grid grid-cols-2 gap-4 text-white">
        <div className="bg-[#1A2C24] p-4 rounded-lg shadow">
          <p className="text-sm">Deals terminés</p>
          <h2 className="text-2xl font-bold">{stats.totalCompletedDeals}</h2>
        </div>
        <div className="bg-[#1A2C24] p-4 rounded-lg shadow">
          <p className="text-sm">Note Moyenne</p>
          <h2 className="text-2xl font-bold">{stats.averageRating} / 5</h2>
        </div>
        <div className="bg-[#1A2C24] p-4 rounded-lg shadow">
          <p className="text-sm">Total Likes</p>
          <h2 className="text-2xl font-bold">{stats.totalLikes}</h2>
        </div>
        <div className="bg-[#1A2C24] p-4 rounded-lg shadow">
          <p className="text-sm">Total Partages</p>
          <h2 className="text-2xl font-bold">{stats.totalShares}</h2>
        </div>
      </div>

      {/* Reviews Section */}
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
                onClick={() => navigate(`/dealdetailcommercant/${review.dealId}/${review.influenceurId}`)}
                className="bg-[#1A2C24] text-white rounded-lg overflow-hidden p-4"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={review.avatar || "https://ui-avatars.com/api/?name=" + review.username}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{review.username}</h3>
                    <div className="flex mt-1">{renderStars(review.rating)}</div>
                    <p className="text-sm mt-2 text-gray-100">{review.comment}</p>
                  </div>
                  <button className="focus:outline-none" onClick={() => toggleSave(index)}>
                    <img src={savedItems[index] ? fullsave : save} alt="Save" className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[#F5F5E7] text-[#14210F] px-3 py-2 text-xs mt-4 rounded-lg">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    <span className="font-medium">{review.likes}</span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="font-medium">{review.shares}</span>
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
