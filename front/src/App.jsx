// src/App.jsx
import React from "react";
import AppRouter from "./routes/AppRouter";
import { AlarmProvider } from "./context/AlarmContext";

import GlobalAlarmModal from "./components/GlobalAlarmModal";

function App() {
  return (
    <AlarmProvider>
      <GlobalAlarmModal />
      <AppRouter />
    </AlarmProvider>
  );
}

export default App;
