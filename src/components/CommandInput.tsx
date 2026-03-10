import { useState, useRef, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

interface CommandInputProps {
  onSubmit: (value: string) => void;
  isActive: boolean;
}

export default function CommandInput({
  onSubmit,
  isActive,
}: CommandInputProps) {
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);

  const handleSubmit = useCallback(
    (val: string) => {
      if (val.trim()) {
        history.current.unshift(val.trim());
        historyIndex.current = -1;
        onSubmit(val.trim());
      }
      setValue("");
    },
    [onSubmit],
  );

  useInput(
    (_input, key) => {
      if (key.upArrow && history.current.length > 0) {
        const nextIndex = Math.min(
          historyIndex.current + 1,
          history.current.length - 1,
        );
        historyIndex.current = nextIndex;
        setValue(history.current[nextIndex]);
      } else if (key.downArrow) {
        const nextIndex = historyIndex.current - 1;
        if (nextIndex < 0) {
          historyIndex.current = -1;
          setValue("");
        } else {
          historyIndex.current = nextIndex;
          setValue(history.current[nextIndex]);
        }
      }
    },
    { isActive },
  );

  return (
    <Box>
      <Text color="green" bold>
        {"❯ "}
      </Text>
      {isActive ? (
        <TextInput value={value} onChange={setValue} onSubmit={handleSubmit} />
      ) : (
        <Text dimColor>waiting...</Text>
      )}
    </Box>
  );
}
