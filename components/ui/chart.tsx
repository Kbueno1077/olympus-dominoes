"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-[rgb(var(--text-muted))] [&_.recharts-cartesian-grid_line]:stroke-[rgb(var(--border))] [&_.recharts-curve.recharts-tooltip-cursor]:stroke-[rgb(var(--border))] [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[rgb(var(--bone-300)/0.45)] [&_.recharts-layer]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(
    ([, item]) => item.color
  );

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorConfig
          .map(([key, item]) => `  --color-${key}: ${item.color};`)
          .join("\n")}\n}`,
      }}
    />
  );
}

export function ChartTooltip(
  props: React.ComponentProps<typeof RechartsPrimitive.Tooltip>
) {
  return <RechartsPrimitive.Tooltip {...props} />;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    dataKey?: string | number;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  className?: string;
  hideLabel?: boolean;
  formatter?: (
    value: number | string,
    name: string
  ) => React.ReactNode;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!hideLabel && label ? (
        <div className="font-medium text-[rgb(var(--text))]">{label}</div>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "value");
          const itemConfig = config[key];
          const displayName = itemConfig?.label ?? item.name ?? key;
          const value =
            formatter && item.value != null
              ? formatter(item.value, String(displayName))
              : item.value;

          return (
            <div
              key={key}
              className="flex w-full items-center justify-between gap-4"
            >
              <div className="flex items-center gap-1.5 text-[rgb(var(--text-muted))]">
                <span
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor:
                      item.color || itemConfig?.color || "rgb(var(--primary))",
                  }}
                />
                {displayName}
              </div>
              <span className="font-mono font-medium tabular-nums text-[rgb(var(--text))]">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { RechartsPrimitive };
