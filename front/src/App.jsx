// src/App.jsx
import React from "react";
import AppRouter from "./routes/AppRouter";
import { AlarmProvider } from "./context/AlarmContext";

function App() {
  return (
    <AlarmProvider>
      <AppRouter />
    </AlarmProvider>
  );
}

export default App;
