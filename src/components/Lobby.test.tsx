/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Lobby from "./Lobby";
import {
  clientGameState,
  clientPlayer,
  createMockSocket,
  lobbyRoom,
} from "@/test/fixtures";

describe("Lobby", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the menu view by default", () => {
    const socket = createMockSocket();
    render(<Lobby socket={socket} waitingState={null} />);

    expect(screen.getByRole("heading", { name: "Mendicot" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Room" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse open rooms" })).toBeInTheDocument();
  });

  it("requires a name before creating a room", async () => {
    const user = userEvent.setup();
    const socket = createMockSocket();
    render(<Lobby socket={socket} waitingState={null} />);

    await user.click(screen.getAllByRole("button", { name: "Create Room" })[0]);

    expect(screen.getByRole("alert")).toHaveTextContent("Enter your name");
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it("emits create_room when name is provided", async () => {
    const user = userEvent.setup();
    const socket = createMockSocket();
    render(<Lobby socket={socket} waitingState={null} />);

    const nameInput = screen.getByLabelText(/your name/i);
    fireEvent.change(nameInput, { target: { value: "Alice" } });
    await user.click(screen.getAllByRole("button", { name: "Create Room" })[0]);

    expect(socket.emit).toHaveBeenCalledWith("create_room", "Alice");
    expect(localStorage.getItem("ethnogames_name:v1")).toBe("Alice");
  });

  it("requires a room code to join from the menu", async () => {
    const user = userEvent.setup();
    const socket = createMockSocket();
    render(<Lobby socket={socket} waitingState={null} />);

    await user.type(screen.getByLabelText(/your name/i), "Bob");
    await user.click(screen.getAllByRole("button", { name: "Join" })[0]);

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a room code");
    expect(socket.emit).not.toHaveBeenCalledWith("join_room", expect.anything(), expect.anything());
  });

  it("shows browse view with open rooms", async () => {
    const user = userEvent.setup();
    const socket = createMockSocket();
    render(<Lobby socket={socket} waitingState={null} />);

    await user.type(screen.getByLabelText(/your name/i), "Alice");
    await user.click(
      screen.getAllByRole("button", { name: "Browse open rooms" })[0]
    );

    expect(socket.emit).toHaveBeenCalledWith("request_lobby");
    expect(screen.getByRole("heading", { name: "Open Rooms" })).toBeInTheDocument();

    socket.trigger("lobby_update", [
      lobbyRoom({ roomId: "ROOM42", hostName: "Host" }),
      lobbyRoom({ roomId: "FULL01", status: "in_progress" }),
    ]);

    await waitFor(() => {
      expect(screen.getByText("Host's room")).toBeInTheDocument();
    });
    expect(screen.queryByText("FULL01")).not.toBeInTheDocument();
  });

  it("shows waiting room and start button when full", async () => {
    const socket = createMockSocket();
    const waitingState = clientGameState({
      phase: "waiting",
      players: [
        clientPlayer({ id: "p0", name: "Alice", seatIndex: 0 }),
        clientPlayer({ id: "p1", name: "Bob", seatIndex: 1 }),
        clientPlayer({ id: "p2", name: "Carol", seatIndex: 2 }),
        clientPlayer({ id: "p3", name: "Dave", seatIndex: 3 }),
      ],
    });

    render(<Lobby socket={socket} waitingState={waitingState} />);

    expect(screen.getByText("Waiting for players")).toBeInTheDocument();
    expect(screen.getByText("TEST01")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Game" })).toBeEnabled();
  });

  it("disables start until four players join", () => {
    const socket = createMockSocket();
    const waitingState = clientGameState({
      phase: "waiting",
      players: [
        clientPlayer({ id: "p0", name: "Alice", seatIndex: 0 }),
        clientPlayer({ id: "p1", name: "Bob", seatIndex: 1 }),
      ],
    });

    render(<Lobby socket={socket} waitingState={waitingState} />);

    expect(
      screen.getByRole("button", { name: /waiting for 2 more players/i })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "+ Add Bot" })).toBeInTheDocument();
  });

  it("surfaces socket errors", async () => {
    const socket = createMockSocket();
    render(<Lobby socket={socket} waitingState={null} />);

    socket.trigger("error", "Room full");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Room full");
    });
  });
});
