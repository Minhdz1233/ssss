import { useState, useEffect, useRef } from "react";

const ANIME_IMAGE =
  "https://i.pinimg.com/736x/f2/d6/51/f2d651321a205396beb55ff6b4b6c1b9.jpg";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function FloatingParticle({ delay, duration, left, size }) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${left}%`,
        bottom: "-10px",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(139,92,246,0.8) 0%, transparent 70%)",
        animation: `floatUp ${duration}s ease-in-out ${delay}s infinite`,
        pointerEvents: "none",
      }}
    />
  );
}

function GlowOrb({ top, left, color, size, delay, isMobile }) {
  const actualSize = isMobile ? size * 0.5 : size;
  const blurAmount = isMobile ? size * 0.3 : size * 0.6;
  return (
    <div
      style={{
        position: "absolute",
        top: `${top}%`,
        left: `${left}%`,
        width: `${actualSize}px`,
        height: `${actualSize}px`,
        borderRadius: "50%",
        background: color,
        filter: `blur(${blurAmount}px)`,
        opacity: isMobile ? 0.25 : 0.4,
        animation: `pulseOrb 4s ease-in-out ${delay}s infinite alternate`,
        pointerEvents: "none",
      }}
    />
  );
}

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleExploreClick = () => {
    const audio = new Audio(
      "https://www.myinstants.com/media/sounds/ohayou.mp3",
    );
    audio.volume = 0.7;
    audio.play().catch(() => {});
    setTimeout(() => {
      window.location.href = "/tools";
    }, 800);
  };

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 6 + Math.random() * 6,
    left: Math.random() * 100,
    size: 2 + Math.random() * 4,
  }));

  const orbs = [
    { top: 20, left: 10, color: "#7c3aed", size: 300, delay: 0 },
    { top: 60, left: 80, color: "#ec4899", size: 250, delay: 1.5 },
    { top: 40, left: 50, color: "#06b6d4", size: 200, delay: 3 },
    { top: 80, left: 20, color: "#8b5cf6", size: 280, delay: 0.8 },
    { top: 10, left: 70, color: "#a855f7", size: 220, delay: 2 },
  ];

  const visibleOrbs = isMobile ? orbs.slice(0, 3) : orbs;
  const visibleParticles = isMobile ? particles.slice(0, 5) : particles;

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 30%, #1a0a2e 60%, #0a0a1a 100%)",
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {visibleOrbs.map((orb, i) => (
        <GlowOrb key={i} {...orb} isMobile={isMobile} />
      ))}

      {visibleParticles.map((p) => (
        <FloatingParticle key={p.id} {...p} />
      ))}

      {!isMobile && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: isMobile ? "16px 16px" : "40px 20px",
        }}
      >
        <nav
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: isMobile ? "14px 20px" : "20px 40px",
            zIndex: 10,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            background: "rgba(10,10,26,0.6)",
            borderBottom: "1px solid rgba(139,92,246,0.1)",
          }}
        >
          <div
            style={{
              fontSize: isMobile ? "18px" : "24px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #a855f7, #ec4899, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}
          >
            ✦ BLICKDACK
          </div>

          {!isMobile && (
            <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
              {["Home", "Gallery", "About", "Contact"].map((item) => (
                <a
                  key={item}
                  href="#"
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    letterSpacing: "0.5px",
                    transition: "color 0.3s, text-shadow 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = "#a855f7";
                    e.target.style.textShadow = "0 0 20px rgba(168,85,247,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = "rgba(255,255,255,0.6)";
                    e.target.style.textShadow = "none";
                  }}
                >
                  {item}
                </a>
              ))}
            </div>
          )}

          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                padding: "4px",
              }}
            >
              <span
                style={{
                  width: "24px",
                  height: "2px",
                  background: menuOpen ? "#a855f7" : "rgba(255,255,255,0.7)",
                  borderRadius: "2px",
                  transition: "all 0.3s",
                  transform: menuOpen
                    ? "rotate(45deg) translateY(7px)"
                    : "none",
                }}
              />
              <span
                style={{
                  width: "24px",
                  height: "2px",
                  background: "rgba(255,255,255,0.7)",
                  borderRadius: "2px",
                  transition: "all 0.3s",
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  width: "24px",
                  height: "2px",
                  background: menuOpen ? "#a855f7" : "rgba(255,255,255,0.7)",
                  borderRadius: "2px",
                  transition: "all 0.3s",
                  transform: menuOpen
                    ? "rotate(-45deg) translateY(-7px)"
                    : "none",
                }}
              />
            </button>
          )}
        </nav>

        {isMobile && menuOpen && (
          <div
            style={{
              position: "fixed",
              top: "56px",
              left: 0,
              right: 0,
              zIndex: 9,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              background: "rgba(10,10,26,0.95)",
              borderBottom: "1px solid rgba(139,92,246,0.2)",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {["Home", "Gallery", "About", "Contact"].map((item) => (
              <a
                key={item}
                href="#"
                onClick={() => setMenuOpen(false)}
                style={{
                  color: "rgba(255,255,255,0.7)",
                  textDecoration: "none",
                  fontSize: "16px",
                  fontWeight: 500,
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(139,92,246,0.1)",
                }}
              >
                {item}
              </a>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? "28px" : "80px",
            maxWidth: "1200px",
            width: "100%",
            flexWrap: "wrap",
            marginTop: isMobile ? "64px" : "40px",
            flexDirection: isMobile ? "column-reverse" : "row",
          }}
        >
          <div
            style={{
              flex: isMobile ? "1 1 auto" : "1 1 400px",
              maxWidth: isMobile ? "100%" : "500px",
              width: "100%",
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
              textAlign: isMobile ? "center" : "left",
              padding: isMobile ? "0 4px" : "0",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "6px 16px",
                borderRadius: "20px",
                border: "1px solid rgba(168,85,247,0.3)",
                background: "rgba(168,85,247,0.1)",
                color: "#c084fc",
                fontSize: isMobile ? "10px" : "12px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: isMobile ? "16px" : "24px",
              }}
            >
              ✦ Welcome to BLICKDACK
            </div>

            <h1
              style={{
                fontSize: isMobile
                  ? "clamp(28px, 8vw, 40px)"
                  : "clamp(36px, 5vw, 64px)",
                fontWeight: 900,
                lineHeight: 1.1,
                color: "#ffffff",
                marginBottom: isMobile ? "16px" : "24px",
                letterSpacing: "-1px",
              }}
            >
              <span>WELCOME </span>
              <span
                style={{
                  background: "linear-gradient(135deg, #a855f7, #ec4899)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "none",
                  filter: "drop-shadow(0 0 30px rgba(168,85,247,0.4))",
                }}
              >
                TO
              </span>
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #06b6d4, #a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 30px rgba(6,182,212,0.4))",
                }}
              >
                BLICKDACK
              </span>
            </h1>

            <p
              style={{
                fontSize: isMobile ? "14px" : "16px",
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.5)",
                marginBottom: isMobile ? "28px" : "40px",
                maxWidth: isMobile ? "100%" : "420px",
                margin: isMobile ? "0 auto 28px auto" : undefined,
              }}
            >
              Nơi cung cấp các tool tiện ích phù hợp nhu cầu người dùng
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: isMobile ? "center" : "flex-start",
                alignItems: "center",
              }}
            >
              <button
                onClick={handleExploreClick}
                style={{
                  padding: isMobile ? "14px 28px" : "14px 36px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  color: "#fff",
                  fontSize: isMobile ? "14px" : "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow:
                    "0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.2)",
                  transition: "transform 0.2s, box-shadow 0.3s",
                  letterSpacing: "0.5px",
                  width: isMobile ? "100%" : "auto",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(124,58,237,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.2)";
                }}
              >
                Khám phá ngay ✦
              </button>
              <a
                href="https://t.me/Mr_xiaolin1377"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: isMobile ? "14px 28px" : "14px 36px",
                  borderRadius: "12px",
                  border: "1px solid rgba(168,85,247,0.3)",
                  background: "rgba(168,85,247,0.05)",
                  color: "#c084fc",
                  fontSize: isMobile ? "14px" : "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  transition: "all 0.3s",
                  letterSpacing: "0.5px",
                  width: isMobile ? "100%" : "auto",
                  textDecoration: "none",
                  textAlign: "center",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(168,85,247,0.15)";
                  e.target.style.borderColor = "rgba(168,85,247,0.5)";
                  e.target.style.boxShadow = "0 0 20px rgba(168,85,247,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(168,85,247,0.05)";
                  e.target.style.borderColor = "rgba(168,85,247,0.3)";
                  e.target.style.boxShadow = "none";
                }}
              >
                Tìm hiểu thêm
              </a>
            </div>
          </div>

          <div
            style={{
              flex: isMobile ? "1 1 auto" : "1 1 350px",
              maxWidth: isMobile ? "240px" : "450px",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded
                ? "translateY(0) scale(1)"
                : "translateY(30px) scale(0.95)",
              transition:
                "opacity 1s ease-out 0.3s, transform 1s ease-out 0.3s",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "110%",
                height: "110%",
                borderRadius: "24px",
                background:
                  "conic-gradient(from 0deg, #7c3aed, #ec4899, #06b6d4, #a855f7, #7c3aed)",
                filter: isMobile ? "blur(25px)" : "blur(40px)",
                opacity: isMobile ? 0.35 : 0.5,
                animation: "rotateGlow 8s linear infinite",
              }}
            />

            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "20px",
                boxShadow: isMobile
                  ? "0 0 30px rgba(168,85,247,0.3), 0 0 60px rgba(168,85,247,0.15)"
                  : "0 0 60px rgba(168,85,247,0.4), 0 0 120px rgba(168,85,247,0.2), inset 0 0 60px rgba(168,85,247,0.1)",
              }}
            />

            <div
              style={{
                position: "relative",
                borderRadius: "20px",
                overflow: "hidden",
                border: "2px solid rgba(168,85,247,0.3)",
                width: "100%",
              }}
            >
              <img
                src={ANIME_IMAGE}
                alt="Anime character"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "40%",
                  background:
                    "linear-gradient(transparent, rgba(10,10,26,0.8))",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(168,85,247,0.1) 45%, rgba(168,85,247,0.2) 50%, rgba(168,85,247,0.1) 55%, transparent 60%)",
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              />
            </div>

            {!isMobile && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: "-20px",
                    right: "-20px",
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    border: "2px solid rgba(236,72,153,0.4)",
                    animation: "floatDecor 3s ease-in-out infinite",
                    boxShadow: "0 0 20px rgba(236,72,153,0.3)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "-15px",
                    left: "-15px",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    border: "2px solid rgba(6,182,212,0.4)",
                    animation: "floatDecor 4s ease-in-out 1s infinite",
                    boxShadow: "0 0 20px rgba(6,182,212,0.3)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "30%",
                    left: "-30px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#a855f7",
                    boxShadow: "0 0 15px #a855f7, 0 0 30px #a855f7",
                    animation: "floatDecor 5s ease-in-out 0.5s infinite",
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Stats section removed */}

        <div
          style={{
            width: isMobile ? "120px" : "200px",
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, #a855f7, #ec4899, #a855f7, transparent)",
            marginTop: isMobile ? "32px" : "60px",
            marginBottom: isMobile ? "24px" : "0",
            borderRadius: "2px",
            boxShadow: "0 0 20px rgba(168,85,247,0.4)",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }
        @keyframes pulseOrb {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.3); opacity: 0.5; }
        }
        @keyframes rotateGlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes floatDecor {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a1a; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a1a; }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.5); }
      `}</style>
    </div>
  );
}
