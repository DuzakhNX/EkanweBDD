import logo from "../../assets/ekanwe-logo.png";
import tiktok from "../../assets/tiktoklogo.png";
import instagram from "../../assets/instagramlogo.png";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";

export default function SocialConnectStep() {
  const navigate = useNavigate();

  useEffect(() => {
      const fetchUserData = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
          const userRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData((prev) => ({
              ...prev,
              tiktok: data.tiktok || "",
              instagram: data.instagram || ""
          }));
          }
        } catch (error) {
          console.error("Erreur lors du chargement des données:", error);
        }
      };
      fetchUserData();
    }, []);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Utilisateur non connecté.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        tiktok: formData.tiktok,
        instagram: formData.instagram,
        inscription: "4"
      });
      navigate("/portfoliostep");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      alert("Une erreur est survenue.");
    }
  };
    const [formData, setFormData] = useState({
      instagram: "",
      tiktok: ""
    });
    const handleChange = (e : React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    return (
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage:
            "url('https://s3-alpha-sig.figma.com/img/766b/e8b9/25ea265fc6d5c0f04e3e93b27ecd65cb?...')",
        }}
      >
        <div className="bg-[#1A2C24] bg-opacity-l70 text-white px-4 py-4 w-11/12 max-w-md rounded-lg shadow-lg">
          <div className="text-sm text-right">3/4</div>

          <div className="text-center flex flex-col items-center mb-6">
            <img src={logo} alt="Ekanwe logo" className="w-36 mb-6" />
            <p className="text-sm tracking-widest text-gray-300 mb-6">Inscription</p>
            <h2 className="text-3xl font-bold mb-8">Connexion réseaux</h2>
          </div>

          <div className="flex flex-col gap-6 mb-6">
            <div className="flex items-center gap-4 bg-white rounded-xl p-4">
              <img src={instagram} alt="Instagram" className="w-10 h-10" />
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="Lien ou pseudo Instagram"
                className="w-full px-2 py-1 text-black text-sm bg-transparent border-b border-gray-300 placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4 bg-white rounded-xl p-4">
              <img src={tiktok} alt="TikTok" className="w-10 h-10" />
              <input
                type="text"
                name="tiktok"
                value={formData.tiktok}
                onChange={handleChange}
                placeholder="Lien ou pseudo TikTok"
                className="w-full px-2 py-1 text-black text-sm bg-transparent border-b border-gray-300 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              className="border border-white text-white px-6 py-2 rounded-lg text-sm"
              onClick={() => navigate("/intereststep")}
            >
              RETOUR
            </button>
            <button
              className="bg-[#FF6B2E] text-white px-6 py-2 rounded-lg text-sm font-semibold"
              onClick={handleSubmit}
            >
              SUIVANT
            </button>
          </div>
        </div>
      </div>
    );
}
