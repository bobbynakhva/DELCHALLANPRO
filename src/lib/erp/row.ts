export type Cell = string | number | boolean | null | Cell[] | { [key: string]: Cell };
export type Row = { [key: string]: Cell };

export function uid(context: { userId?: string } | undefined): string {
  const id = context?.userId;
  if (!id) throw new Error("Unauthorized");
  return id;
}
