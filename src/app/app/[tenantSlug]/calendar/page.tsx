import { requireTenantAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function CalendarPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const { tenant } = await requireTenantAccess(params.tenantSlug);
  const appointments = await prisma.appointment.findMany({
    where: { tenantId: tenant.id },
    orderBy: { startsAt: "asc" },
    include: { contact: true },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Appointment scheduling — full booking UI lands in a later phase."
      />

      {appointments.length === 0 ? (
        <EmptyState
          title="No appointments yet"
          description="Appointment records will appear here. Two-way Google Calendar sync is planned for Phase 5."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {appointments.map((a) => (
                <li key={a.id} className="py-2 flex justify-between">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-muted-foreground">{formatDate(a.startsAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
