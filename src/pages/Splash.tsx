import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../assets/ekanwe-logo.png";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const role = userSnap.data().role;
          const inscription = userSnap.data().inscription;

          if (inscription === "1") navigate("/registrationstepone");
          else if (inscription === "2") navigate("/intereststep");
          else if (inscription === "3") navigate("/socialconnectstep");
          else if (inscription === "4") navigate("/portfoliostep");
          else if (inscription === "Terminé") {
            if (role === "commerçant") navigate("/dealscommercant");
            else if (role === "influenceur") navigate("/dealsinfluenceur");
          }
        }
      } else {
        navigate("/connection");
      }
    });

    const timer = setTimeout(() => {
      unsubscribe();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#1A2C24] flex items-center justify-center">
      <img src={logo} alt="Ekanwe" className="w-32" />
    </div>
  );
}
