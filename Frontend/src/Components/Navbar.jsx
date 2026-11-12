import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-4 sm:gap-4 sm:px-8">
        <a
          href="#home"
          className="text-xl font-bold tracking-tight sm:text-2xl"
          aria-label="TrackMe home"
        >
          Track<span className="text-green-400">Me</span>
        </a>

        <nav
          aria-label="Main navigation"
          className="flex items-center gap-2 text-xs sm:gap-8 sm:text-base"
        >
          <a
            href="#home"
            className="text-gray-300 transition hover:text-green-300"
          >
            Home
          </a>
          <a
            href="#about"
            className="text-gray-300 transition hover:text-green-300"
          >
            About
          </a>
          <a
            href="#footer"
            className="text-gray-300 transition hover:text-green-300"
          >
            Footer
          </a>
          <Link
            to="/login"
            className="rounded-full border border-green-400/50 bg-green-400/10 px-4 py-2 font-semibold text-green-300 transition hover:border-green-300 hover:bg-green-400 hover:text-black sm:px-5"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
