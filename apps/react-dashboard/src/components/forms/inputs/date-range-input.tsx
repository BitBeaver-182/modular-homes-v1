"use client"

import { useId, useState } from "react"
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utilities"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

// ─── Preset types ────────────────────────────────────────────────────────────

export type DateRangePresetKind =
  | "today"
  | "yesterday"
  | "last7Days"
  | "last30Days"
  | "monthToDate"
  | "lastMonth"
  | "yearToDate"
  | "lastYear"

export type DateRangePreset =
  | { kind: DateRangePresetKind; label?: string }
  | { offsetDays: number; label?: string }

const DEFAULT_PRESETS: Array<DateRangePreset> = [
  { kind: "today" },
  { kind: "yesterday" },
  { kind: "last7Days" },
  { kind: "last30Days" },
  { kind: "monthToDate" },
  { kind: "lastMonth" },
  { kind: "yearToDate" },
  { kind: "lastYear" },
]

const DEFAULT_PRESET_LABELS: Record<DateRangePresetKind, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7Days: "Last 7 days",
  last30Days: "Last 30 days",
  monthToDate: "Month to date",
  lastMonth: "Last month",
  yearToDate: "Year to date",
  lastYear: "Last year",
}

function resolvePresetLabel(preset: DateRangePreset): string {
  if (preset.label) return preset.label
  if ("kind" in preset) return DEFAULT_PRESET_LABELS[preset.kind]
  const { offsetDays } = preset
  if (offsetDays === 0) return "Today"
  if (offsetDays > 0) return `In ${offsetDays} days`
  return `${-offsetDays} days ago`
}

function resolveRange(preset: DateRangePreset, today: Date): DateRange {
  if ("offsetDays" in preset) {
    const d = subDays(today, -preset.offsetDays)
    return { from: d, to: d }
  }
  switch (preset.kind) {
    case "today":
      return { from: today, to: today }
    case "yesterday": {
      const d = subDays(today, 1)
      return { from: d, to: d }
    }
    case "last7Days":
      return { from: subDays(today, 6), to: today }
    case "last30Days":
      return { from: subDays(today, 29), to: today }
    case "monthToDate":
      return { from: startOfMonth(today), to: today }
    case "lastMonth":
      return {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1)),
      }
    case "yearToDate":
      return { from: startOfYear(today), to: today }
    case "lastYear":
      return {
        from: startOfYear(subYears(today, 1)),
        to: endOfYear(subYears(today, 1)),
      }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export type DateRangeValue = DateRange | undefined

export type DateRangeInputProps = {
  /** Controlled value */
  value?: DateRangeValue
  /** Default value when uncontrolled */
  defaultValue?: DateRangeValue
  /** Called whenever the selected range changes */
  onChange?: (range: DateRangeValue) => void
  placeholder?: string
  /** Show the preset sidebar. Defaults to true. */
  showPresets?: boolean
  presets?: Array<DateRangePreset>
  /** Disable days after today. Defaults to true. */
  disableFuture?: boolean
  className?: string
  /** Replaces the default trigger button. Receives formatted label + open state. */
  trigger?: React.ReactNode
  /** Align the popover. Defaults to "start". */
  align?: React.ComponentProps<typeof PopoverContent>["align"]
  /** Renders only the calendar card, without trigger/popover. */
  inline?: boolean
}

export function DateRangeInput({
  value,
  defaultValue,
  onChange,
  placeholder = "Pick a date range",
  showPresets = true,
  presets = DEFAULT_PRESETS,
  disableFuture = true,
  className,
  trigger,
  align = "start",
  inline = false,
}: DateRangeInputProps) {
  const id = useId()
  const today = new Date()

  const isControlled = value !== undefined

  const [internalRange, setInternalRange] = useState<DateRangeValue>(
    defaultValue
  )

  const range = isControlled ? value : internalRange

  const [month, setMonth] = useState<Date>(
    range?.to ?? range?.from ?? today
  )

  const handleRangeChange = (newRange: DateRangeValue) => {
    if (!isControlled) setInternalRange(newRange)
    onChange?.(newRange)
  }

  const applyPreset = (preset: DateRangePreset) => {
    const resolved = resolveRange(preset, today)
    handleRangeChange(resolved)
    setMonth(resolved.to ?? resolved.from ?? today)
  }

  const label =
    range?.from
      ? range.to
        ? `${format(range.from, "LLL dd, y")} – ${format(range.to, "LLL dd, y")}`
        : format(range.from, "LLL dd, y")
      : placeholder

  const defaultTrigger = (
    <Button
      className={cn("group/pick-date w-60 justify-between", className)}
      id={id}
      type="button"
      variant="outline"
    >
      <span className={cn("truncate", !range?.from && "text-muted-foreground")}>
        {label}
      </span>
      <CalendarIcon
        aria-hidden="true"
        className="text-muted-foreground/80 group-hover/pick-date:text-foreground shrink-0 transition-colors"
      />
    </Button>
  )

  const calendarContent = (
    <Card
      className={cn(
        "p-0",
        inline && "shadow-none ring-0",
      )}
    >
      <CardContent className="p-0">
        <div className="flex max-sm:flex-col">
          {showPresets && (
            <div className="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
              <div className="flex h-full flex-col border-e px-2">
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    className="w-full justify-start"
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => { applyPreset(preset); }}
                  >
                    {resolvePresetLabel(preset)}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Calendar
            mode="range"
            month={month}
            selected={range}
            onMonthChange={setMonth}
            onSelect={(r) => {
              if (r) handleRangeChange(r)
            }}
            {...(disableFuture ? { disabled: [{ after: today }] } : {})}
          />
        </div>
      </CardContent>
    </Card>
  )

  if (inline) {
    return calendarContent
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger ?? defaultTrigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-0">
        {calendarContent}
      </PopoverContent>
    </Popover>
  )
}
