import { useLocation, useNavigate } from "react-router-dom";
import home from "../../assets/home.png";
import startistique from "../../assets/startistique.png";
import dashboard from "../../assets/dashboard.png";
import profile from "../../assets/profile.png";
import chat from "../../assets/chat.png"

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 px-4 py-2 bg-gray-500 shadow-inner flex justify-between items-center">
      <button onClick={() => navigate("/dealinfluenceur")}>
        <img
          src={home}
          alt="Home"
          className={`w-12 h-12 ${pathname === "/dealinfluenceur" ? "filter-[#FF6B2E]" : ""}`}
        />
      </button>
      <button onClick={() => navigate("/dealinfluenceur")}>
        <img
          src={startistique}
          alt="Stats"
          className={`w-6 h-6 ${pathname === "/dealCandidates" ? "filter-[#FF6B2E]" : ""}`}
        />
      </button>
      <button onClick={() => navigate("/dashboardpage")}>
        <img
          src={dashboard}
          alt="dashboard"
          className={`w-6 h-6 ${pathname === "/dashboardpage" ? "filter-[#FF6B2E]" : ""}`}
        />
      </button>
      <button onClick={() => navigate("/dashboardpage")}>
        <img
          src={chat}
          alt="dashboard"
          className={`w-6 h-6 ${pathname === "/dashboardpage" ? "filter-[#FF6B2E]" : ""}`}
        />
      </button>
      <button onClick={() => navigate("/profilinfluenceur")}>
        <img
          src={profile}
          alt="Profile"
          className={`w-6 h-6 ${pathname === "/profilinfluenceur" ? "filter-[#FF6B2E]" : ""}`}
        />
      </button>
    </nav>
  );
}
