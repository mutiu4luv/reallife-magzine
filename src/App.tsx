import { Route, Routes } from "react-router-dom";
import LandingPage from "../src/components/Landingpage";
import './App.css'
import Navbar from "./components/Navbar";
import AboutUsSection from "./screens/AboutUsScreen";
import ServiceScreen from "./screens/ServiceScreen";
import ContactUsScreen from "./screens/Contact";

function App() {

  return (
    <>
      <Navbar />
      {/* <LandingPage /> */}

      <Routes>
      {/* <Route element={<MainLayout />}> */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutUsSection />} />
        <Route path="/services" element={<ServiceScreen />} />
        <Route path="/contact" element={<ContactUsScreen />} />
        {/* 
        <Route path="/profile" element={<Profile />} />
        <Route path="/magzine" element={<Magazine />} /> */}
      {/* </Route> */}
    </Routes>
    </>
  );
}

export default App;
