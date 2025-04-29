import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, collection } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { Instagram, Music } from "lucide-react";
import { getDocs } from "firebase/firestore";
import Navbar from "./Navbar";

export default function ProfilPublicCommercant() {
    const navigate = useNavigate();
    const { userId } = useParams();

    const [userData, setUserData] = useState<any>(null);
    const [dealsApplied, setDealsApplied] = useState<number>(0);

    useEffect(() => {
        const fetchProfile = async () => {
            console.log(userId);
            if (!userId) return;
            try {
                const userRef = doc(db, "users", userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }
                const dealsSnap = await getDocs(collection(db, "deals"));
                let count = 0;
                dealsSnap.forEach((dealDoc) => {
                    const dealData = dealDoc.data();
                    if (dealData.candidatures && Array.isArray(dealData.candidatures)) {
                        const found = dealData.candidatures.find(
                            (candidature: any) => candidature.influenceurId === userId
                        );
                        if (found) {
                            count++;
                        }
                    }
                });

                setDealsApplied(count);
            } catch (error) {
                console.error("Erreur de récupération du profil :", error);
            }
        };

        fetchProfile();
    }, [userId]);

    if (!userData) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#F5F5E7]">
                <p className="text-[#14210F]">Chargement...</p>
            </div>
        );
    }

    const portfolioLinks = userData.portfolioLinks || [];
    const instagramLink = userData.instagramLink || null;
    const tiktokLink = userData.tiktokLink || null;

    return (
        <div className="min-h-screen bg-[#F5F5E7]">
            {/* Header */}
            <div className="p-4 flex items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="text-[#FF6B00] flex items-center text-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Retour</span>
                </button>
            </div>

            {/* Body */}
            <div className="px-6 pt-4">
                <div className="flex flex-col items-center">
                    {/* Profile Picture */}
                    <div className="w-28 h-28 rounded-full bg-gray-200 mb-4 overflow-hidden">
                        <img
                            src={userData.photoURL || "https://via.placeholder.com/150"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Name */}
                    <h1 className="text-2xl font-semibold text-[#14210F] mb-2">
                        {userData.pseudonyme || "Nom inconnu"}
                    </h1>

                    {/* Bio */}
                    <p className="text-center text-gray-600 text-base mb-4">
                        {userData.bio || "Aucune bio disponible."}
                    </p>

                    {/* Stats */}
                    <div className="text-center">
                        <p className="font-bold text-[#14210F] text-xl">{dealsApplied}</p>
                        <p className="text-base text-gray-600">Deals</p>
                    </div>

                    {/* Rating */}
                    <div className="flex space-x-2 mb-6">
                        {[...Array(5)].map((_, index) => (
                            <div
                                key={index}
                                className={`text-3xl ${index < (userData.rating || 3) ? 'text-[#FF6B00]' : 'text-gray-300'
                                    }`}
                            >
                                ★
                            </div>
                        ))}
                    </div>
                </div>

                {/* Portfolio Links */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg text-gray-600 font-semibold">Portfolio</h2>
                        <button className="text-gray-600 text-lg" disabled>Réseaux</button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {portfolioLinks.length > 0 ? (
                            portfolioLinks.map((link: string, idx: number) => (
                                <a
                                    key={idx}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block bg-white p-3 rounded-lg border text-[#14210F] text-sm shadow"
                                >
                                    Voir Portfolio {idx + 1}
                                </a>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">Aucun lien de portfolio</p>
                        )}
                    </div>
                </div>

                {/* Réseaux sociaux */}
                <div className="flex flex-col space-y-3">
                    {instagramLink && (
                        <a
                            href={instagramLink.startsWith("http") ? instagramLink : `https://instagram.com/${instagramLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[#FF6B00] underline text-sm"
                        >
                            <Instagram className="h-5 w-5" />
                            Instagram : {instagramLink}
                        </a>
                    )}
                    {tiktokLink && (
                        <a
                            href={tiktokLink.startsWith("http") ? tiktokLink : `https://tiktok.com/@${tiktokLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[#FF6B00] underline text-sm"
                        >
                            <Music className="h-5 w-5" />
                            TikTok : {tiktokLink}
                        </a>
                    )}
                    {!instagramLink && !tiktokLink && (
                        <p className="text-gray-500 text-sm">Aucun réseau social renseigné.</p>
                    )}
                </div>

            </div>
            <Navbar />
        </div>
    );
}
