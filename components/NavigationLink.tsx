"use client";

import Link, {useLinkStatus} from "next/link";
import {Children, isValidElement, useState, type ComponentProps, type ReactNode} from "react";

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

// Only warm a complete public profile/article after intent, not every visible card.
// Next owns the prefetch cache and invalidation; click/history handling stays native.
export default function NavigationLink({children, loadingLabel, intentPrefetch = true, ...props}: ComponentProps<typeof Link> & {loadingLabel?: string; intentPrefetch?: boolean}) {
  const [intentHref, setIntentHref] = useState<string | null>(null);
  const href = typeof props.href === "string" ? props.href : props.href.pathname || "";
  const eligible = intentPrefetch && /^\/(companies|people|articles)\/[a-z0-9]+(?:-[a-z0-9]+)*\/?$/.test(href)
    && (!props.target || props.target === "_self") && (props.download === undefined || props.download === false);
  const activate = () => {
    if (!eligible || props.prefetch === true) return;
    const connection = typeof navigator === "undefined" ? undefined : (navigator as Navigator & {connection?: {saveData?: boolean; effectiveType?: string}}).connection;
    if (connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType || "")) return;
    setIntentHref(href);
  };
  // A caller's false still prevents viewport-wide prefetch. intentPrefetch=false
  // is the explicit opt-out for hover/focus/touch warming as well.
  const prefetch = eligible && props.prefetch !== true ? (intentHref === href ? true : false) : props.prefetch;
  const fallback = href.startsWith("/companies/") ? "company profile" : href.startsWith("/people/") ? "person profile" : href.startsWith("/articles/") ? "article" : "page";
  return <Link {...props} prefetch={prefetch} data-navigation-link="true"
    onMouseEnter={event => {props.onMouseEnter?.(event); if (!event.defaultPrevented) activate();}}
    onFocus={event => {props.onFocus?.(event); if (!event.defaultPrevented) activate();}}
    onTouchStart={event => {props.onTouchStart?.(event); if (!event.defaultPrevented) activate();}}
    onMouseLeave={event => {props.onMouseLeave?.(event); setIntentHref(null);}}
    onBlur={event => {props.onBlur?.(event); setIntentHref(null);}}
  >
    {children}
    {!href.startsWith("#") && <Pending label={loadingLabel || heading(children) || fallback} />}
  </Link>;
}
