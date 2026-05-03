import React from 'react';
import { Sliders, Save } from '../../../components/icons';

export interface IEditorSettings {
  autoFitOnRun: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  compactOutput: boolean;
  darkMode: boolean;
}

interface SettingsViewProps {
  settings: IEditorSettings;
  onToggle: (key: keyof IEditorSettings) => void;
  onSave?: () => void;
}

const settingsMeta: Array<{ key: keyof IEditorSettings; label: string; description: string }> = [
  {
    key: 'autoFitOnRun',
    label: 'Auto Fit On Run',
    description: 'Automatically fit graph into viewport when running a workflow.',
  },
  {
    key: 'showGrid',
    label: 'Show Grid Background',
    description: 'Display background grid inside canvas for orientation.',
  },
  {
    key: 'snapToGrid',
    label: 'Snap To Grid',
    description: 'Snap node movement to grid steps for cleaner alignment.',
  },
  {
    key: 'compactOutput',
    label: 'Compact Output Overlay',
    description: 'Keep execution output collapsed by default.',
  },
  {
    key: 'darkMode',
    label: 'Dark Mode',
    description: 'Switch the full editor to dark appearance.',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onToggle, onSave }) => {
  return (
    <div className="page-shell">
      <div className="page-head">
        <div>
          <h2>Settings</h2>
          <p>Personalize editor behavior for your workflow building style.</p>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-title">
          <Sliders size={18} strokeWidth={2.2} />
          <h3>Editor Preferences</h3>
        </div>

        <div className="settings-list">
          {settingsMeta.map(item => (
            <div key={item.key} className="settings-item">
              <div>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </div>
              <label className="switch">
                <input type="checkbox" checked={settings[item.key]} onChange={() => onToggle(item.key)} />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" type="button" onClick={onSave}>
          <Save size={16} strokeWidth={2.2} /> Save Preferences
        </button>
      </div>
    </div>
  );
};
