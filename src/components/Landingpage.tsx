import Hero from "./Hero"
import Reallife from "./Reallife"
import MarqueeBar from "./MarqueeBar"
import BenefitSection from "./BenefitSEction"
import Testimoney from "./Testimoney"
import PhotoGallery from "./PhotoGallery"
import AboutSection from "./AboutSection"
import InterviewSection from "./InterviewSection"
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
    </div>
  )
}

export default Landingpage
