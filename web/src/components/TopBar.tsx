import { useEffect, useRef, useState } from "react";
import { getMe, logout } from "../lib/api";
import { useNavigate } from "react-router-dom";

type Me = { displayName: string; email: string; photoUrl: string | null };

const TopBar = () => {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const fetched = useRef(false); // avoid double-fetch under StrictMode
  
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    (async () => {
      try {
        const { user } = await getMe();
        setMe(user);
      } catch {
        // not exactly great practice to silently catch errors
        // getMe already redirects on 401
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 16px", borderBottom: "1px solid #eee", marginBottom: 16
    }}>
      <h2 style={{ marginRight: "auto" }}>Calendar</h2>
      {loading ? (
        <span>Loading user…</span>
      ) : me ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {me.photoUrl ? (
              <img src={me.photoUrl} alt="avatar"
                   style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{me.displayName}</span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>{me.email}</span>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            style={{ marginLeft: 8 }}
          >
            Logout
          </button>
        </>
      ) : (
        <button onClick={() => navigate("/login")}>Login</button>
      )}
    </div>
  );
};

export default TopBar;
