import React from "react";
import { Calendar } from "./Calendar";
import { Frame } from "./Frame";
import { Plus } from "./Plus";
import { UnderBar } from "./UnderBar";
import "./style.css";

export const CalendarMain = () => {
  return (
    <div className="calendar-main">
      <Plus className="icon-feathericons" />
      <Frame />
      <UnderBar />
      <Calendar />
    </div>
  );
};
