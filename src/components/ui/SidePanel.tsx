import { ReactNode } from 'react';

interface SidePanelProps {
  title: string;
  children: ReactNode;
}

const SidePanel = ({ title, children }: SidePanelProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">{title}</h2>
      <div className="overflow-y-auto h-[calc(100%-3rem)]">
        {children}
      </div>
    </div>
  );
};

export default SidePanel;
