import React from 'react';
import './styles/loading-screen.css';

export function LoadingScreen({ activity = "Plan an adventure" }) {
  return (
    <div className="loading-screen">
      <h1>PerfectTimeTo</h1>
      <h2>{activity}</h2>
      <h3>is loading...</h3>
      <div className="spinner"></div>
    </div>
  );
}
