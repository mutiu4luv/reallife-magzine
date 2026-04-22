import { Route, Routes } from "react-router-dom";
import LandingPage from "../src/components/Landingpage";
import './App.css'
import Navbar from "./components/Navbar";
import AboutUsSection from "./screens/AboutUsScreen";
import ServiceScreen from "./screens/ServiceScreen";
import ContactUsScreen from "./screens/Contact";
import ProfileScreen from "./screens/ProfileScreen";
import BlogScreen from "./screens/blogScreen";

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
        <Route path="/profile" element={<ProfileScreen/>} />
        <Route path="/blog" element={<BlogScreen />} />

      {/* </Route> */}
    </Routes>
    </>
  );
}

export default App;
