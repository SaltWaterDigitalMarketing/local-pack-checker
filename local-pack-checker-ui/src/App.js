import React, { useState } from 'react';
import Papa, { unparse } from 'papaparse';

function App() {
  const [keywords, setKeywords] = useState([]);
  const [results, setResults] = useState([]);
  const [location, setLocation] = useState("Los Angeles, CA");
  const [loading, setLoading] = useState(false);

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      complete: (res) => {
        const data = res.data.flat().filter(k => k);
        setKeywords(data);
      }
    });
  };

  const checkKeywords = async () => {
    setLoading(true);
    const apiKey = process.env.REACT_APP_SERPER_API_KEY;
    const checkedResults = [];

    for (const keyword of keywords) {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey
        },
        body: JSON.stringify({ q: keyword, location })
      });

      const data = await response.json();
      const hasLocalPack = Array.isArray(data.places) && data.places.length > 0;

      checkedResults.push({
        keyword,
        hasLocalPack: hasLocalPack ? "Yes" : "No",
        location
      });
    }

    setResults(checkedResults);
    setLoading(false);
  };

  const downloadCSV = () => {
    const csv = unparse(results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'local-pack-results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <h1>📍 Local Pack Checker</h1>

      <input type="file" accept=".csv" onChange={handleCSVUpload} />
      <br /><br />

      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Search location (e.g., Los Angeles, CA)"
        style={{ width: "100%", padding: 8 }}
      />
      <br /><br />

      <button onClick={checkKeywords} disabled={loading || keywords.length === 0}>
        {loading ? "Checking..." : "Check Keywords"}
      </button>

      {results.length > 0 && (
        <>
          <table border="1" cellPadding="8" style={{ marginTop: 24, width: "100%" }}>
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Has Local Pack?</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {results.map(({ keyword, hasLocalPack, location }, i) => (
                <tr key={i}>
                  <td>{keyword}</td>
                  <td>{hasLocalPack}</td>
                  <td>{location}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={downloadCSV} style={{ marginTop: 16 }}>
            📥 Download Results as CSV
          </button>
        </>
      )}
    </div>
  );
}

export default App;
