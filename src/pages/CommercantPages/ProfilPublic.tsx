import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../../firebase/firebase";
import { doc, getDoc, collection, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { Instagram, Music } from "lucide-react";
import Navbar from "./Navbar";
import profile from "../../assets/profile.png"

export default function ProfilPublicInfluenceur() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [userData, setUserData] = useState<any>(null);
  const [dealsApplied, setDealsApplied] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const authUser = auth.currentUser;
      if (!authUser) return;
      const currentSnap = await getDoc(doc(db, "users", authUser.uid));
      if (currentSnap.exists()) setCurrentUser({ uid: authUser.uid, ...currentSnap.data() });
    };

    init();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
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
              (c: any) => c.influenceurId === userId
            );
            if (found) count++;
          }
        });

        setDealsApplied(count);
      } catch (error) {
        console.error("Erreur de récupération du profil :", error);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleContact = async () => {
    if (!currentUser || !userId || currentUser.uid === userId) return;

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
        },
      });
    } catch (err) {
      console.error("Erreur de contact :", err);
    }
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F5F5E7]">
        <p className="text-[#14210F]">Chargement...</p>
      </div>
    );
  }

  const instagram = userData.instagram;
  const tiktok = userData.tiktok;
  const portfolioLink = userData.portfolioLink;

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
              <span key={index} className={`text-2xl ${index < (userData.rating || 3) ? 'text-orange-500' : 'text-gray-300'}`}>★</span>
            ))}
          </div>

          <p className="font-bold text-[#14210F] text-xl mb-4">{dealsApplied} deals réalisés</p>

          {currentUser?.role === "commercant" && currentUser.uid !== userId && (
            <button
              onClick={handleContact}
              className="mb-6 bg-orange-500 text-white px-6 py-2 rounded-lg font-medium"
            >
              Contacter
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
