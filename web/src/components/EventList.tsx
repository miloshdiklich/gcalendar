import { format, parseISO } from "date-fns";
import type {Grouped} from "../lib/grouping";

const EventList = ({ grouped }: { grouped: Grouped }) => (
  <div>
    {grouped.groups.map((g) => (
      <section key={g.key} style={{ margin: "1rem 0" }}>
        <h3 style={{ marginBottom: 8 }}>{g.label}</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {g.items.map((e) => (
            <li key={e.id ?? e.startTime} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ fontWeight: 600 }}>{e.summary}</div>
              <div style={{ opacity: 0.8 }}>
                {format(parseISO(e.startTime), "HH:mm")} – {format(parseISO(e.endTime), "HH:mm")}
              </div>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
);

export default EventList;
