import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DifficultyLevel, PriorityLevel } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Please enter a website URL.");
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(candidate);

  return url.toString();
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateString));
}

export function getScoreTone(score: number) {
  if (score >= 90) return "text-emerald-300";
  if (score >= 50) return "text-amber-300";
  return "text-rose-300";
}

export function getScoreHex(score: number) {
  if (score >= 90) return "#4ade80";
  if (score >= 50) return "#fbbf24";
  return "#fb7185";
}

export function getPriorityTone(level: PriorityLevel) {
  switch (level) {
    case "High":
      return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30";
    case "Medium":
      return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-300/30";
    default:
      return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-300/30";
  }
}

export function getDifficultyTone(level: DifficultyLevel) {
  switch (level) {
    case "Hard":
      return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30";
    case "Medium":
      return "bg-sky-500/15 text-sky-200 ring-1 ring-sky-300/30";
    default:
      return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-300/30";
  }
}

export function toPercent(score: number) {
  return Math.round(score * 100);
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
