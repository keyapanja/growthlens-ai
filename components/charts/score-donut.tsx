"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getScoreHex } from "@/lib/utils";

export function ScoreDonut({
  label,
  score
}: {
  label: string;
  score: number;
}) {
  const color = getScoreHex(score);
  const data = [
    { name: label, value: score },
    { name: "rest", value: Math.max(0, 100 - score) }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel rounded-3xl p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/80">{label}</h3>
        <span className="text-xs uppercase tracking-[0.24em] text-white/40">Live</span>
      </div>
      <div className="relative h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={44}
              outerRadius={60}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive
              animationDuration={900}
            >
              <Cell fill={color} />
              <Cell fill="rgba(255,255,255,0.08)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-semibold text-white">{score}</div>
          <div className="text-xs uppercase tracking-[0.22em] text-white/50">Score</div>
        </div>
      </div>
    </motion.div>
  );
}
