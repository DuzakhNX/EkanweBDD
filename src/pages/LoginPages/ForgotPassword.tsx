import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/ekanwe-logo.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendResetEmail = () => {
    setLoading(true);
    // Simuler un délai d'envoi
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleVerifyCode = () => {
    setLoading(true);
    // Simuler une vérification
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1000);
  };

  const handleResetPassword = () => {
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    // Simuler une réinitialisation
    setTimeout(() => {
      setLoading(false);
      navigate("/login");
    }, 1000);
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

        {step === 1 && (
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
        )}

        {step === 2 && (
          <div className="flex flex-col gap-8">
            <input
              type="text"
              placeholder="Code de vérification"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm"
            />
            <div className="flex justify-between mt-6">
              <button
                className="bg-transparent border border-white text-white px-6 py-2 rounded-lg text-sm"
                onClick={() => setStep(1)}
              >
                RETOUR
              </button>
              <button
                className="bg-[#FF6B2E] text-white px-6 py-2 rounded-lg text-sm font-semibold"
                onClick={handleVerifyCode}
                disabled={loading}
              >
                {loading ? "Vérification..." : "VÉRIFIER"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-8">
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm"
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm"
            />
            <div className="flex justify-between mt-6">
              <button
                className="bg-transparent border border-white text-white px-6 py-2 rounded-lg text-sm"
                onClick={() => setStep(2)}
              >
                RETOUR
              </button>
              <button
                className="bg-[#FF6B2E] text-white px-6 py-2 rounded-lg text-sm font-semibold"
                onClick={handleResetPassword}
                disabled={loading}
              >
                {loading ? "Réinitialisation..." : "RÉINITIALISER"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 