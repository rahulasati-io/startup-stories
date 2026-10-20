"use client";
import {useEffect, useState} from "react";
import {Box, Select, Stack, Text} from "@sanity/ui";
import {set, unset, useClient, useFormValue, type StringInputProps} from "sanity";
import {findIndustry} from "../../lib/industry-taxonomy.mjs";

export function SubIndustryInput(props: StringInputProps) {
  const id = useFormValue(["industryCategory", "_ref"]);
  const client = useClient({apiVersion: "2026-08-23"});
  const [result, setResult] = useState<{id: string; slug: string; error: string} | null>(null);
  const loading = typeof id === "string" && result?.id !== id;
  const slug = result?.id === id ? result?.slug || "" : "";
  const error = result?.id === id ? result?.error || "" : "";
  useEffect(() => {
    const controller = new AbortController();
    if (typeof id !== "string") return () => controller.abort();
    client.fetch<string | null>(`*[_type == "industry" && _id == $id][0].slug.current`, {id}, {signal: controller.signal})
      .then(value => {if (!controller.signal.aborted) setResult({id, slug: value || "", error: ""});})
      .catch(() => {if (!controller.signal.aborted) setResult({id, slug: "", error: "Could not load the industry's sub-industries. Reopen this document to retry."});});
    return () => controller.abort();
  }, [client, id]);
  const category = findIndustry(slug);
  const invalid = props.value && !category?.subIndustries.includes(props.value);
  return <Stack space={3}>
    <Select {...props.elementProps} value={props.value || ""} disabled={props.readOnly || loading || !category} onChange={event => props.onChange(event.currentTarget.value ? set(event.currentTarget.value) : unset())}>
      <option value="">{loading ? "Loading sub-industries…" : "Select sub-industry"}</option>
      {invalid && <option value={props.value}>{props.value} (choose a matching option)</option>}
      {category?.subIndustries.map((name: string) => <option key={name} value={name}>{name}</option>)}
    </Select>
    {!id && <Text muted size={1}>Select an Industry first.</Text>}
    {error && <Box><Text size={1}>{error}</Text></Box>}
    {Boolean(id) && !loading && !category && !error && <Text size={1}>Choose an approved Industry before selecting a sub-industry.</Text>}
    {invalid && category && <Text size={1}>This value belongs to another industry. Select a valid option before publishing.</Text>}
  </Stack>;
}
