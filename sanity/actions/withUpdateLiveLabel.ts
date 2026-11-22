import type {DocumentActionComponent} from "sanity";

const wrappers = new WeakMap<DocumentActionComponent, DocumentActionComponent>();

// Keep the native action and every permission/validation/handler unchanged.
export function withUpdateLiveLabel(OriginalAction: DocumentActionComponent): DocumentActionComponent {
  const existing = wrappers.get(OriginalAction);
  if (existing) return existing;
  const UpdateLiveAction: DocumentActionComponent = (props) => {
    const action = OriginalAction(props);
    if (!action || !props.published) return action;
    return {...action, label: action.label === "Publishing…" ? "Updating…" : "Update live"};
  };
  UpdateLiveAction.action = OriginalAction.action;
  UpdateLiveAction.displayName = "UpdateLiveAction";
  wrappers.set(OriginalAction, UpdateLiveAction);
  return UpdateLiveAction;
}
