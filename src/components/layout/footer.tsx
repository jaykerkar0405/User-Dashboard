import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-center px-6 md:px-16 xl:px-8">
        <span className="text-sm">
          &copy; {new Date().getFullYear()}{" "}
          <Link
            href="/"
            className="transition-colors underline-offset-10 hover:underline focus:underline font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded-sm duration-200"
          >
            User Dashboard
          </Link>
          . All rights reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
