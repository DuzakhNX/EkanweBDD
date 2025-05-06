import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/ekanwe-logo.png";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/firebase";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendResetEmail = async () => {
    setLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Un lien de réinitialisation a été envoyé à votre adresse email.");
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        alert("Aucun compte n'est associé à cet email.");
      } else if (err.code === "auth/invalid-email") {
        alert("L'email fourni n'est pas valide.");
      } else {
        alert("Une erreur s'est produite. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
    >
      <div className="bg-[#1A2C24] bg-opacity-l70 text-white px-4 py-4 w-11/12 max-w-md rounded-lg shadow-lg">
        <div className="text-center flex flex-col items-center mb-6">
          <img src={logo} alt="Ekanwe logo" className="w-36 mb-6" />
          <p className="text-sm tracking-widest text-gray-300 mb-6">Récupération</p>
          <h2 className="text-3xl font-bold">Mot de passe oublié</h2>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
        )}

          <div className="flex flex-col gap-8">
            <input
              type="email"
              placeholder="Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm"
            />
            <div className="flex justify-between mt-6">
              <button
                className="bg-transparent border border-white text-white px-6 py-2 rounded-lg text-sm"
                onClick={() => navigate("/login")}
              >
                RETOUR
              </button>
              <button
                className="bg-[#FF6B2E] text-white px-6 py-2 rounded-lg text-sm font-semibold"
                onClick={handleSendResetEmail}
                disabled={loading}
              >
                {loading ? "Envoi..." : "ENVOYER"}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
} 