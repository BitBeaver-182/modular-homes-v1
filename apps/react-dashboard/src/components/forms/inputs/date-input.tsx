"use client"

import {
  addDays,
  format,
  startOfDay,
  subDays,
  subMonths,
  subYears,
} from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatYmdLocal, parseYmdLocal } from "@/lib/date-ymd"
import { getDateFnsLocale } from "@/lib/i18n/date-fns-locale"
import { cn } from "@/lib/utilities"

import type { TFunction } from "i18next"
import type { Matcher } from "react-day-picker"

export type DatePresetKind =
  | "today"
  | "yesterday"
  | "lastWeek"
  | "lastMonth"
  | "lastYear"

/** Builtin relative presets, or `{ offsetDays }` added to start of today (positive future, negative past). */
export type DatePreset =
  | { kind: DatePresetKind; label?: string }
  | { offsetDays: number; label?: string }

const DEFAULT_PRESETS: Array<DatePreset> = [
  { kind: "today" },
  { kind: "yesterday" },
  { kind: "lastWeek" },
  { kind: "lastMonth" },
  { kind: "lastYear" },
]

type DateInputProps = {
  id: string
  defaultValue: string
  placeholder: string
  disabled: boolean
  invalid: boolean
  name: string
  showPresets?: boolean
  presets?: Array<DatePreset>
  /** Disables matching days in the calendar. Omit for no restriction. */
  calendarDisabled?: Matcher | Array<Matcher>
  /** When set, the date is controlled (YYYY-MM-DD). */
  valueYmd?: string
  /** Called when the selected calendar date changes (YYYY-MM-DD or empty). */
  onYmdChange?: (ymd: string) => void
  /** Renders only the calendar content, without trigger/popover. */
  inline?: boolean
} & Partial<Pick<React.ComponentProps<typeof Calendar>, "defaultMonth" | "showWeekNumber">>

function presetKey(preset: DatePreset, index: number): string {
  if ("kind" in preset) {return `${preset.kind}-${index}`}
  return `o${preset.offsetDays}-${index}`
}

function resolveDateFromPreset(preset: DatePreset): Date {
  const anchor = startOfDay(new Date())
  if ("kind" in preset) {
    switch (preset.kind) {
      case "today":
        return anchor
      case "yesterday":
        return subDays(anchor, 1)
      case "lastWeek":
        return subDays(anchor, 7)
      case "lastMonth":
        return subMonths(anchor, 1)
      case "lastYear":
        return subYears(anchor, 1)
    }
  }
  return addDays(anchor, preset.offsetDays)
}

function resolvePresetLabel(preset: DatePreset, t: TFunction): string {
  if (preset.label) {return preset.label}
  if ("kind" in preset) {
    switch (preset.kind) {
      case "today":
        return t("dateInput.presetToday")
      case "yesterday":
        return t("dateInput.presetYesterday")
      case "lastWeek":
        return t("dateInput.presetLastWeek")
      case "lastMonth":
        return t("dateInput.presetLastMonth")
      case "lastYear":
        return t("dateInput.presetLastYear")
    }
  }
  const { offsetDays } = preset
  if (offsetDays === 0) {return t("dateInput.presetToday")}
  if (offsetDays > 0) {return t("dateInput.presetInDays", { count: offsetDays })}
  return t("dateInput.presetDaysAgo", { count: -offsetDays })
}

export const DateInput = ({
  id,
  defaultValue,
  placeholder,
  disabled,
  invalid,
  name,
  defaultMonth,
  showPresets = true,
  presets,
  calendarDisabled,
  showWeekNumber = false,
  valueYmd,
  onYmdChange,
  inline = false,
}: DateInputProps) => {
  const { t, i18n } = useTranslation()
  const dfLocale = getDateFnsLocale(i18n.language?.split("-")[0] ?? "en")

  const isControlled = valueYmd !== undefined

  const initialYmd = isControlled ? String(valueYmd ?? "") : defaultValue

  const [month, setMonth] = useState<Date>(() => {
    const parsed = parseYmdLocal(initialYmd.trim())
    if (parsed) {return parsed}
    if (defaultMonth) {return defaultMonth}
    return startOfDay(new Date())
  })

  const [date, setDate] = useState<Date | undefined>(() => {
    const parsed = parseYmdLocal(initialYmd.trim())
    return parsed ?? undefined
  })

  useEffect(() => {
    const raw = isControlled ? String(valueYmd ?? "") : defaultValue
    const parsed = parseYmdLocal(raw.trim())
    setDate(parsed ?? undefined)
    if (parsed) {setMonth(parsed)}
  }, [isControlled, valueYmd, defaultValue])

  const resolvedPresets = useMemo((): Array<DatePreset> => {
    if (presets?.length) {return presets}
    return DEFAULT_PRESETS
  }, [presets])

  const handleCalendarSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
      setMonth(newDate)
      onYmdChange?.(formatYmdLocal(newDate))
    } else {
      setDate(undefined)
      onYmdChange?.("")
    }
  }

  const internalPlaceholder = useMemo(() => {
    return placeholder || t("dateInput.placeholder")
  }, [placeholder, t])

  const hiddenValue = date ? formatYmdLocal(date) : ""

  const applyPreset = (preset: DatePreset) => {
    const next = resolveDateFromPreset(preset)
    setDate(next)
    setMonth(next)
    onYmdChange?.(formatYmdLocal(next))
  }

  return (
    <>
      {name ? (
        <input readOnly name={name} type="hidden" value={hiddenValue} />
      ) : null}
      {inline ? (
        <Card className="shadow-none ring-0 p-0">
          <CardContent className="p-0">
            <div className="flex max-sm:flex-col">
              {showPresets ? (
                <div className="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
                  <div className="flex h-full flex-col border-e px-2">
                    {resolvedPresets.map((preset, index) => (
                      <Button
                        key={presetKey(preset, index)}
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => { applyPreset(preset); }}
                      >
                        {resolvePresetLabel(preset, t)}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
              <Calendar
                {...(calendarDisabled !== undefined
                  ? { disabled: calendarDisabled }
                  : {})}
                captionLayout="dropdown"
                defaultMonth={defaultMonth}
                locale={dfLocale}
                mode="single"
                month={month}
                selected={date}
                showWeekNumber={showWeekNumber}
                onMonthChange={setMonth}
                onSelect={handleCalendarSelect}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              aria-invalid={invalid}
              className="group/pick-date w-60 justify-between"
              disabled={disabled}
              id={id}
              type="button"
              variant="outline"
            >
              <span
                className={cn("truncate", !date && "text-muted-foreground")}
              >
                {date
                  ? format(date, "LLL dd, y", { locale: dfLocale })
                  : internalPlaceholder}
              </span>
              <CalendarIcon
                aria-hidden="true"
                className="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Card className="p-0">
              <CardContent className="p-0">
                <div className="flex max-sm:flex-col">
                  {showPresets ? (
                    <div className="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
                      <div className="flex h-full flex-col border-e px-2">
                        {resolvedPresets.map((preset, index) => (
                          <Button
                            key={presetKey(preset, index)}
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={() => { applyPreset(preset); }}
                          >
                            {resolvePresetLabel(preset, t)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <Calendar
                    {...(calendarDisabled !== undefined
                      ? { disabled: calendarDisabled }
                      : {})}
                    captionLayout="dropdown"
                    defaultMonth={defaultMonth}
                    locale={dfLocale}
                    mode="single"
                    month={month}
                    selected={date}
                    showWeekNumber={showWeekNumber}
                    onMonthChange={setMonth}
                    onSelect={handleCalendarSelect}
                  />
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      )}
    </>
  )
}
