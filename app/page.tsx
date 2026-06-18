"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Scanning:", url); // Phase 1 mein yahan API call jayega
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4">
      <h1 className="text-4xl font-bold mb-2">Breachly</h1>
      <p className="text-slate-400 mb-8">Apni site hack hone se pehle pakdo</p>
      <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
        <input
          type="url"
          required
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium"
        >
          Scan
        </button>
      </form>
    </main>
  );
}
