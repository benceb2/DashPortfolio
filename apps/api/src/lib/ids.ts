import { ulid } from "ulid";

const prefixes = {
  user: "usr",
  inviteToken: "inv",
  asset: "ast",
  holding: "hld",
  priceCandle: "prc",
  snapshot: "snp",
  customAsset: "cst",
} as const;

type Entity = keyof typeof prefixes;

export function generateId(entity: Entity): string {
  return `${prefixes[entity]}_${ulid().toLowerCase()}`;
}
