import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { moveOpportunityAction } from "@/app/app/[tenantSlug]/pipeline/actions";

export type BoardOpportunity = {
  id: string;
  title: string;
  value: string | null;
  status: "open" | "won" | "lost";
  contactName: string | null;
  contactId: string | null;
};

export type BoardStage = {
  id: string;
  name: string;
  opportunities: BoardOpportunity[];
};

export function PipelineBoard({
  tenantSlug,
  stages,
}: {
  tenantSlug: string;
  stages: BoardStage[];
}) {
  async function move(formData: FormData) {
    "use server";
    await moveOpportunityAction(tenantSlug, formData);
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
      {stages.map((stage) => (
        <div key={stage.id} className="rounded-lg border bg-muted/40 p-3 flex flex-col gap-2 min-h-[140px]">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold tracking-tight">{stage.name}</h3>
            <span className="text-xs text-muted-foreground">{stage.opportunities.length}</span>
          </div>
          {stage.opportunities.length === 0 ? (
            <div className="text-xs text-muted-foreground py-6 text-center border border-dashed rounded-md">
              No opportunities
            </div>
          ) : (
            stage.opportunities.map((o) => (
              <Card key={o.id} className="bg-background">
                <CardContent className="p-3 space-y-2">
                  <div className="font-medium text-sm leading-tight">{o.title}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {o.contactId ? (
                      <Link
                        href={`/app/${tenantSlug}/contacts/${o.contactId}`}
                        className="hover:underline truncate max-w-[10rem]"
                      >
                        {o.contactName ?? "—"}
                      </Link>
                    ) : (
                      <span>{o.contactName ?? "—"}</span>
                    )}
                    <span>{formatCurrency(o.value)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        o.status === "won"
                          ? "success"
                          : o.status === "lost"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {o.status}
                    </Badge>
                    <form action={move} className="flex items-center gap-1">
                      <input type="hidden" name="opportunityId" value={o.id} />
                      <select
                        name="stageId"
                        defaultValue={stage.id}
                        className="text-xs h-7 rounded-md border bg-background px-1"
                        aria-label="Move to stage"
                      >
                        {stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="text-xs h-7 px-2 rounded-md border bg-background hover:bg-accent"
                      >
                        Move
                      </button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
