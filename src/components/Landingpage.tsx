import Hero from "./Hero"
import Reallife from "./Reallife"
import MarqueeBar from "./MarqueeBar"
import BenefitSection from "./BenefitSEction"
import Testimoney from "./Testimoney"
import PhotoGallery from "./PhotoGallery"
import AboutSection from "./AboutSection"
import InterviewSection from "./InterviewSection"
import Footer from "./Footer"
const Landingpage = () => {
  return (
    <div>
      <MarqueeBar />
      <Hero />
      <Reallife /> 
      <BenefitSection /> 
      <Testimoney />
      <PhotoGallery />
      <AboutSection />
      <InterviewSection />
      <Footer />
    </div>
  )
}

export default Landingpage
