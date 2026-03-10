import { describe, it, expect } from "vitest";
import { parseCommand } from "../commands/parser.js";

describe("parseCommand", () => {
  it("returns null for non-command input", () => {
    expect(parseCommand("hello")).toBeNull();
    expect(parseCommand("")).toBeNull();
    expect(parseCommand("  ")).toBeNull();
  });

  it("parses simple command", () => {
    expect(parseCommand("/help")).toEqual({
      command: "help",
      subcommand: null,
      args: "",
    });
  });

  it("parses command with args", () => {
    expect(parseCommand("/start TICK-1 some description")).toEqual({
      command: "start",
      subcommand: null,
      args: "TICK-1 some description",
    });
  });

  it("parses command with subcommand", () => {
    expect(parseCommand("/stop:discard")).toEqual({
      command: "stop",
      subcommand: "discard",
      args: "",
    });
  });

  it("parses command with subcommand and args", () => {
    expect(parseCommand("/history:week extra")).toEqual({
      command: "history",
      subcommand: "week",
      args: "extra",
    });
  });

  it("parses /history with date arg", () => {
    expect(parseCommand("/history 2026-03-10")).toEqual({
      command: "history",
      subcommand: null,
      args: "2026-03-10",
    });
  });

  it("lowercases command", () => {
    expect(parseCommand("/HELP")).toEqual({
      command: "help",
      subcommand: null,
      args: "",
    });
  });

  it("trims whitespace", () => {
    expect(parseCommand("  /help  ")).toEqual({
      command: "help",
      subcommand: null,
      args: "",
    });
  });
});
