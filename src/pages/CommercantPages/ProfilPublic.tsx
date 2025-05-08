import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../../firebase/firebase";
import { doc, getDoc, collection, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { Instagram, Music } from "lucide-react";
import Navbar from "./Navbar";
import profile from "../../assets/profile.png";
import sign from "../../assets/ekanwesign.png";

export default function ProfilPublicInfluenceur() {
    const navigate = useNavigate();
    const { userId } = useParams();

    const [userData, setUserData] = useState<any>(null);
    const [dealsApplied, setDealsApplied] = useState<number>(0);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loadingContact, setLoadingContact] = useState(false);
    const [completedDealsData, setCompletedDealsData] = useState<
        { title: string; likes: number; shares: number }[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [averageRatings, setAverageRatings] = useState<Record<string, number>>({});

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
        const fetchProfile = async () => {
            if (!userId) return;
            try {
                const authUser = auth.currentUser;
                if (!authUser) return;
                const currentSnap = await getDoc(doc(db, "users", authUser.uid));
                if (currentSnap.exists()) {
                    setCurrentUser({ uid: authUser.uid, ...currentSnap.data() });
                }
                const userRef = doc(db, "users", userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }
                const deals = await getAllDeals();
                const averages = calculateAverageRatings(deals);
                setAverageRatings(averages);

                const dealsSnap = await getDocs(collection(db, "deals"));
                let dealsAppliedCount = 0;
                let dealsTermines = 0;
                let totalLikes = 0;
                let totalShares = 0;
                const completedDeals: { title: string; likes: number; shares: number }[] = [];

                dealsSnap.forEach((dealDoc) => {
                    const dealData = dealDoc.data();
                    const candidatures = dealData.candidatures || [];

                    candidatures.forEach((c: any) => {
                        if (c.influenceurId === userId && c.status === "Terminé") {
                            dealsAppliedCount++;
                            dealsTermines++;

                            let likes = 0;
                            let shares = 0;
                            if (Array.isArray(c.proofs)) {
                                c.proofs.forEach((proof: any) => {
                                    likes += proof.likes || 0;
                                    shares += proof.shares || 0;
                                });
                            }

                            totalLikes += likes;
                            totalShares += shares;

                            completedDeals.push({
                                title: dealData.title,
                                likes,
                                shares,
                            });
                        }
                    });
                });

                setDealsApplied(dealsAppliedCount);
                setCompletedDealsData(completedDeals);
            } catch (error) {
                console.error("Erreur de récupération du profil :", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId]);



    const handleContact = async () => {
        if (!currentUser || !userId || currentUser.uid === userId) return;
        setLoadingContact(true);
        try {
            const chatId = [currentUser.uid, userId].sort().join("_");
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {
                const welcomeMessage = {
                    senderId: currentUser.uid,
                    text: `Bonjour, je suis intéressé par votre profil. Discutons ensemble.`,
                    createdAt: new Date(),
                };

                await setDoc(chatRef, {
                    messages: [welcomeMessage],
                });
            }

            const userChatsRefMerchant = doc(db, "userchats", currentUser.uid);
            const merchantSnap = await getDoc(userChatsRefMerchant);
            const newMerchantChat = {
                chatId,
                receiverId: userId,
                lastMessage: `Bonjour, je suis intéressé par votre profil.`,
                updatedAt: Date.now(),
                read: true,
            };
            if (merchantSnap.exists()) {
                const data = merchantSnap.data();
                const updated = data.chats || [];
                if (!updated.find((c: any) => c.chatId === chatId)) {
                    updated.push(newMerchantChat);
                    await updateDoc(userChatsRefMerchant, { chats: updated });
                }
            } else {
                await setDoc(userChatsRefMerchant, { chats: [newMerchantChat] });
            }

            const userChatsRefInfluenceur = doc(db, "userchats", userId);
            const inflSnap = await getDoc(userChatsRefInfluenceur);
            const newInflChat = {
                chatId,
                receiverId: currentUser.uid,
                lastMessage: `Bonjour, je suis intéressé par votre profil.`,
                updatedAt: Date.now(),
                read: false,
            };
            if (inflSnap.exists()) {
                const data = inflSnap.data();
                const updated = data.chats || [];
                if (!updated.find((c: any) => c.chatId === chatId)) {
                    updated.push(newInflChat);
                    await updateDoc(userChatsRefInfluenceur, { chats: updated });
                }
            } else {
                await setDoc(userChatsRefInfluenceur, { chats: [newInflChat] });
            }

            navigate(`/chat/${chatId}`, {
                state: {
                    pseudonyme: userData.pseudonyme,
                    photoURL: userData.photoURL,
                    receiverId: userId,
                    role: userData.role,
                },
            });
        } catch (err) {
            console.error("Erreur de contact :", err);
        } finally {
            setLoadingContact(false);
        }
    };

    if (!userData) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#F5F5E7]">
                <p className="text-[#14210F]">Chargement...</p>
            </div>
        );
    }

    const { instagram, tiktok, portfolioLink } = userData;

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
        <div className="min-h-screen bg-[#F5F5E7] pb-32">
            <div className="p-4 flex items-center">
                <button onClick={() => navigate(-1)} className="text-orange-500 flex items-center text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Retour</span>
                </button>
            </div>

            <div className="px-6 pt-4">
                <div className="flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full bg-gray-200 mb-4 overflow-hidden">
                        <img src={userData.photoURL || profile} alt="Profile" className="w-full h-full object-cover" />
                    </div>

                    <h1 className="text-2xl font-semibold text-[#14210F] mb-1">
                        {userData.pseudonyme || `${userData.prenom} ${userData.nom}`}
                    </h1>

                    <p className="text-center text-gray-600 text-base mb-2">{userData.bio || "Aucune bio disponible."}</p>

                    <div className="flex space-x-2 mb-2">
                        {[...Array(5)].map((_, index) => (
                            <span key={index} className={`text-lg ${index < averageRatings[userId!] ? 'text-[#FF6B2E]' : 'text-gray-300'}`}>★</span>
                        ))}
                    </div>

                    <p className="font-bold text-[#14210F] text-xl mb-4">{dealsApplied} deals réalisés</p>

                    {currentUser?.role === "commerçant" && currentUser.uid !== userId && (
                        <button
                            onClick={handleContact}
                            disabled={loadingContact}
                            className={`mb-6 px-6 py-2 rounded-lg font-medium ${loadingContact
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-orange-500 text-white"
                                }`}
                        >
                            {loadingContact ? "Contact..." : "Contacter"}
                        </button>
                    )}
                </div>

                <div className="mb-6 bg-white/10 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold text-[#1A2C24] mb-3">Informations personnelles</h2>
                    <ul className="space-y-1 text-sm text-[#1A2C24]">
                        <li><strong>Nom :</strong> {userData.nom}</li>
                        <li><strong>Prénom :</strong> {userData.prenom}</li>
                        <li><strong>Email :</strong> {userData.email}</li>
                        <li><strong>Téléphone :</strong> {userData.phone}</li>
                        <li><strong>Date de naissance :</strong> {userData.dateNaissance}</li>
                        {userData.interets?.length > 0 && (
                            <li><strong>Centres d'intérêt :</strong> {userData.interets.join(", ")}</li>
                        )}
                    </ul>
                </div>

                <div className="mb-6">
                    {completedDealsData.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-bold text-[#14210F] mb-2">Deals terminés :</h3>
                            <ul className="space-y-2">
                                {completedDealsData.map((deal, index) => (
                                    <li key={index} className="bg-white p-3 rounded-xl shadow">
                                        <p className="font-semibold text-[#14210F]">{deal.title}</p>
                                        <p className="text-sm text-gray-600">{deal.likes} likes · {deal.shares} nombre de vues</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-[#1A2C24] mb-2">Portfolio</h2>
                    {portfolioLink && portfolioLink !== "Nothing" ? (
                        <a
                            href={portfolioLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white p-3 rounded-lg border text-[#14210F] text-sm shadow"
                        >
                            Voir le Portfolio
                        </a>
                    ) : (
                        <p className="text-gray-500 text-sm">Aucun lien de portfolio</p>
                    )}
                </div>

                <div className="mb-20 space-y-3">
                    {instagram && (
                        <a
                            href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-orange-500 underline text-sm"
                        >
                            <Instagram className="h-5 w-5" />
                            Instagram : {instagram}
                        </a>
                    )}
                    {tiktok && (
                        <a
                            href={tiktok.startsWith("http") ? tiktok : `https://tiktok.com/@${tiktok}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-orange-500 underline text-sm"
                        >
                            <Music className="h-5 w-5" />
                            TikTok : {tiktok}
                        </a>
                    )}
                    {!instagram && !tiktok && (
                        <p className="text-gray-500 text-sm">Aucun réseau social renseigné.</p>
                    )}
                </div>
            </div>
            <Navbar />
        </div>
    );
}
