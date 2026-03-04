export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid var(--border)",
            borderTopColor: "var(--mint)",
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 1s linear infinite",
          }}
        />
        <div
          style={{
            fontFamily: "var(--ff)",
            fontSize: 18,
            fontWeight: 200,
            color: "var(--ivoryDD)",
          }}
        >
          Carregando...
        </div>
      </div>
    </div>
  );
}
