import React from "react";
import { Box, Text } from "ink";
import type { SyncResult } from "../types/index.js";

interface SyncReportProps {
  results: SyncResult[];
}

export default function SyncReport({ results }: SyncReportProps) {
  if (results.length === 0) {
    return <Text dimColor>Nothing to sync.</Text>;
  }

  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  return (
    <Box flexDirection="column">
      {successes.length > 0 ? (
        <Box flexDirection="column">
          <Text color="green" bold>
            Synced ({successes.length}):
          </Text>
          {successes.map((r) => (
            <Text key={`${r.entryId}-${r.target}`} color="green">
              {"  "}
              {r.ticket} → {r.target}
            </Text>
          ))}
        </Box>
      ) : null}
      {failures.length > 0 ? (
        <Box flexDirection="column" marginTop={successes.length > 0 ? 1 : 0}>
          <Text color="red" bold>
            Failed ({failures.length}):
          </Text>
          {failures.map((r) => (
            <Text key={`${r.entryId}-${r.target}`} color="red">
              {"  "}
              {r.ticket} → {r.target}: {r.error}
            </Text>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
