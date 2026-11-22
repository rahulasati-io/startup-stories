"use client";

import {useMemo, useSyncExternalStore} from "react";
import {createBrowserHistory} from "history";
import {NextStudio} from "next-sanity/studio";
import config from "../../sanity.config";
import {createStudioHistory} from "../lib/studio-history";

const subscribe = () => () => {};
export default function EmbeddedStudio() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const history = useMemo(() => mounted ? createStudioHistory(createBrowserHistory()) : undefined, [mounted]);
  if (!history) return null;
  return <NextStudio config={config} unstable_history={history} />;
}
