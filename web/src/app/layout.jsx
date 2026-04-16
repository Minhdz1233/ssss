import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LoadingOverlay() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setLoading(false), 500);
      }, 600);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 10, 26, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.5s ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <img
          src="https://ucarecdn.com/d011648c-a703-4958-861a-80e6d816d869/"
          alt="Loading..."
          style={{
            width: "64px",
            height: "64px",
            objectFit: "contain",
          }}
        />
        <div
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.5)",
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Loading...
        </div>
      </div>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingOverlay />
      {children}
    </QueryClientProvider>
  );
}
