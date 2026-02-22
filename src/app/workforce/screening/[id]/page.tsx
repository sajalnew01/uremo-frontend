import ScreeningRunner from "./ScreeningRunner";

export default async function WorkforceScreeningPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ positionId?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) || {};
  const positionId = typeof sp.positionId === "string" ? sp.positionId : null;

  return <ScreeningRunner screeningId={id} positionId={positionId} />;
}
