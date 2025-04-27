import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../assets/ekanwe-logo.png";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/connection');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#1A2C24] flex items-center justify-center">
      <img src={logo} alt="Ekanwe" className="w-32" />
    </div>
  );
}
