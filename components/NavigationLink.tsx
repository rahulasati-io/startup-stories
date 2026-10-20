"use client";

import Link, {useLinkStatus} from "next/link";
import {Children, isValidElement, type ComponentProps, type ReactNode} from "react";

function text(node: ReactNode): string {
  return Children.toArray(node).map(child => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    return isValidElement<{children?: ReactNode}>(child) ? text(child.props.children) : "";
  }).join(" ").trim();
}

function heading(node: ReactNode): string {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{children?: ReactNode}>(child)) continue;
    if (["h2", "h3", "h4"].includes(String(child.type))) return text(child.props.children);
    const label = heading(child.props.children);
    if (label) return label;
  }
  return "";
}

function Pending({label}: {label: string}) {
  const {pending} = useLinkStatus();
  return pending ? <span className="navigation-link-status" role="status">
    <span className="navigation-spinner" aria-hidden="true" />
    <span>Opening {label}…</span>
  </span> : null;
}

// Keeps normal Next.js navigation, prefetch choices, modifiers and Back behavior.
export default function NavigationLink({children, loadingLabel, ...props}: ComponentProps<typeof Link> & {loadingLabel?: string}) {
  const href = typeof props.href === "string" ? props.href : props.href.pathname || "";
  const fallback = href.startsWith("/companies/") ? "company profile" : href.startsWith("/people/") ? "person profile" : href.startsWith("/articles/") ? "article" : "page";
  return <Link {...props} data-navigation-link="true">
    {children}
    {!href.startsWith("#") && <Pending label={loadingLabel || heading(children) || fallback} />}
  </Link>;
}
