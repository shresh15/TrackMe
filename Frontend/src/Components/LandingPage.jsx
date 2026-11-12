import Navbar from "./Navbar";
import DigitalRain from "./DigitalRain";

function LandingPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <DigitalRain style={{ width: "100%", height: "100%" }} />
      </div>
      <div className="relative z-10">
        <Navbar />
      </div>
    </main>
  );
}

export default LandingPage;
