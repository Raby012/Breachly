"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Scan failed.");
      } else {
        setResult(data.result);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-slate-950 text-white px-4 py-16">
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
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {loading ? "Scanning..." : "Scan"}
        </button>
      </form>

      {error && <p className="mt-6 text-red-400 max-w-md text-center">{error}</p>}

      {result && (
        <div className="mt-10 w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold">{result.scan.grade}</span>
            <span className="text-slate-400">Score: {result.scan.score}</span>
          </div>
          <p className="text-slate-400 mb-4">
            {result.scan.testsPassed} / {result.scan.testsQuantity} tests passed
          </p>
          <div className="space-y-3">
            {Object.entries(result.tests).map(([name, test]: [string, any]) => (
              <div key={name} className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-sm">{name}</span>
                <span className={`text-sm ${test.pass ? "text-green-400" : "text-red-400"}`}>
                  {test.pass ? "Pass" : "Fail"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
