"use client"

import { TooltipProps } from "recharts"

export function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(20, 20, 20, 0.85)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "10px",
          padding: "12px 16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <p style={{ color: "rgba(255, 255, 255, 0.9)", marginBottom: "8px", fontSize: "13px", fontWeight: 600 }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{
              color: entry.color || "rgba(255, 255, 255, 0.8)",
              fontSize: "12px",
              margin: "4px 0",
            }}
          >
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: entry.color, marginRight: "8px" }} />
            {entry.name}: <strong>{typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}</strong>
          </p>
        ))}
      </div>
    )
  }
  return null
}

