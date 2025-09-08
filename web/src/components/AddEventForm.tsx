import {useState} from "react";

const AddEventForm = ({
  onCreate,
}: {
  onCreate: (p: {
    summary: string;
    date: string;
    startTime: string;
    endTime: string;
    timeZone?: string
  }) => Promise<void>;
}) => {
  const [summary, setSummary] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onCreate({summary, date, startTime, endTime});
        setSummary("");
      }}
      style={{display: "grid", gap: 8, gridTemplateColumns: "1fr 140px 140px 140px auto", alignItems: "end"}}
    >
      <div>
        <label>Name</label>
        <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Meeting" required/>
      </div>
      <div>
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required/>
      </div>
      <div>
        <label>Start</label>
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required/>
      </div>
      <div>
        <label>End</label>
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required/>
      </div>
      <button type="submit">Add</button>
    </form>
  );
};

export default AddEventForm;
