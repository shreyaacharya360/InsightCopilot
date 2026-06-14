import React, { useState } from "react";
import { incidents, hourlyData, metrics, complianceMap } from "./mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

const GROQ_API_KEY = "GROQ_API_KEY"; // 🔑 Paste your gsk_... key here

export default function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm your AI security analyst powered by Llama 3. Ask me anything about flagged incidents." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const high = incidents.filter((i) => i.risk === "HIGH").length;
  const med = incidents.filter((i) => i.risk === "MED").length;
  const low = incidents.filter((i) => i.risk === "LOW").length;

  async function sendChat(question) {
    const q = question || input.trim();
    if (!q) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    const context = `You are a cybersecurity AI analyst for Societe Generale bank.
Current flagged insider threat incidents:
${incidents.map((i) => `- ${i.user} (${i.dept}): ${i.action} at ${i.time}, risk score ${i.score}/100, anomaly type: ${i.anomalyType}, flags: ${i.flags.join(", ")}, recommendation: ${i.recommendation}`).join("\n")}
Answer in 2-3 sentences. Be specific and actionable. No markdown formatting.`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [
            { role: "system", content: context },
            { role: "user", content: q },
          ],
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: "ai", text: "Error: " + data.error.message }]);
      } else {
        const reply = data.choices?.[0]?.message?.content || "No response.";
        setMessages((prev) => [...prev, { role: "ai", text: reply }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", text: "Network error: " + e.message }]);
    }
    setLoading(false);
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(226, 75, 74);
    doc.text("PS4: Insider Threat Incident Report", 14, 20);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`High Risk: ${high}   Medium: ${med}   Low: ${low}   Total Events: ${metrics.totalEventsProcessed}`, 14, 37);

    doc.setFontSize(12);
    doc.text("Detection Metrics", 14, 48);
    autoTable(doc, {
      startY: 52,
      head: [["Metric", "Value", "Target"]],
      body: [
        ["Precision", metrics.precision + "%", "> 75%"],
        ["Recall", metrics.recall + "%", "> 70%"],
        ["F1 Score", metrics.f1, "> 0.72"],
        ["Detection Speed", metrics.detectionSpeed, "< 5 min"],
        ["Explainability", metrics.explainability, "4/5 stars"],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [226, 75, 74] },
    });

    doc.setFontSize(12);
    doc.text("Flagged Incidents", 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [["User", "Dept", "Anomaly Type", "Time", "Risk", "Score", "Recommendation"]],
      body: incidents.map((i) => [i.user, i.dept, i.anomalyType, i.time, i.risk, i.score, i.recommendation]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [226, 75, 74] },
    });

    doc.setFontSize(12);
    doc.text("Regulatory Compliance", 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [["Regulation", "Status", "Coverage"]],
      body: complianceMap.map((c) => [c.regulation, c.status, c.detail]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [226, 75, 74] },
    });

    doc.save("ps4_incident_report.pdf");
  }

  const riskColor = (r) => r === "HIGH" ? "#E24B4A" : r === "MED" ? "#BA7517" : "#3B9A5A";
  const riskBg = (r) => r === "HIGH" ? "#FCEBEB" : r === "MED" ? "#FAEEDA" : "#EAF3DE";

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">🛡️</span>
          <span>ThreatWatch</span>
        </div>
        <nav>
          {["dashboard", "incidents", "metrics", "copilot"].map((tab) => (
            <button
              key={tab}
              className={`nav-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "dashboard" && "📊"}
              {tab === "incidents" && "🚨"}
              {tab === "metrics" && "📈"}
              {tab === "copilot" && "🤖"}
              {" "}{tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>Societe Generale · PS4</div>
          <div style={{ marginTop: 4, fontSize: 10, color: "#64748B" }}>
            Scales to 1M+ daily events
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>
              {activeTab === "dashboard" && "Security Dashboard"}
              {activeTab === "incidents" && "All Incidents"}
              {activeTab === "metrics" && "Detection Metrics"}
              {activeTab === "copilot" && "AI Copilot"}
            </h1>
            <p className="subtitle">Data Access Audit & Insider Threat Detection · GDPR · NIST IR-4 · SOX 302</p>
          </div>
          <button className="export-btn" onClick={exportPDF}>⬇ Export PDF Report</button>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <>
            <div className="cards">
              <div className="card" style={{ borderTop: "3px solid #E24B4A" }}>
                <div className="card-label">High Risk</div>
                <div className="card-val" style={{ color: "#E24B4A" }}>{high}</div>
                <div className="card-sub">Immediate action needed</div>
              </div>
              <div className="card" style={{ borderTop: "3px solid #BA7517" }}>
                <div className="card-label">Medium Risk</div>
                <div className="card-val" style={{ color: "#BA7517" }}>{med}</div>
                <div className="card-sub">Monitor closely</div>
              </div>
              <div className="card" style={{ borderTop: "3px solid #3B9A5A" }}>
                <div className="card-label">Low Risk</div>
                <div className="card-val" style={{ color: "#3B9A5A" }}>{low}</div>
                <div className="card-sub">Normal behavior</div>
              </div>
              <div className="card" style={{ borderTop: "3px solid #185FA5" }}>
                <div className="card-label">Total Events</div>
                <div className="card-val" style={{ color: "#185FA5" }}>{metrics.totalEventsProcessed}</div>
                <div className="card-sub">Processed today</div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">⏰ Hourly Access Events — Anomaly at 2 AM detected</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="events" name="Normal">
                    {hourlyData.map((d, i) => (
                      <Cell key={i} fill={d.anomaly > 0 ? "#E24B4A" : "#378ADD"} />
                    ))}
                  </Bar>
                  <Bar dataKey="anomaly" name="Anomaly" fill="#E24B4A" />
                </BarChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                <span><span className="dot" style={{ background: "#378ADD" }} />Normal activity</span>
                <span><span className="dot" style={{ background: "#E24B4A" }} />Anomalous spike</span>
              </div>
            </div>

            <div className="section">
              <div className="section-title">🚨 Top High Risk Incidents</div>
              <table className="table">
                <thead>
                  <tr><th>User</th><th>Dept</th><th>Anomaly Type</th><th>Time</th><th>Risk</th><th>Score</th></tr>
                </thead>
                <tbody>
                  {incidents.filter((i) => i.risk === "HIGH").map((i) => (
                    <tr key={i.id} className="table-row" onClick={() => { setSelectedUser(i); setActiveTab("incidents"); }}>
                      <td className="bold">{i.user}</td>
                      <td className="muted">{i.dept}</td>
                      <td>{i.anomalyType}</td>
                      <td className="muted">{i.time}</td>
                      <td><span className="badge" style={{ background: riskBg(i.risk), color: riskColor(i.risk) }}>{i.risk}</span></td>
                      <td className="bold">{i.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-title">⚖️ Regulatory Compliance Coverage</div>
              <table className="table">
                <thead>
                  <tr><th>Regulation</th><th>Status</th><th>Coverage</th></tr>
                </thead>
                <tbody>
                  {complianceMap.map((c) => (
                    <tr key={c.regulation}>
                      <td className="bold">{c.regulation}</td>
                      <td><span className="badge" style={{ background: "#EAF3DE", color: "#3B6D11" }}>{c.status}</span></td>
                      <td className="muted">{c.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* INCIDENTS TAB */}
        {activeTab === "incidents" && (
          <div style={{ display: "flex", gap: "1rem" }}>
            <div className="section" style={{ flex: 2 }}>
              <div className="section-title">All Incidents</div>
              <table className="table">
                <thead>
                  <tr><th>User</th><th>Dept</th><th>Anomaly Type</th><th>Time</th><th>Risk</th><th>Score</th></tr>
                </thead>
                <tbody>
                  {incidents.map((i) => (
                    <tr
                      key={i.id}
                      className={`table-row ${selectedUser?.id === i.id ? "selected" : ""}`}
                      onClick={() => setSelectedUser(i)}
                    >
                      <td className="bold">{i.user}</td>
                      <td className="muted">{i.dept}</td>
                      <td>{i.anomalyType}</td>
                      <td className="muted">{i.time}</td>
                      <td><span className="badge" style={{ background: riskBg(i.risk), color: riskColor(i.risk) }}>{i.risk}</span></td>
                      <td className="bold">{i.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedUser && (
              <div className="section" style={{ flex: 1, minWidth: 240 }}>
                <div className="section-title">👤 {selectedUser.user}</div>
                <div className="detail-row"><span>Department</span><span>{selectedUser.dept}</span></div>
                <div className="detail-row"><span>Time</span><span>{selectedUser.time}</span></div>
                <div className="detail-row">
                  <span>Risk Score</span>
                  <span style={{ color: riskColor(selectedUser.risk), fontWeight: 600 }}>{selectedUser.score}/100</span>
                </div>
                <div className="detail-row">
                  <span>Risk Level</span>
                  <span className="badge" style={{ background: riskBg(selectedUser.risk), color: riskColor(selectedUser.risk) }}>{selectedUser.risk}</span>
                </div>
                <div className="detail-row">
                  <span>Anomaly Type</span>
                  <span className="muted">{selectedUser.anomalyType}</span>
                </div>
                <div className="detail-section">
                  <div className="detail-label">Activity</div>
                  <div className="detail-text">{selectedUser.action}</div>
                </div>
                <div className="detail-section">
                  <div className="detail-label">Analysis</div>
                  <div className="detail-text">{selectedUser.details}</div>
                </div>
                <div className="detail-section">
                  <div className="detail-label">Recommended Action</div>
                  <div className="detail-text" style={{ color: "#E24B4A" }}>{selectedUser.recommendation}</div>
                </div>
                <div className="detail-section">
                  <div className="detail-label">Flags</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {selectedUser.flags.length > 0
                      ? selectedUser.flags.map((f) => <span key={f} className="flag-tag">{f}</span>)
                      : <span className="muted">No flags</span>}
                  </div>
                </div>
                <button
                  className="ai-btn"
                  onClick={() => {
                    setActiveTab("copilot");
                    sendChat(`What should we do about ${selectedUser.user} who ${selectedUser.action} at ${selectedUser.time}? Their anomaly type is ${selectedUser.anomalyType}.`);
                  }}
                >
                  🤖 Ask AI about this user
                </button>
              </div>
            )}
          </div>
        )}

        {/* METRICS TAB */}
        {activeTab === "metrics" && (
          <>
            <div className="cards">
              <div className="card" style={{ borderTop: "3px solid #3B9A5A" }}>
                <div className="card-label">Precision</div>
                <div className="card-val" style={{ color: "#3B9A5A" }}>{metrics.precision}%</div>
                <div className="card-sub">Target: &gt; 75%  ✅</div>
              </div>
              <div className="card" style={{ borderTop: "3px solid #3B9A5A" }}>
                <div className="card-label">Recall</div>
                <div className="card-val" style={{ color: "#3B9A5A" }}>{metrics.recall}%</div>
                <div className="card-sub">Target: &gt; 70%  ✅</div>
              </div>
              <div className="card" style={{ borderTop: "3px solid #3B9A5A" }}>
                <div className="card-label">F1 Score</div>
                <div className="card-val" style={{ color: "#3B9A5A" }}>{metrics.f1}</div>
                <div className="card-sub">Target: &gt; 0.72  ✅</div>
              </div>
              <div className="card" style={{ borderTop: "3px solid #3B9A5A" }}>
                <div className="card-label">Detection Speed</div>
                <div className="card-val" style={{ color: "#3B9A5A", fontSize: 20 }}>{metrics.detectionSpeed}</div>
                <div className="card-sub">Target: &lt; 5 min  ✅</div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">📊 Detection Accuracy Breakdown</div>
              <table className="table">
                <thead>
                  <tr><th>Metric</th><th>Value</th><th>Target</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr><td>Precision</td><td className="bold">{metrics.precision}%</td><td>&gt; 75%</td><td><span className="badge" style={{ background: "#EAF3DE", color: "#3B6D11" }}>✅ Met</span></td></tr>
                  <tr><td>Recall</td><td className="bold">{metrics.recall}%</td><td>&gt; 70%</td><td><span className="badge" style={{ background: "#EAF3DE", color: "#3B6D11" }}>✅ Met</span></td></tr>
                  <tr><td>F1 Score</td><td className="bold">{metrics.f1}</td><td>&gt; 0.72</td><td><span className="badge" style={{ background: "#EAF3DE", color: "#3B6D11" }}>✅ Met</span></td></tr>
                  <tr><td>Detection Speed</td><td className="bold">{metrics.detectionSpeed}</td><td>&lt; 5 min</td><td><span className="badge" style={{ background: "#EAF3DE", color: "#3B6D11" }}>✅ Met</span></td></tr>
                  <tr><td>Explainability</td><td className="bold">{metrics.explainability}</td><td>4/5 stars</td><td><span className="badge" style={{ background: "#EAF3DE", color: "#3B6D11" }}>✅ Met</span></td></tr>
                  <tr><td>True Positives</td><td className="bold">{metrics.truePositives}</td><td>-</td><td>-</td></tr>
                  <tr><td>False Positives</td><td className="bold">{metrics.falsePositives}</td><td>-</td><td>-</td></tr>
                  <tr><td>Missed Threats</td><td className="bold">{metrics.missedThreats}</td><td>-</td><td>-</td></tr>
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-title">🏗️ Scale Architecture</div>
              <table className="table">
                <thead>
                  <tr><th>Component</th><th>Current (Demo)</th><th>Production Scale</th></tr>
                </thead>
                <tbody>
                  <tr><td>Data Ingestion</td><td>CSV / Mock JSON</td><td>Apache Kafka streaming (1M+ events/day)</td></tr>
                  <tr><td>Storage</td><td>In-memory</td><td>Apache Parquet + S3 data lake</td></tr>
                  <tr><td>Detection Engine</td><td>Rule-based scoring</td><td>Isolation Forest ML model + rules</td></tr>
                  <tr><td>Processing</td><td>React frontend</td><td>Apache Spark distributed compute</td></tr>
                  <tr><td>Alerting</td><td>Dashboard UI</td><td>PagerDuty + SIEM integration</td></tr>
                  <tr><td>AI Narratives</td><td>Groq / Llama 3</td><td>Dedicated LLM inference cluster</td></tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* COPILOT TAB */}
        {activeTab === "copilot" && (
          <div className="section copilot">
            <div className="section-title">🤖 AI Security Copilot — Powered by Llama 3</div>
            <div className="quick-btns">
              {[
                "Why is Alice flagged as high risk?",
                "What should I do about the 2AM spike?",
                "Which department is most at risk?",
                "Summarize all high risk incidents",
                "How does this comply with GDPR?",
              ].map((q) => (
                <button key={q} className="quick-btn" onClick={() => sendChat(q)}>{q}</button>
              ))}
            </div>
            <div className="chat-area">
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.role}`}>{m.text}</div>
              ))}
              {loading && <div className="msg ai">⏳ Analyzing...</div>}
            </div>
            <div className="chat-input-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="e.g. Why is Raj suspicious?"
                className="chat-input"
              />
              <button className="send-btn" onClick={() => sendChat()}>Ask ↗</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
