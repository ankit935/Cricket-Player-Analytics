import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// Shows the real error on screen instead of a blank page.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  reset = () => {
    try {
      ["cat_local", "cat_team", "cat_ok", "tt_local", "tt_team", "tt_ok"].forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch { /* ignore */ }
    location.reload();
  };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 560, margin: "40px auto", padding: 20, fontFamily: "system-ui,sans-serif" }}>
        <h2>Something went wrong</h2>
        <p>Cricket Analytics Tool hit an error. Details:</p>
        <pre style={{ whiteSpace: "pre-wrap", background: "#fee", padding: 12, borderRadius: 8, color: "#900" }}>
          {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
        </pre>
        <button onClick={this.reset} style={{ padding: "10px 18px", fontSize: 16, cursor: "pointer" }}>
          Clear saved data &amp; reload
        </button>
      </div>
    );
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
