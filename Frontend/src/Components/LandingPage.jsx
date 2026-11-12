import Navbar from "./Navbar";
import DigitalRain from "./DigitalRain";
import Hero from "./Hero";
import Footer from "./Footer";

function LandingPage() {
  return (
    <main className="relative isolate min-h-screen scroll-smooth overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <DigitalRain style={{ width: "100%", height: "100%" }} />
      </div>
      <Navbar />
      <Hero />
      <Footer />
    </main>
  );
}

export default LandingPage;
