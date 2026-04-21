import Hero from "./Hero"
import Reallife from "./Reallife"
import MarqueeBar from "./MarqueeBar"
import BenefitSection from "./BenefitSEction"
import Testimoney from "./Testimoney"
import PhotoGallery from "./PhotoGallery"
const Landingpage = () => {
  return (
    <div>
      <MarqueeBar />
      <Hero />
      <Reallife /> 
      <BenefitSection /> 
      <Testimoney />
      <PhotoGallery />
    </div>
  )
}

export default Landingpage
