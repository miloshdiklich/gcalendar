const Login = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
  return (
    <div style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center" }}>
      <h1>Sign in</h1>
      <p>Connect your Google Calendar.</p>
      <a href={`${apiBase}/auth/google`}>
        <button>Sign in with Google</button>
      </a>
    </div>
  );
};

export default Login;
