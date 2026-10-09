import { useEffect, useState } from "react";
import {
  type DocumentActionComponent,
  useDocumentOperation,
  useValidationStatus,
} from "sanity";
import { ARTICLE_SLUG_ERROR, isValidArticleSlug } from "../../lib/article-slug.mjs";

type PublishableArticle = {
  title?: unknown;
  slug?: {current?: unknown};
  body?: unknown;
  category?: {_ref?: unknown};
  author?: {_ref?: unknown};
  seoDescription?: unknown;
  publishedAt?: unknown;
};

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasReference(value: unknown) {
  return Boolean(value && typeof value === "object" && hasText((value as {_ref?: unknown})._ref));
}

function hasArticleBody(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.some((block) => {
    if (!block || typeof block !== "object") return false;
    if ((block as {_type?: unknown})._type !== "block") return true;
    const children = (block as {children?: unknown}).children;
    return Array.isArray(children) && children.some((child) =>
      child && typeof child === "object" && hasText((child as {text?: unknown}).text),
    );
  });
}

function isReadyToPublish(document: PublishableArticle | null | undefined) {
  return Boolean(
    document &&
    hasText(document.title) &&
    isValidArticleSlug(document.slug?.current) &&
    hasArticleBody(document.body) &&
    hasReference(document.category) &&
    hasReference(document.author) &&
    hasText(document.seoDescription),
  );
}

export const ArticlePublishAction: DocumentActionComponent = (props) => {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [isPublishing, setIsPublishing] = useState(false);
  const { validation, isValidating } = useValidationStatus(props.id, props.type, true);
  const document = (props.draft || props.published) as PublishableArticle | null;
  const validSlug = isValidArticleSlug((document?.slug as { current?: unknown } | undefined)?.current);
  const blocked = !validSlug || isValidating || validation.some((marker) => marker.level === "error");

  useEffect(() => {
    if (isPublishing && !props.draft) setIsPublishing(false);
  }, [isPublishing, props.draft]);

  if (!props.draft || !isReadyToPublish(document) || blocked) return null;

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
