import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

const MOTION_PROP_KEYS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "whileHover",
  "whileTap",
  "layoutId",
]);

function motionComponent(tag: string) {
  return React.forwardRef(function MotionComponent(
    props: React.PropsWithChildren<Record<string, unknown>>,
    ref: React.Ref<HTMLElement>
  ) {
    const { children, ...rest } = props;
    const domProps = Object.fromEntries(
      Object.entries(rest).filter(([key]) => !MOTION_PROP_KEYS.has(key))
    );
    return React.createElement(tag, { ...domProps, ref }, children);
  });
}

const motion = new Proxy(
  {},
  {
    get: (_target, prop: string) => motionComponent(prop),
  }
);

vi.mock("framer-motion", () => ({
  motion,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement("a", { href, ...props }, children),
}));

export const navigationMock = { pathname: "/" };

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
}));
