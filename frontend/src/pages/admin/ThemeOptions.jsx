import React, { useState, useEffect } from "react";
import { themeAPI } from "../../services/api";
import { applyTheme } from "../../utils/themeHelper";
import {
  Palette,
  Type,
  Layout,
  Sliders,
  Check,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Sparkles,
  MousePointer
} from "lucide-react";

const COLOR_PRESETS = [
  { name: "Default Blue", primary: "var(--g-accent, #3b82f6)", secondary: "var(--g-accent, #10b981)", accent: "var(--g-accent, #6366f1)", bg: "#0a0d14", text: "#e2e8f0" },
  { name: "Emerald Pro", primary: "var(--g-accent, #10b981)", secondary: "var(--g-accent, #3b82f6)", accent: "#059669", bg: "#06130e", text: "#e2e8f0" },
  { name: "Royal Violet", primary: "#8b5cf6", secondary: "#ec4899", accent: "#a855f7", bg: "#0d0a18", text: "#f1f5f9" },
  { name: "Amber Crimson", primary: "#f59e0b", secondary: "#ef4444", accent: "#d97706", bg: "#140e08", text: "#f8fafc" },
  { name: "Cyberpunk Cyan", primary: "#06b6d4", secondary: "#f43f5e", accent: "var(--g-accent, #3b82f6)", bg: "#081018", text: "#e2e8f0" }
];

const FONTS = [
  { id: "jakarta", name: "Plus Jakarta Sans (Crisp Modern)" },
  { id: "inter", name: "Inter (Clean Professional)" },
  { id: "roboto", name: "Roboto (Google Standard)" },
  { id: "outfit", name: "Outfit (Geometric Bold)" },
  { id: "system", name: "System Sans-Serif" }
];

const ThemeOptions = () => {
  const [activeTab, setActiveTab] = useState("colors");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedPreset, setSelectedPreset] = useState(null);

  const [form, setForm] = useState({
    // Colors
    primaryColor: "var(--g-accent, #3b82f6)",
    secondaryColor: "var(--g-accent, #10b981)",
    accentColor: "var(--g-accent, #6366f1)",
    backgroundColor: "#0a0d14",
    textColor: "#e2e8f0",
    headingColor: "#ffffff",
    linkColor: "var(--g-accent, #3b82f6)",
    headerBackground: "#0d131f",
    footerBackground: "#090e18",

    // Typography
    fontFamily: "jakarta",
    headingFont: "jakarta",
    baseFontSize: "16px",
    headingScale: "normal",

    // Header
    headerStyle: "dark",
    headerTextColor: "#ffffff",
    stickyHeader: true,
    showAdminBar: true,
    headerHeight: "72px",

    // Footer
    footerTextColor: "#94a3b8",
    footerStyle: "standard",

    // Buttons
    buttonBackground: "var(--g-accent, #3b82f6)",
    buttonTextColor: "#ffffff",
    buttonBorderRadius: "8px",
    buttonStyle: "solid"
  });

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    setLoading(true);
    try {
      const res = await themeAPI.getSettings();
      if (res.settings) {
        const s = res.settings;
        setForm(prev => ({
          ...prev,
          primaryColor: s.primaryColor || prev.primaryColor,
          secondaryColor: s.secondaryColor || prev.secondaryColor,
          accentColor: s.accentColor || prev.accentColor,
          backgroundColor: s.backgroundColor || prev.backgroundColor,
          textColor: s.textColor || prev.textColor,
          headingColor: s.headingColor || prev.headingColor,
          linkColor: s.linkColor || prev.linkColor,
          headerBackground: s.headerBackground || prev.headerBackground,
          footerBackground: s.footerBackground || prev.footerBackground,
          showAdminBar: s.showAdminBar !== undefined ? s.showAdminBar : true,
          fontFamily: s.fontFamily || prev.fontFamily,
          headingFont: s.headingFont || prev.headingFont,
          baseFontSize: s.baseFontSize || prev.baseFontSize,
          headingScale: s.headingScale || prev.headingScale,
          headerStyle: s.headerStyle || prev.headerStyle,
          headerTextColor: s.headerTextColor || prev.headerTextColor,
          stickyHeader: s.stickyHeader !== undefined ? s.stickyHeader : prev.stickyHeader,
          headerHeight: s.headerHeight || prev.headerHeight,
          footerTextColor: s.footerTextColor || prev.footerTextColor,
          footerStyle: s.footerStyle || prev.footerStyle,
          buttonBackground: s.buttonBackground || prev.buttonBackground,
          buttonTextColor: s.buttonTextColor || prev.buttonTextColor,
          buttonBorderRadius: s.buttonBorderRadius || prev.buttonBorderRadius,
          buttonStyle: s.buttonStyle || prev.buttonStyle
        }));
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Failed to load theme settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSelectedPreset(null);
    const updated = { ...form, [key]: value };
    setForm(updated);
    applyTheme(updated);
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.name);
    const updated = {
      ...form,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
      backgroundColor: preset.bg,
      textColor: preset.text,
      headingColor: "#ffffff",
      linkColor: preset.primary,
      headerBackground: preset.bg === "#0a0d14" ? "#0d131f" : preset.bg,
      footerBackground: preset.bg === "#0a0d14" ? "#090e18" : preset.bg,
      buttonBackground: preset.primary
    };
    setForm(updated);
    applyTheme(updated);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await themeAPI.updateSettings(form);
      const updated = res.settings || form;
      applyTheme(updated);
      setMessage({ type: "success", text: "Theme Options successfully saved and applied globally!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Error saving theme settings" });
    } finally {
      setSaving(false);
    }
  };

  const colorInput = (label, key, helperText) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
      <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="color"
          value={form[key] || "#000000"}
          onChange={e => handleChange(key, e.target.value)}
          style={{
            width: 44,
            height: 38,
            padding: 2,
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            background: "none",
            cursor: "pointer"
          }}
        />
        <input
          type="text"
          value={form[key] || ""}
          onChange={e => handleChange(key, e.target.value)}
          className="form-input"
          style={{ width: 130, fontFamily: "monospace", fontSize: "13px", textTransform: "uppercase" }}
        />
        {helperText && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{helperText}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10, color: "var(--text-primary)" }}>
            <Palette size={24} color="var(--primary-color)" /> Theme Options
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
            Customize global visual styling, color tokens, typography, and layout settings.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="button button-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px" }}
        >
          {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Save Theme Settings"}
        </button>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            borderRadius: 8,
            marginBottom: 20,
            fontSize: "14px",
            background: message.type === "error" ? "rgba(239, 68, 68, 0.15)" : "var(--g-accent, rgba(16, 185, 129, 0.15))",
            color: message.type === "error" ? "#f87171" : "#34d399",
            border: `1px solid ${message.type === "error" ? "rgba(239, 68, 68, 0.3)" : "var(--g-accent, rgba(16, 185, 129, 0.3))"}`
          }}
        >
          {message.type === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span style={{ flex: 1 }}>{message.text}</span>
          <button onClick={() => setMessage({ type: "", text: "" })} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-color)", marginBottom: 24, overflowX: "auto" }}>
        {[
          { key: "colors", label: "Colors & Palettes", icon: Palette },
          { key: "typography", label: "Typography", icon: Type },
          { key: "header", label: "Header", icon: Layout },
          { key: "footer", label: "Footer", icon: Sliders },
          { key: "buttons", label: "Buttons & UI", icon: MousePointer },
          { key: "preview", label: "Live Preview", icon: Eye }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                border: "none",
                background: "none",
                borderBottom: active ? "2px solid var(--primary-color)" : "2px solid transparent",
                color: active ? "var(--primary-color)" : "var(--text-secondary)",
                fontWeight: active ? 700 : 500,
                fontSize: "14px",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
          <Loader2 size={28} className="spin" /> Loading theme configuration...
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* TAB 1: COLORS */}
          {activeTab === "colors" && (
            <div>
              {/* Presets */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "18px 22px", marginBottom: 24 }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 12px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={16} color="#fbbf24" /> Quick Color Palettes
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  {COLOR_PRESETS.map((preset, idx) => {
                    const isSelected = selectedPreset === preset.name || (form.primaryColor === preset.primary && form.accentColor === preset.accent);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 8,
                          border: isSelected ? "2px solid var(--primary-color)" : "1px solid var(--border-color)",
                          background: isSelected ? "rgba(59, 130, 246, 0.08)" : "var(--bg-surface)",
                          cursor: "pointer",
                          textAlign: "left",
                          position: "relative",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: preset.primary }} />
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: preset.secondary }} />
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: preset.accent }} />
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: preset.bg, border: "1px solid rgba(255,255,255,0.3)" }} />
                          </div>
                          {isSelected && <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary-color)", display: "flex", alignItems: "center", gap: 2 }}>✓ Active</span>}
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Individual Colors Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 16px", color: "var(--text-primary)" }}>Brand & Accent Colors</h3>
                  {colorInput("Primary Color", "primaryColor", "Main brand color, active highlights")}
                  {colorInput("Secondary Color", "secondaryColor", "Supporting badges, secondary elements")}
                  {colorInput("Accent Color", "accentColor", "Gradients, glowing accents")}
                  {colorInput("Link Color", "linkColor", "Hover & text hyper-links")}
                </div>

                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 16px", color: "var(--text-primary)" }}>Surfaces & Text</h3>
                  {colorInput("Background Color", "backgroundColor", "Site-wide canvas background")}
                  {colorInput("Text Color", "textColor", "Main body copy text")}
                  {colorInput("Heading Color", "headingColor", "H1-H6 titles and card titles")}
                  {colorInput("Header Background", "headerBackground", "Top navigation bar surface")}
                  {colorInput("Footer Background", "footerBackground", "Bottom site footer surface")}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPOGRAPHY */}
          {activeTab === "typography" && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "24px", maxWidth: 700 }}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Body Font Family</label>
                <select className="form-input" value={form.fontFamily} onChange={e => handleChange("fontFamily", e.target.value)}>
                  {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Headings Font Family</label>
                <select className="form-input" value={form.headingFont} onChange={e => handleChange("headingFont", e.target.value)}>
                  {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Base Font Size</label>
                  <select className="form-input" value={form.baseFontSize} onChange={e => handleChange("baseFontSize", e.target.value)}>
                    <option value="14px">Small (14px)</option>
                    <option value="15px">Medium (15px)</option>
                    <option value="16px">Standard (16px)</option>
                    <option value="18px">Large (18px)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Heading Scale</label>
                  <select className="form-input" value={form.headingScale} onChange={e => handleChange("headingScale", e.target.value)}>
                    <option value="compact">Compact</option>
                    <option value="normal">Normal</option>
                    <option value="spacious">Spacious / Bold</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HEADER */}
          {activeTab === "header" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "24px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 18px", color: "var(--text-main)" }}>Header Navigation Settings</h3>
                <div style={{ marginBottom: 20 }}>
                  <label className="form-label">Header Style</label>
                  <select className="form-input" value={form.headerStyle} onChange={e => handleChange("headerStyle", e.target.value)}>
                    <option value="dark">Standard Dark</option>
                    <option value="glass">Glassmorphic Blur</option>
                    <option value="solid">Solid Background</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <label className="form-label">Header Height</label>
                    <select className="form-input" value={form.headerHeight} onChange={e => handleChange("headerHeight", e.target.value)}>
                      <option value="60px">Compact (60px)</option>
                      <option value="72px">Default (72px)</option>
                      <option value="84px">Spacious (84px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Frontend Admin Bar</label>
                    <select className="form-input" value={form.showAdminBar !== false ? "yes" : "no"} onChange={e => handleChange("showAdminBar", e.target.value === "yes")}>
                      <option value="yes">Show Toolbar when viewing site</option>
                      <option value="no">Hide Toolbar on frontend</option>
                    </select>
                  </div>
                </div>

                {colorInput("Header Background Color", "headerBackground")}
                {colorInput("Header Text Color", "headerTextColor")}
              </div>

              {/* Real-time Header Preview */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                  Live Header Preview ({form.headerStyle} • {form.headerHeight} • {form.stickyHeader ? "Sticky" : "Static"})
                </div>
                <div style={{
                  background: form.headerBackground,
                  height: form.headerHeight,
                  borderRadius: 8,
                  padding: "0 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: form.headerStyle === "glass" ? "0 8px 32px rgba(0,0,0,0.3)" : "none"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13 }}>★</div>
                    <span style={{ fontWeight: 800, color: form.headerTextColor, fontSize: 15 }}>CMS Portal</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: form.headerTextColor }}>
                    <span style={{ fontWeight: 700, color: form.primaryColor }}>Home</span>
                    <span style={{ opacity: 0.85 }}>Stories</span>
                    <span style={{ opacity: 0.85 }}>Videos</span>
                    <span style={{ opacity: 0.85 }}>Galleries</span>
                  </div>
                  <button type="button" style={{ background: form.buttonBackground, color: form.buttonTextColor, border: "none", borderRadius: form.buttonBorderRadius, padding: "6px 14px", fontSize: 12, fontWeight: 600 }}>
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FOOTER */}
          {activeTab === "footer" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "24px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 18px", color: "var(--text-main)" }}>Footer Layout & Palette</h3>
                <div style={{ marginBottom: 20 }}>
                  <label className="form-label">Footer Layout Style</label>
                  <select className="form-input" value={form.footerStyle} onChange={e => handleChange("footerStyle", e.target.value)}>
                    <option value="standard">Standard Multi-column</option>
                    <option value="compact">Compact Single Row</option>
                    <option value="centered">Centered Branding</option>
                  </select>
                </div>

                {colorInput("Footer Background Color", "footerBackground")}
                {colorInput("Footer Text Color", "footerTextColor")}
              </div>

              {/* Real-time Footer Preview */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                  Live Footer Preview ({form.footerStyle})
                </div>
                <div style={{
                  background: form.footerBackground,
                  color: form.footerTextColor,
                  borderRadius: 8,
                  padding: form.footerStyle === "compact" ? "16px 20px" : form.footerStyle === "centered" ? "28px 20px" : "24px 20px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  textAlign: form.footerStyle === "centered" ? "center" : "left"
                }}>
                  {form.footerStyle === "compact" ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 13 }}>
                      <span style={{ fontWeight: 800, color: form.headingColor }}>CMS Portal</span>
                      <div style={{ display: "flex", gap: 16 }}>
                        <span>Stories</span>
                        <span>Videos</span>
                        <span>Galleries</span>
                        <span>About</span>
                      </div>
                      <span style={{ opacity: 0.75, fontSize: 12 }}>© 2026 CMS Portal.</span>
                    </div>
                  ) : form.footerStyle === "centered" ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontSize: 13 }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: form.headingColor }}>CMS Portal</span>
                      <p style={{ margin: 0, opacity: 0.8, maxWidth: 450, fontSize: 12 }}>Portable cross-platform content management system.</p>
                      <div style={{ display: "flex", gap: 16, margin: "6px 0" }}>
                        <span>Stories</span>
                        <span>Videos</span>
                        <span>Galleries</span>
                      </div>
                      <span style={{ opacity: 0.7, fontSize: 12, borderTop: "1px solid rgba(255,255,255,0.08)", width: "100%", paddingTop: 10 }}>© 2026 CMS Portal. All rights reserved.</span>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 20, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontWeight: 800, color: form.headingColor, marginBottom: 6 }}>CMS Portal</div>
                          <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>Multi-column portal footer presentation.</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: form.headingColor, marginBottom: 6 }}>Explore</div>
                          <div style={{ fontSize: 12, opacity: 0.8, display: "flex", flexDirection: "column", gap: 4 }}>
                            <span>Videos</span>
                            <span>Galleries</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: form.headingColor, marginBottom: 6 }}>Info</div>
                          <div style={{ fontSize: 12, opacity: 0.8, display: "flex", flexDirection: "column", gap: 4 }}>
                            <span>Privacy</span>
                            <span>Contact</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, fontSize: 11, opacity: 0.75, display: "flex", justifyContent: "space-between" }}>
                        <span>© 2026 CMS Portal.</span>
                        <span>Theme Options Active</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BUTTONS */}
          {activeTab === "buttons" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "24px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 18px", color: "var(--text-main)" }}>Buttons & UI Controls</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <label className="form-label">Border Radius</label>
                    <select className="form-input" value={form.buttonBorderRadius} onChange={e => handleChange("buttonBorderRadius", e.target.value)}>
                      <option value="4px">Subtle (4px)</option>
                      <option value="8px">Rounded (8px)</option>
                      <option value="12px">Smooth (12px)</option>
                      <option value="9999px">Pill / Fully Curved</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Button Style</label>
                    <select className="form-input" value={form.buttonStyle} onChange={e => handleChange("buttonStyle", e.target.value)}>
                      <option value="solid">Solid Color</option>
                      <option value="gradient">Accent Gradient</option>
                      <option value="glow">Subtle Glow</option>
                    </select>
                  </div>
                </div>

                {colorInput("Primary Button Background", "buttonBackground")}
                {colorInput("Primary Button Text Color", "buttonTextColor")}
              </div>

              {/* Real-time Buttons Preview */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
                  Live Buttons Preview ({form.buttonStyle} • radius: {form.buttonBorderRadius})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, padding: "16px", background: "var(--bg-main)", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                  <button
                    type="button"
                    style={{
                      background: form.buttonStyle === "gradient" ? `linear-gradient(135deg, ${form.buttonBackground}, ${form.accentColor})` : form.buttonBackground,
                      color: form.buttonTextColor,
                      borderRadius: form.buttonBorderRadius,
                      border: "none",
                      padding: "10px 22px",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: form.buttonStyle === "glow" ? `0 0 16px ${form.buttonBackground}88` : `0 2px 8px ${form.buttonBackground}44`
                    }}
                  >
                    Primary Button
                  </button>

                  <button
                    type="button"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "var(--text-primary)",
                      borderRadius: form.buttonBorderRadius,
                      border: "1px solid var(--border-color)",
                      padding: "10px 20px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Secondary Button
                  </button>

                  <button
                    type="button"
                    style={{
                      background: "transparent",
                      color: form.linkColor,
                      borderRadius: form.buttonBorderRadius,
                      border: `1px solid ${form.buttonBackground}`,
                      padding: "10px 20px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Outlined Button
                  </button>

                  <button
                    type="button"
                    style={{
                      background: form.buttonBackground,
                      color: form.buttonTextColor,
                      borderRadius: form.buttonBorderRadius,
                      border: "none",
                      padding: "6px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Small Button
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LIVE PREVIEW */}
          {activeTab === "preview" && (
            <div style={{ background: form.backgroundColor, color: form.textColor, border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden" }}>
              {/* Header Preview */}
              <div style={{ background: form.headerBackground, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: form.headingColor }}>
                  CMS <span style={{ color: form.primaryColor }}>Portal</span>
                </span>
                <div style={{ display: "flex", gap: 16, fontSize: 13, color: form.headerTextColor }}>
                  <span>Home</span>
                  <span>About Us ▼</span>
                  <span>Videos</span>
                  <span>Galleries</span>
                </div>
              </div>

              {/* Body Preview */}
              <div style={{ padding: "36px 24px" }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: form.headingColor, margin: "0 0 12px" }}>
                  Interactive Theme Demonstration
                </h2>
                <p style={{ fontSize: form.baseFontSize, color: form.textColor, maxWidth: 640, lineHeight: 1.6, margin: "0 0 20px" }}>
                  This live preview box dynamically showcases your current Theme Options. All headings, buttons, and links immediately reflect the configured palette tokens.
                </p>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                  <button
                    type="button"
                    style={{
                      background: form.buttonBackground,
                      color: form.buttonTextColor,
                      borderRadius: form.buttonBorderRadius,
                      border: "none",
                      padding: "10px 22px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    style={{
                      background: "transparent",
                      color: form.linkColor,
                      borderRadius: form.buttonBorderRadius,
                      border: `1px solid ${form.primaryColor}`,
                      padding: "10px 20px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Outlined Button
                  </button>
                  <a href="#demo" onClick={e => e.preventDefault()} style={{ color: form.linkColor, display: "flex", alignItems: "center", fontSize: 14 }}>
                    Sample Link →
                  </a>
                </div>
              </div>

              {/* Footer Preview */}
              <div style={{ background: form.footerBackground, color: form.footerTextColor, padding: "20px 24px", fontSize: 12, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between" }}>
                <span>© 2026 CMS Portal. All Rights Reserved.</span>
                <span>Powered by WordPress-Like Dynamic Engine</span>
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28 }}>
            <button
              type="button"
              onClick={fetchTheme}
              className="button button-neutral"
              disabled={saving}
            >
              Reset to Saved
            </button>
            <button
              type="submit"
              disabled={saving}
              className="button button-primary"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px" }}
            >
              {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              {saving ? "Saving..." : "Save Theme Options"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ThemeOptions;
