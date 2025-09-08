import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {createEvent, getEvents, refreshEvents} from "../lib/api.ts";
import EventList from "../components/EventList.tsx";
import {groupEvents} from "../lib/grouping.ts";
import AddEventForm from "../components/AddEventForm.tsx";

const Events = () => {
  const [days, setDays] = useState<number>(7);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const fetchNow = async (d = days) => {
    setLoading(true);
    try {
      const evs = await getEvents(d);
      setEvents(evs);
      setError(null);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      // if API client already redirected on 401, this is redundant—but safe:
      if (msg.toLowerCase().includes("unauthorized")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const grouped = useMemo(() => groupEvents(events, days), [events, days]);
  
  return (
    <div style={{ maxWidth: 800, margin: "2rem auto" }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h2 style={{ marginRight: "auto" }}>My Google Calendar Events</h2>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={1}>1 day</option>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
        </select>
        <button onClick={() => fetchNow(days)}>Reload</button>
        <button
          onClick={async () => {
            await refreshEvents();
            await fetchNow(days);
          }}
        >
          Refresh from Google
        </button>
      </header>
      
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {loading && <p>Loading…</p>}
      
      <EventList grouped={grouped} />
      
      <hr style={{ margin: "2rem 0" }} />
      <AddEventForm
        onCreate={async (payload) => {
          await createEvent(payload);
          await fetchNow(days);
        }}
      />
    </div>
  );
};

export default Events;
