// PortfolioStep.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import logo from "../../assets/ekanwe-logo.png";

export default function PortfolioStep() {
  const navigate = useNavigate();
  const [portfolioLink, setPortfolioLink] = useState("");


  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Utilisateur non connecté");

    try {
      let fileURL = "";
      const finalLink = portfolioLink || fileURL;

      await updateDoc(doc(db, "users", user.uid), {
        portfolioLink: finalLink,
        inscription: "Terminé"
      });

      // await emailjs.send(
      //   "service_bglrz7g",
      //   "template_xfz4fr5",
      //   {
      //     userId: user.uid,
      //     nom: user.nom,
      //     prenom: user.prenom,
      //     tiktok: user.tiktok,
      //     instagram: user.instagram,
      //     email: user.email,
      //     pseudo: user.pseudonyme,
      //     portfolioLink: finalLink
      //   },
      //   "rdc0pMNplfzEZez_4"
      // );

      navigate("/registrationcomplete");
    } catch (error) {
      console.error("Erreur de soumission portfolio:", error);
      alert("Erreur pendant la soumission.");
    }
  };

  useEffect(() => {
    const fetchPortfolio = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPortfolioLink(data.portfolioLink || "");
      }
    };

    fetchPortfolio();
  }, []);


  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: "url('...')" }}>
      <div className="bg-[#1A2C24] bg-opacity-l70 text-white px-4 py-4 w-11/12 max-w-md rounded-lg shadow-lg">
        <div className="text-sm text-right">4/4</div>

        <div className="text-center flex flex-col items-center mb-6">
          <img src={logo} alt="Ekanwe logo" className="w-36 mb-6" />
          <p className="text-sm tracking-widest text-gray-300 mb-6">Inscription</p>
          <h2 className="text-3xl font-bold mb-8">Portfolio</h2>
          <p className="text-xs text-gray-300 mb-8 text-center">
            Pour valider ton profil de créateur de contenu, tu dois nous envoyer quelques exemples de tes réalisations.
          </p>
          <input
            type="text"
            placeholder="Ou colle un lien vers ton portfolio"
            value={portfolioLink}
            onChange={(e) => setPortfolioLink(e.target.value)}
            className="bg-transparent border border-white text-white px-4 py-2 rounded-md w-full"
          />
        </div>
        <div className="flex justify-between mt-6">
          <button className="border border-white text-white px-6 py-2 rounded-lg text-sm" onClick={() => navigate("/socialconnect")}>RETOUR</button>
          <button className="bg-[#FF6B2E] text-white px-6 py-2 rounded-lg text-sm font-semibold" onClick={handleSubmit}>SUIVANT</button>
        </div>
      </div>
    </div>
  );
}
