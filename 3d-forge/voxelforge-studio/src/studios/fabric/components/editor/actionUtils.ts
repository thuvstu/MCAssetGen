import { uid } from "@/studios/fabric/lib/mod/catalog";
import type { Action } from "@/studios/fabric/lib/mod/model";

export const cloneWithNewUids = (a: Action): Action => ({
  ...structuredClone(a), uid: uid(), ...(a.children ? { children: a.children.map(cloneWithNewUids) } : {}),
});

export function mapActions(list: Action[], fn: (a: Action) => void) {
  list.forEach((a) => { fn(a); if (a.children) mapActions(a.children, fn); });
}
