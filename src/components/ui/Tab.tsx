"use client";

import { ReactNode, useState } from "react";

interface TabItem {
  key: string;
  label: string;
  component: ReactNode;
  badge?: number;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
  onChange?: (key: string) => void;
}

export default function Tabs({
  items,
  defaultActiveKey,
  className = "",
  tabClassName = "py-2 px-4 w-[50vw] font-medium",
  activeTabClassName = "text-mainText B1_SB_15 border-b-2 border-mainText",
  inactiveTabClassName = "text-subText2 B1_MD_15 hover:text-main",
  onChange,
}: TabsProps) {
  const [activeKey, setActiveKey] = useState(
    defaultActiveKey || items[0]?.key || ""
  );

  const activeTab = items.find((tab) => tab.key === activeKey) || items[0];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="sticky top-0 z-10 bg-white">
        <div role="tablist" aria-label="탭 메뉴" className="flex border-b w-full">
          {items.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <button
                key={item.key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${item.key}-panel`}
                id={`${item.key}-tab`}
                onClick={() => {
                  setActiveKey(item.key);
                  onChange?.(item.key);
                }}
                className={`${tabClassName} ${
                  isActive ? activeTabClassName : inactiveTabClassName
                }`}
              >
                {item.label}
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`${activeKey}-panel`}
        role="tabpanel"
        aria-labelledby={`${activeKey}-tab`}
        className="flex-1 overflow-y-auto"
      >
        {activeTab?.component}
      </div>
    </div>
  );
}

// Example usage:
/*
<Tabs
  items={[
    {
      key: "upcoming",
      label: "다가오는 예약",
      component: <UpcomingReservations />,
      badge: upcomingCount,
    },
    {
      key: "past", 
      label: "지난 예약",
      component: <PastReservations />,
    },
  ]}
/>
*/
