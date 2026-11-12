import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer
      id="footer"
      className="relative z-10 border-t border-white/10 bg-black/90 px-5 py-8 text-gray-400 backdrop-blur-xl sm:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <Link to="/" className="text-lg font-bold text-white">
          Track<span className="text-green-400">Me</span>
        </Link>
        <p className="text-sm">
          Stay organized. Keep moving forward.
        </p>
        <p className="text-sm">
          © {new Date().getFullYear()} TrackMe
        </p>
      </div>
    </footer>
  );
}

export default Footer;