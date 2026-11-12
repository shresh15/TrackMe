import { ReactTyped } from "react-typed";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <>
      <section
        id="home"
        className="relative z-10 flex min-h-[calc(100svh-73px)] scroll-mt-20 flex-col items-center justify-center overflow-hidden px-5 py-24 text-center sm:px-8"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/20 via-black/45 to-black/85" />
        {/* <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-400/25 bg-black/40 px-4 py-2 text-sm text-green-200 shadow-lg shadow-green-950/30 backdrop-blur"></div> */}
        <h1 className="text-6xl font-black tracking-tight text-white sm:text-7xl md:text-8xl lg:text-9xl">
          Track<span className="text-green-400">Me</span>
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-relaxed text-gray-200 sm:text-2xl md:text-3xl">
          Make every next step count.
          <br />
          <span className="font-semibold text-green-300">
            <ReactTyped
              strings={[
                "Organize your job applications",
                "Stay ready for upcoming exams",
                "Never miss a scheduled interview",
              ]}
              typeSpeed={45}
              backSpeed={25}
              backDelay={1400}
              loop
            />
          </span>
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            to="/login"
            className="rounded-full bg-green-400 px-8 py-3.5 font-bold text-black shadow-lg shadow-green-950/40 transition hover:-translate-y-0.5 hover:bg-green-300"
          >
            Get started
          </Link>
          <a
            href="#about"
            className="rounded-full border border-white/20 bg-white/5 px-8 py-3.5 font-semibold text-white backdrop-blur transition hover:border-green-300/60 hover:bg-white/10"
          >
            Discover TrackMe
          </a>
        </div>
      </section>

      <section
        id="about"
        className="relative z-10 scroll-mt-20 border-y border-white/10 bg-black/75 px-5 py-20 backdrop-blur-sm sm:px-8 md:py-28"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-green-400/10 blur-2xl" />
            <img
              src="/notification.jpg"
              alt="Notifications displayed around a laptop"
              className="relative h-72 w-full rounded-2xl border border-white/10 object-cover shadow-2xl sm:h-96"
            />
          </div>
          <div className="text-center text-white md:text-left">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-green-400">
              About TrackMe
            </p>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Stay focused on what comes next.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-gray-300">
              Keep your job applications, upcoming exams, and scheduled
              interviews organized in one place. Track your commitments, stay
              prepared, and spend less time trying to remember what is next.
            </p>
            <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
              {["Applications", "Exams", "Interviews"].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-200"
                >
                  <span className="mr-2 text-green-400">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
