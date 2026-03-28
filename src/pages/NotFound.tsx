import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background grid-bg scanline">
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-1 text-lg font-mono text-muted-foreground">
          Zel<span className="text-primary">·</span>strom — Route not found
        </p>
        <p className="mb-6 text-sm text-muted-foreground">The requested path does not exist.</p>
        <a href="/" className="text-primary underline hover:text-primary/90 font-mono text-sm">
          Return to Zelstrom
        </a>
      </div>
    </div>
  );
};

export default NotFound;
