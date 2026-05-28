"use client";

import { useEffect, useState } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

function stripHttpsPrefix(value: string): string {
  return value.replace(/^https?:\/\//i, "");
}

type UrlInputProps = {
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
};

export function UrlInput({
  name,
  defaultValue = "",
  disabled = false,
  invalid = false,
  placeholder,
}: UrlInputProps) {
  const [value, setValue] = useState(stripHttpsPrefix(defaultValue));

  useEffect(() => {
    setValue(stripHttpsPrefix(defaultValue));
  }, [defaultValue]);

  const normalizedValue = value.trim() ? `https://${value.trim()}` : "";

  return (
    <>
      <input readOnly name={name} type="hidden" value={normalizedValue} />
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          aria-invalid={invalid}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(event) => { setValue(event.target.value); }}
        />
      </InputGroup>
    </>
  );
}
