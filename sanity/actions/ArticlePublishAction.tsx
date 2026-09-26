import { useEffect, useState } from "react";
import {
  type DocumentActionComponent,
  useDocumentOperation,
} from "sanity";

export const ArticlePublishAction: DocumentActionComponent = (props) => {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (isPublishing && !props.draft) setIsPublishing(false);
  }, [isPublishing, props.draft]);

  return {
    disabled: Boolean(publish.disabled),
    label: isPublishing ? "Publishing…" : "Publish",
    onHandle: () => {
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
