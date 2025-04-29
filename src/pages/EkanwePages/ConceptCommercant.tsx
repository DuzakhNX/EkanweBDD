import { useNavigate } from "react-router-dom";
import logo from "../../assets/ekanwe-logo.png";
import femcharacter from "../../assets/feminine_caracter.png";

export default function Concept() {
    const navigate = useNavigate();
    return (
    <div className="min-h-screen  bg-[#1A2C24] flex flex-col justify-end items-center relative overflow-hidden">
        <img
        src={femcharacter}
        alt="Character"
        className="w-40 absolute"
        style={{
            bottom: "280px",
            right: " 30px",
            zIndex: 0,
        }}
        />

        <div className="w-[95%] bg-[#1A2C24] rounded-2xl border-2 border-[#aec9b6] p-8 pb- text-white z-10 mb-8 relative">
            <h1 className="text-2xl font-bold mb-9">Concept</h1>
            <ul className="text-sm mb-11 list-disc list-inside space-y-2">
                <li>Pas d'argent</li>
                <li>Pas de barrière</li>
                <li>Juste des collaborations gagnant-gagnant</li>
            </ul>
            <div className="flex space-x-2 mb-6">
                <span className="flex-1 h-1 bg-gray-500 rounded-full"></span>
                <span className="flex-1 h-1 bg-gray-500 rounded-full"></span>
                <span className="flex-1 h-1 bg-white  rounded-full"></span>
            </div>

    <div className="flex items-center justify-between">
        <img src={logo} alt="Ekanwe" className="w-24" />
        <button
            onClick={() => navigate('/loginorsignup')}
            className="w-10 h-10 flex items-center justify-center bg-ekanwe-orange rounded-full text-white"
        >
            →
        </button>
    </div>
        </div>
    </div>
  )
}
