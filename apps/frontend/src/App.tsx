import { Route, Routes } from "react-router";
import "./index.css";
import { Signup } from "./pages/Signup.tsx";
import { Landing } from "./pages/Landing.tsx";

export function App() {
  return <div>
    <Routes>
      <Route path="/signup" element={<Signup/>}/>
      <Route path="/" element={<Landing />}/>
    </Routes>
  </div>;
}

export default App;
