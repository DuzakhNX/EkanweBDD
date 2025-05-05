import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import sign from "../../assets/ekanwesign.png";

const ThankYouModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-[#F5F5E7] rounded-2xl p-6 w-full max-w-sm transform transition-all">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#FF6B2E]/10 mb-4">
                        <svg className="h-10 w-10 text-[#FF6B2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-[#14210F] mb-2">Merci pour votre évaluation !</h3>
                    <p className="text-gray-600 mb-6">Votre retour est précieux pour améliorer la qualité des prestations sur Ekanwe.</p>
                    <button onClick={onClose} className="w-full bg-[#FF6B2E] text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-[#FF6B2E]/90 transition-colors">
                        Retour aux prestations
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function ReviewPageCommercant() {
    const navigate = useNavigate();
    const { dealId, influenceurId } = useParams();
    const [comment, setComment] = useState("");
    const [deal, setDeal] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [ratings, setRatings] = useState([
        { category: "Qualité de la prestation", score: 0 },
        { category: "Respect des délais", score: 0 },
        { category: "Communication", score: 0 },
        { category: "Professionnalisme", score: 0 },
        { category: "Rapport qualité/prix", score: 0 }
    ]);

    useEffect(() => {
        const fetchData = async () => {
            if (!dealId) return;

            const dealRef = doc(db, "deals", dealId);
            const dealSnap = await getDoc(dealRef);

            if (dealSnap.exists()) setDeal(dealSnap.data());

            const uid = auth.currentUser?.uid;
            if (uid) {
                const userRef = doc(db, "users", uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) setUser(userSnap.data());
            }
        };

        fetchData();
    }, [dealId]);

    const handleSubmit = async () => {
        if (!dealId || !user) return;
      
        const hasRating = ratings.some(r => r.score > 0);
        if (!hasRating) return alert("Veuillez attribuer au moins une étoile.");
        if (!comment.trim()) return alert("Veuillez écrire un commentaire.");
      
        const avgRating = Math.round(
          ratings.reduce((acc, cur) => acc + cur.score, 0) / ratings.length
        );
      
        try {
          const dealRef = doc(db, "deals", dealId);
          const dealSnap = await getDoc(dealRef);
          if (!dealSnap.exists()) return;
      
          const dealData = dealSnap.data();
          const uid = auth.currentUser?.uid;
      
          const updatedCandidatures = dealData.candidatures.map((cand: any) => {
            if (cand.influenceurId === influenceurId) {
              return {
                ...cand,
                influreview: {
                  userId: uid,
                  fromUsername: user.pseudonyme || user.prenom || "Utilisateur",
                  avatar: user.photoURL || null,
                  rating: avgRating,
                  comment: comment.trim(),
                }
              };
            }
            return cand;
          });
      
          await updateDoc(dealRef, { candidatures: updatedCandidatures });
          setIsModalOpen(true);
        } catch (error) {
          console.error("Erreur lors de la soumission de l'avis :", error);
          alert("Une erreur est survenue.");
        }
      };
      

    const handleCloseModal = () => {
        setIsModalOpen(false);
        navigate("/dealscommercant");
    };

    const handleRatingChange = (index: number, score: number) => {
        const updated = [...ratings];
        updated[index].score = score;
        setRatings(updated);
    };

    const StarRating = ({ score, onRate }: { score: number; onRate: (s: number) => void }) => (
        <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => onRate(s)} className="focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${s <= score ? "text-[#FF6B2E]" : "text-gray-300"}`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-32 pt-5">
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-4 text-[#FF6B2E]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-3xl font-bold">Évaluation</h1>
                </div>
                <img src={sign} alt="Ekanwe Sign" className="w-6 h-6" onClick={() => navigate("/dealscommercant")} />
            </div>

            {/* FORM */}
            <div className="px-4 py-6">
                <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mr-4" />
                    <div>
                        <h2 className="text-xl font-semibold">
                            {user?.pseudonyme || user?.prenom || "Nom de l'influenceur"}
                        </h2>
                        <p className="text-gray-600">Prestation : {Array.isArray(deal?.typeOfContent) ? deal?.typeOfContent.join(", ") : deal?.typeOfContent}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {ratings.map((rating, index) => (
                        <div key={index} className="bg-white/10 p-4 rounded-lg border border-gray-200">
                            <p className="text-lg mb-2">{rating.category}</p>
                            <StarRating score={rating.score} onRate={(s) => handleRatingChange(index, s)} />
                        </div>
                    ))}
                </div>

                <div className="mt-6">
                    <label className="block text-lg mb-2">Commentaire</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Partagez votre expérience détaillée..."
                        className="w-full h-32 p-3 bg-white/10 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B2E]"
                    />
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-[#FF6B2E] text-white py-2 rounded-lg text-lg font-semibold hover:bg-[#FF6B2E]/90 transition-colors"
                    >
                        Soumettre l'évaluation
                    </button>
                </div>
            </div>

            <ThankYouModal isOpen={isModalOpen} onClose={handleCloseModal} />
        </div>
    );
}
