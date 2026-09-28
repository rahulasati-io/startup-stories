import {useEffect, useState} from 'react'
import {type DocumentActionComponent, useDocumentOperation} from 'sanity'

export const AuthorUnpublishAction: DocumentActionComponent = (props) => {
  const {unpublish} = useDocumentOperation(props.id, props.type)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)

  useEffect(() => {
    if (isUnpublishing && !props.published) {
      setIsUnpublishing(false)
    }
  }, [isUnpublishing, props.published])

  if (!props.published) return null

  return {
    disabled: Boolean(unpublish.disabled) || isUnpublishing,
    label: isUnpublishing ? 'Unpublishing…' : 'Unpublish',
    tone: 'critical',
    onHandle: () => setIsConfirming(true),
    dialog: isConfirming
      ? {
          type: 'confirm',
          tone: 'critical',
          message:
            'Unpublish this author? The profile will disappear from the public Authors directory, but its draft will remain in Sanity.',
          confirmButtonText: 'Unpublish author',
          onCancel: () => setIsConfirming(false),
          onConfirm: () => {
            setIsConfirming(false)
            setIsUnpublishing(true)
            unpublish.execute()
            props.onComplete()
          },
        }
      : null,
  }
}

