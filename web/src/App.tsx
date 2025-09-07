import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default App;
