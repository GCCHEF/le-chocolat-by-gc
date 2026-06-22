export default function HomePage() {
  return (
    <main
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#f4f1ec",
      }}
    >
      <img
        src="/matiere-hero.png"
        alt="Matière"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </main>
  );
}
