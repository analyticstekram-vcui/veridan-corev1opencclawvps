import React, { useState } from 'react';
import TopToolbar from '../components/terminal/TopToolbar';
import LeftIconRail from '../components/terminal/LeftIconRail';
import CommandConsole from '../components/terminal/CommandConsole';
import InspectorPanel from '../components/terminal/InspectorPanel';
import LogDrawer from '../components/terminal/LogDrawer';

export default function Dashboard() {
  const [mode, setMode] = useState('auto');
  const [activeModule, setActiveModule] = useState('command');
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [logsCollapsed, setLogsCollapsed] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Toolbar */}
      <TopToolbar
        mode={mode}
        onModeToggle={() => setMode(m => m === 'auto' ? 'manual' : 'auto')}
      />

      {/* Main Body */}
      <div className="flex-1 flex min-h-0">
        {/* Left Icon Rail */}
        <LeftIconRail
          activeModule={activeModule}
          onModuleChange={setActiveModule}
        />

        {/* Center + Right + Bottom */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Center + Right */}
          <div className="flex-1 flex min-h-0">
            {/* Center Workspace */}
            <div className="flex-1 min-w-0">
              <CommandConsole />
            </div>

            {/* Right Inspector */}
            <InspectorPanel
              collapsed={inspectorCollapsed}
              onToggle={() => setInspectorCollapsed(c => !c)}
            />
          </div>

          {/* Bottom Log Drawer */}
          <LogDrawer
            collapsed={logsCollapsed}
            onToggle={() => setLogsCollapsed(c => !c)}
          />
        </div>
      </div>
    </div>
  );
}