import { useEffect, useState } from "react";
import {
  type DocumentActionComponent,
  useDocumentOperation,
  useValidationStatus,
} from "sanity";
import { ARTICLE_SLUG_ERROR, isValidArticleSlug } from "../../lib/article-slug.mjs";

export const ArticlePublishAction: DocumentActionComponent = (props) => {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [isPublishing, setIsPublishing] = useState(false);
  const { validation, isValidating } = useValidationStatus(props.id, props.type, true);
  const document = props.draft || props.published;
  const validSlug = isValidArticleSlug((document?.slug as { current?: unknown } | undefined)?.current);
  const blocked = !validSlug || isValidating || validation.some((marker) => marker.level === "error");

  useEffect(() => {
    if (isPublishing && !props.draft) setIsPublishing(false);
  }, [isPublishing, props.draft]);

  return {
    disabled: isPublishing || blocked || Boolean(publish.disabled),
    title: !validSlug ? ARTICLE_SLUG_ERROR : blocked ? "Resolve validation errors before publishing." : undefined,
    label: isPublishing ? "Publishing…" : "Publish",
    onHandle: () => {
      if (blocked || isPublishing || publish.disabled) return;
      const now = new Date().toISOString();
      const document = props.draft || props.published;
      const datePatch = document?.publishedAt
        ? { contentUpdatedAt: now }
        : { publishedAt: now };

      setIsPublishing(true);
      patch.execute([{ set: datePatch }]);
      publish.execute();
      props.onComplete();
    },
  };
};
