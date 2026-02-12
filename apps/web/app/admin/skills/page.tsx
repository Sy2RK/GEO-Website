import { AdminNav } from "../../../components/AdminNav";
import { AdminSkillsRunner } from "../../../components/AdminSkillsRunner";
import { apiGet } from "../../../lib/api";
import { requireEditorSession } from "../../../lib/admin";
import { resolveUiLocale } from "../../../lib/ui-locale";

export default async function AdminSkillsPage({
  searchParams
}: {
  searchParams: Promise<{ ui?: string }>;
}) {
  const { ui } = await searchParams;
  const uiLocale = resolveUiLocale(ui);
  const { token } = await requireEditorSession();
  const skills = await apiGet<{ skills: Array<{ id: string; name: string; description: string }> }>(
    "/api/skills/list",
    {
      token
    }
  );

  return (
    <div className="admin-layout">
      <AdminNav uiLocale={uiLocale} />
      <main className="admin-main">
        <AdminSkillsRunner skills={skills.skills} uiLocale={uiLocale} />
      </main>
    </div>
  );
}
