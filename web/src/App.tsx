import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Events from "./pages/Events";

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Events />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default App;
