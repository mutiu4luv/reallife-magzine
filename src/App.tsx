import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LandingPage from "../src/components/Landingpage";
import './App.css'
import Navbar from "./components/Navbar";
import AboutUsSection from "./screens/AboutUsScreen";
import ServiceScreen from "./screens/ServiceScreen";
import ContactUsScreen from "./screens/Contact";
import ProfileScreen from "./screens/ProfileScreen";
import BlogScreen from "./screens/blogScreen";
import AdminScreen from "./screens/AdminScreen";
import AuthScreen from "./screens/AuthScreen";
import UserDashboardScreen from "./screens/UserDashboardScreen";
// import UpcomingEventNotice from "./components/UpcomingEventNotice";
import NewsScreen from "./screens/NewsScreen";
import UpcomingEventsScreen from "./screens/UpcomingEventsScreen";
import ContentDetailScreen from "./screens/ContentDetailScreen";
import KingSunnyAdeCompendiumScreen from "./screens/KingSunnyAdeCompendiumScreen";
import MagazineScreen from "./screens/MagazineScreen";
import { useAuth } from "./context/useAuth";
import { hasAnyPermission } from "./services/authApi";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

const ProtectedAdminRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin" && !hasAnyPermission(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminScreen />;
};

function App() {

  return (
    <>
      <ScrollToTop />
      <Navbar />
      {/* <UpcomingEventNotice /> */}
      {/* <LandingPage /> */}

      <Routes>
      {/* <Route element={<MainLayout />}> */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutUsSection />} />
        <Route path="/services" element={<ServiceScreen />} />
        <Route path="/contact" element={<ContactUsScreen />} />
        <Route path="/profile" element={<ProfileScreen/>} />
        <Route path="/blog" element={<BlogScreen />} />
        <Route path="/blog/:id" element={<ContentDetailScreen kind="post" />} />
        <Route path="/news" element={<NewsScreen />} />
        <Route path="/news/:id" element={<ContentDetailScreen kind="news" />} />
        <Route path="/events" element={<UpcomingEventsScreen />} />
        <Route path="/events/:id" element={<ContentDetailScreen kind="event" />} />
        <Route path="/magazine" element={<MagazineScreen />} />
        <Route path="/king--Sunny-Ade-@80" element={<KingSunnyAdeCompendiumScreen />} />
        <Route path="/login" element={<AuthScreen mode="login" />} />
        <Route path="/register" element={<AuthScreen mode="register" />} />
        <Route path="/dashboard" element={<UserDashboardScreen />} />
        <Route path="/admin" element={<ProtectedAdminRoute />} />

      {/* </Route> */}
    </Routes>
    </>
  );
}

export default App;
