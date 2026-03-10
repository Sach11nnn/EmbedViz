"use client"

import { useEmbedViz, EmbedVizProvider } from "@/components/embedviz-context"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Header } from "@/components/header"
import { CodeEditor } from "@/components/code-editor"
import { PinStates } from "@/components/pin-states"
import { SerialMonitor } from "@/components/serial-monitor"
import { ControlFlow } from "@/components/control-flow"
import { SensorGraph } from "@/components/sensor-graph"
import { MemoryGauge } from "@/components/memory-gauge"

function AppContent() {
  const { theme } = useEmbedViz()
  const isDark = theme === "dark"
  const border = isDark ? "#1c2530" : "#d0d8e4"
  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden" style={{ background: isDark ? "#0a0e14" : "#f0f4f8" }}>
      <Header />
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={65} minSize={35}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={35} minSize={25}>
              <div className="h-full" style={{ borderRight: `1px solid ${border}` }}><CodeEditor /></div>
            </ResizablePanel>
            <ResizableHandle style={{ background: border }} />
            <ResizablePanel defaultSize={35} minSize={15}>
              <div className="h-full" style={{ borderRight: `1px solid ${border}` }}><ControlFlow /></div>
            </ResizablePanel>
            <ResizableHandle style={{ background: border }} />
            <ResizablePanel defaultSize={30} minSize={20}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={60} minSize={30}>
                  <div className="h-full" style={{ borderBottom: `1px solid ${border}` }}><PinStates /></div>
                </ResizablePanel>
                <ResizableHandle style={{ background: border }} />
                <ResizablePanel defaultSize={40} minSize={25}><MemoryGauge /></ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle style={{ background: border }} />
        <ResizablePanel defaultSize={35} minSize={20}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full" style={{ borderRight: `1px solid ${border}` }}><SerialMonitor /></div>
            </ResizablePanel>
            <ResizableHandle style={{ background: border }} />
            <ResizablePanel defaultSize={50} minSize={30}><SensorGraph /></ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default function AppPage() {
  return (
    <EmbedVizProvider>
      <AppContent />
    </EmbedVizProvider>
  )
}