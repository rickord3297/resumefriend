"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RingProgressProps {
  value: number;
  label: string;
  trend?: "up" | "down" | "flat";
}

export function RingProgress({ value, label, trend = "flat" }: RingProgressProps) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const stroke = (value / 100) * circumference;

  return (
    <div className="ring-progress">
      <div className="ring-progress-svg-wrap">
        <svg viewBox="0 0 80 80" className="ring-svg">
          <circle
            className="ring-bg"
            cx="40"
            cy="40"
            r={r}
            fill="none"
            strokeWidth="6"
          />
          <circle
            className="ring-fill"
            cx="40"
            cy="40"
            r={r}
            fill="none"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - stroke}
            transform="rotate(-90 40 40)"
          />
        </svg>
        <div className="ring-value-wrap">
          <span className="ring-value">{value}</span>
          <span className="ring-suffix">%</span>
          {trend !== "flat" && (
            <span className={`ring-trend ${trend}`}>
              {trend === "up" && <TrendingUp size={14} />}
              {trend === "down" && <TrendingDown size={14} />}
            </span>
          )}
          {trend === "flat" && (
            <span className="ring-trend flat">
              <Minus size={14} />
            </span>
          )}
        </div>
      </div>
      <p className="ring-label">{label}</p>
    </div>
  );
}
