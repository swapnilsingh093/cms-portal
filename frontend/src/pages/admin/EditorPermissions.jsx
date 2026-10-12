import React, { useState, useEffect } from "react";
import { userAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Shield,
  User,
  Users,
  Check,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  Eye,
  FileText,
  Pin,
  Film,
  Image as ImageIcon,
  HardDrive,
  Menu,
  Palette,
  Settings,
  Sparkles
} from "lucide-react";

const MODULES = [
  { key: "posts", label: "Posts & Stories", icon: Pin, desc: "Articles, blogs, categories, and tags" },
  { key: "pages", label: "Pages", icon: FileText, desc: "Static and templated pages" },
  { key: "videos", label: "Videos", icon: Film, desc: "Video uploads, streaming links, and categories" },
  { key: "galleries", label: "Galleries", icon: ImageIcon, desc: "Photo collections and image albums" },
  { key: "media", label: "Media Library", icon: HardDrive, desc: "Direct file uploads, documents, and media browser" },
  { key: "menus", label: "Menus & Navigation", icon: Menu, desc: "Header/Footer hierarchy, drag-and-drop navigation" },
  { key: "theme", label: "Theme Options", icon: Palette, desc: "Visual colors, typography, header and footer styling" },
  { key: "settings", label: "System Settings", icon: Settings, desc: "General configuration and site preferences" }
];

const ACTIONS = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" }
];

const EditorPermissions = () => {
  const { user: currentAdmin } = useAuth();
  const [editors, setEditors] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll();
      const allUsers = res.users || [];
      const editorList = allUsers.filter(u => u.role === "editor");
      setEditors(editorList);

      if (editorList.length > 0) {
        selectUser(editorList[0]);
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (u) => {
    setSelectedUser(u);
    // Build initial permissions map
    const perms = {};
    MODULES.forEach(mod => {
      const userModPerm = u.permissions?.[mod.key] || {};
      perms[mod.key] = {
        view: !!userModPerm.view,
        create: !!userModPerm.create,
        edit: !!userModPerm.edit,
        delete: !!userModPerm.delete
      };
    });
    setPermissions(perms);
  };

  const handleToggleModule = (modKey, enabled) => {
    setPermissions(prev => ({
      ...prev,
      [modKey]: {
        view: enabled,
        create: enabled,
        edit: enabled,
        delete: enabled
      }
    }));
  };

  const handleToggleAction = (modKey, actionKey, checked) => {
    setPermissions(prev => {
      const mod = { ...(prev[modKey] || {}) };
      mod[actionKey] = checked;
      // If any write action is enabled, view must automatically be enabled
      if (checked && actionKey !== "view") {
        mod.view = true;
      }
      // If view is disabled, all write actions must automatically be disabled
      if (!checked && actionKey === "view") {
        mod.create = false;
        mod.edit = false;
        mod.delete = false;
      }
      return { ...prev, [modKey]: mod };
    });
  };

  const applyPreset = (presetType) => {
    const newPerms = {};
    MODULES.forEach(mod => {
      if (presetType === "posts_only") {
        const isPost = mod.key === "posts";
        newPerms[mod.key] = { view: isPost, create: isPost, edit: isPost, delete: isPost };
      } else if (presetType === "content_only") {
        const isContent = ["posts", "pages", "videos", "galleries", "media"].includes(mod.key);
        newPerms[mod.key] = { view: isContent, create: isContent, edit: isContent, delete: isContent };
      } else if (presetType === "all") {
        newPerms[mod.key] = { view: true, create: true, edit: true, delete: true };
      }
    });
    setPermissions(newPerms);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await userAPI.update(selectedUser._id, { permissions });
      setMessage({
        type: "success",
        text: `Permissions successfully saved for ${selectedUser.name}! Only permitted modules will be visible in their dashboard.`
      });
      // Refresh user list
      const res = await userAPI.getAll();
      const editorList = (res.users || []).filter(u => u.role === "editor");
      setEditors(editorList);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Error saving permissions" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10, color: "var(--text-primary)" }}>
            <Shield size={24} color="#60a5fa" /> Editor Role & Module Permissions
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
            Super Admin Control Center: Choose which admin modules and capabilities are visible when an Editor logs in.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !selectedUser}
          className="button button-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px" }}
        >
          {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Save Permissions"}
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

      {loading ? (
        <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
          <Loader2 size={28} className="spin" /> Loading editors...
        </div>
      ) : editors.length === 0 ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: 40, textAlign: "center" }}>
          <Users size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "var(--text-primary)" }}>No Editor Accounts Found</h3>
          <p style={{ margin: "0 0 16px", color: "var(--text-muted)", fontSize: 14 }}>
            Create or assign an Editor role to a user in the User Management section to manage their module permissions.
          </p>
          <a href="/admin/users" className="button button-primary">Go to User Management</a>
        </div>
      ) : (
        <div>
          {/* User Selector Bar */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "18px 22px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                  Select Editor:
                </span>
                <select
                  value={selectedUser?._id || ""}
                  onChange={(e) => {
                    const found = editors.find(u => u._id === e.target.value);
                    if (found) selectUser(found);
                  }}
                  className="form-input"
                  style={{ minWidth: 260, fontSize: 14, fontWeight: 600 }}
                >
                  {editors.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Presets */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset("posts_only")}
                  className="button button-small button-neutral"
                  style={{ fontSize: 12 }}
                >
                  Default (Posts Only)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("content_only")}
                  className="button button-small button-neutral"
                  style={{ fontSize: 12 }}
                >
                  All Content Modules
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("all")}
                  className="button button-small button-neutral"
                  style={{ fontSize: 12 }}
                >
                  Full Access
                </button>
              </div>
            </div>
          </div>

          {/* Module Permission Matrix */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {MODULES.map(mod => {
              const Icon = mod.icon;
              const modPerms = permissions[mod.key] || { view: false, create: false, edit: false, delete: false };
              const isModuleVisible = !!modPerms.view;

              return (
                <div
                  key={mod.key}
                  style={{
                    background: isModuleVisible ? "var(--bg-card)" : "rgba(15, 23, 42, 0.4)",
                    border: isModuleVisible ? "1px solid var(--border-color)" : "1px dashed var(--border-subtle)",
                    borderRadius: 10,
                    padding: "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* Left: Module Details */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 260 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: isModuleVisible ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        color: isModuleVisible ? "#60a5fa" : "var(--text-dim)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: isModuleVisible ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {mod.label}
                        </h4>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 100,
                            background: isModuleVisible ? "var(--g-accent, rgba(16, 185, 129, 0.15))" : "rgba(239, 68, 68, 0.12)",
                            color: isModuleVisible ? "#34d399" : "#f87171"
                          }}
                        >
                          {isModuleVisible ? "Visible in Sidebar" : "Hidden"}
                        </span>
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                        {mod.desc}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions Checkboxes & Master Toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      {ACTIONS.map(action => (
                        <label
                          key={action.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            color: isModuleVisible ? "var(--text-secondary)" : "var(--text-dim)",
                            cursor: "pointer",
                            fontWeight: 500
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!modPerms[action.key]}
                            onChange={(e) => handleToggleAction(mod.key, action.key, e.target.checked)}
                            style={{ width: 16, height: 16, cursor: "pointer" }}
                          />
                          {action.label}
                        </label>
                      ))}
                    </div>

                    {/* Master Switch Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleModule(mod.key, !isModuleVisible)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "1px solid var(--border-color)",
                        background: isModuleVisible ? "rgba(239, 68, 68, 0.12)" : "rgba(59, 130, 246, 0.15)",
                        color: isModuleVisible ? "#f87171" : "#60a5fa",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      {isModuleVisible ? "Disable Module" : "Enable Module"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Bar */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28 }}>
            <button
              type="button"
              onClick={() => selectUser(selectedUser)}
              className="button button-neutral"
              disabled={saving}
            >
              Reset Changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedUser}
              className="button button-primary"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px" }}
            >
              {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              {saving ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPermissions;
