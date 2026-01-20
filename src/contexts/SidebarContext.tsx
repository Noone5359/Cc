import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SidebarContextType {
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    sidebarHovering: boolean;
    setSidebarOpen: (open: boolean) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setSidebarHovering: (hovering: boolean) => void;
    isSidebarExpanded: boolean; // true when sidebar takes space (not collapsed or hovering)
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = (): SidebarContextType => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};

interface SidebarProviderProps {
    children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const [sidebarHovering, setSidebarHovering] = useState(false);

    // Sidebar is "expanded" (takes layout space) when not collapsed OR when hovering
    const isSidebarExpanded = !sidebarCollapsed || sidebarHovering;

    const handleSetSidebarOpen = useCallback((open: boolean) => {
        setSidebarOpen(open);
    }, []);

    const handleSetSidebarCollapsed = useCallback((collapsed: boolean) => {
        setSidebarCollapsed(collapsed);
    }, []);

    const handleSetSidebarHovering = useCallback((hovering: boolean) => {
        setSidebarHovering(hovering);
    }, []);

    return (
        <SidebarContext.Provider
            value={{
                sidebarOpen,
                sidebarCollapsed,
                sidebarHovering,
                setSidebarOpen: handleSetSidebarOpen,
                setSidebarCollapsed: handleSetSidebarCollapsed,
                setSidebarHovering: handleSetSidebarHovering,
                isSidebarExpanded,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
};
