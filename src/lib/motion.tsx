"use client";

import type { ReactNode } from "react";
import { motion, type HTMLMotionProps, type MotionProps } from "framer-motion";
import { useMotionEnabled } from "@/lib/useMediaQuery";

type MotionDivProps = HTMLMotionProps<"div"> &
  Pick<
    MotionProps,
    "initial" | "animate" | "whileInView" | "transition" | "viewport" | "whileHover"
  >;

type InViewProps = Pick<
  MotionProps,
  "initial" | "animate" | "whileInView" | "transition" | "viewport"
>;

/** Marketing motion — disabled on small screens to avoid iOS viewport flicker. */
export function MotionDiv({
  initial,
  animate,
  whileInView,
  transition,
  viewport,
  whileHover,
  children,
  ...rest
}: MotionDivProps) {
  const enabled = useMotionEnabled();
  if (!enabled) {
    return <div {...(rest as React.ComponentProps<"div">)}>{children as ReactNode}</div>;
  }

  return (
    <motion.div
      initial={initial}
      animate={animate}
      whileInView={whileInView}
      transition={transition}
      viewport={viewport}
      whileHover={whileHover}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function MotionH1({
  initial,
  animate,
  whileInView,
  transition,
  viewport,
  children,
  ...rest
}: HTMLMotionProps<"h1"> & InViewProps) {
  const enabled = useMotionEnabled();
  if (!enabled) return <h1 {...(rest as React.ComponentProps<"h1">)}>{children as ReactNode}</h1>;
  return (
    <motion.h1
      initial={initial}
      animate={animate}
      whileInView={whileInView}
      transition={transition}
      viewport={viewport}
      {...rest}
    >
      {children}
    </motion.h1>
  );
}

export function MotionH2({
  initial,
  animate,
  whileInView,
  transition,
  viewport,
  children,
  ...rest
}: HTMLMotionProps<"h2"> & InViewProps) {
  const enabled = useMotionEnabled();
  if (!enabled) return <h2 {...(rest as React.ComponentProps<"h2">)}>{children as ReactNode}</h2>;
  return (
    <motion.h2
      initial={initial}
      animate={animate}
      whileInView={whileInView}
      transition={transition}
      viewport={viewport}
      {...rest}
    >
      {children}
    </motion.h2>
  );
}

export function MotionP({
  initial,
  animate,
  whileInView,
  transition,
  viewport,
  children,
  ...rest
}: HTMLMotionProps<"p"> & InViewProps) {
  const enabled = useMotionEnabled();
  if (!enabled) return <p {...(rest as React.ComponentProps<"p">)}>{children as ReactNode}</p>;
  return (
    <motion.p
      initial={initial}
      animate={animate}
      whileInView={whileInView}
      transition={transition}
      viewport={viewport}
      {...rest}
    >
      {children}
    </motion.p>
  );
}
