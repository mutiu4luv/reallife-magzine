import { Route, Routes } from "react-router-dom";
import LandingPage from "../src/components/Landingpage";
import './App.css'
import Navbar from "./components/Navbar";
import AboutUsSection from "./screens/AboutUsScreen";
import ServiceScreen from "./screens/ServiceScreen";
import ContactUsScreen from "./screens/Contact";
import ProfileScreen from "./screens/ProfileScreen";
import BlogScreen from "./screens/blogScreen";
import AdminScreen from "./screens/AdminScreen";
import UpcomingEventNotice from "./components/UpcomingEventNotice";
import NewsScreen from "./screens/NewsScreen";
import UpcomingEventsScreen from "./screens/UpcomingEventsScreen";
import ContentDetailScreen from "./screens/ContentDetailScreen";

function App() {

  return (
    <>
      <Navbar />
      <UpcomingEventNotice />
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
        <Route path="/admin" element={<AdminScreen />} />

      {/* </Route> */}
    </Routes>
    </>
  );
}

export default App;
