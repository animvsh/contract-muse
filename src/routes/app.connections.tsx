import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/connections")({
  component: Connections,
});

type Conn = { id: string; service_id: string; service_name: string; connected: boolean };

const LOGO_SLUGS: Record<string, string> = {
  notion: "notion",
  slack: "slack",
  gmail: "gmail",
  drive: "googledrive",
  gcal: "googlecalendar",
  gdocs: "googledocs",
  gsheets: "googlesheets",
  linear: "linear",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  hubspot: "hubspot",
  figma: "figma",
  zoom: "zoom",
  stripe: "stripe",
  salesforce: "salesforce",
  jira: "jira",
  confluence: "confluence",
  asana: "asana",
  trello: "trello",
  monday: "mondaydotcom",
  clickup: "clickup",
  airtable: "airtable",
  intercom: "intercom",
  zendesk: "zendesk",
  freshdesk: "freshworks",
  shopify: "shopify",
  outlook: "maildotru",
  teams: "microsoftteams",
  onedrive: "microsoftonedrive",
  sharepoint: "microsoftsharepoint",
  dropbox: "dropbox",
  box: "box",
  discord: "discord",
  twilio: "twilio",
  sendgrid: "minutemailer",
  mailchimp: "mailchimp",
  segment: "segment",
  mixpanel: "mixpanel",
  amplitude: "amplitude",
  posthog: "posthog",
  datadog: "datadog",
  sentry: "sentry",
  pagerduty: "pagerduty",
  okta: "okta",
  auth0: "auth0",
  pipedrive: "pipedrive",
  zoho: "zoho",
  netsuite: "oracle",
  quickbooks: "quickbooks",
  xero: "xero",
  snowflake: "snowflake",
  bigquery: "googlebigquery",
  postgres: "postgresql",
  mysql: "mysql",
  mongodb: "mongodb",
  webflow: "webflow",
  wordpress: "wordpress",
  loom: "loom",
  miro: "miro",
};

const ACCENTS: Record<string, string> = {
  notion: "oklch(0.5 0 0)",
  slack: "oklch(0.7 0.18 320)",
  gmail: "oklch(0.65 0.22 25)",
  drive: "oklch(0.7 0.18 145)",
  gcal: "oklch(0.65 0.2 250)",
  gdocs: "oklch(0.65 0.18 250)",
  gsheets: "oklch(0.7 0.18 145)",
  linear: "oklch(0.55 0.2 280)",
  github: "oklch(0.5 0 0)",
  gitlab: "oklch(0.65 0.22 35)",
  bitbucket: "oklch(0.6 0.2 250)",
  hubspot: "oklch(0.7 0.2 35)",
  figma: "oklch(0.7 0.2 25)",
  zoom: "oklch(0.6 0.2 250)",
  stripe: "oklch(0.55 0.2 280)",
  salesforce: "oklch(0.7 0.18 230)",
  jira: "oklch(0.65 0.2 250)",
  confluence: "oklch(0.6 0.2 250)",
  asana: "oklch(0.65 0.22 15)",
  trello: "oklch(0.65 0.2 250)",
  monday: "oklch(0.7 0.22 15)",
  clickup: "oklch(0.65 0.22 320)",
  airtable: "oklch(0.65 0.22 25)",
  intercom: "oklch(0.6 0.2 250)",
  zendesk: "oklch(0.55 0.18 145)",
  freshdesk: "oklch(0.65 0.22 145)",
  shopify: "oklch(0.65 0.18 145)",
  outlook: "oklch(0.55 0.2 250)",
  teams: "oklch(0.55 0.2 270)",
  onedrive: "oklch(0.55 0.2 250)",
  sharepoint: "oklch(0.55 0.2 230)",
  dropbox: "oklch(0.6 0.22 250)",
  box: "oklch(0.6 0.22 250)",
  discord: "oklch(0.6 0.2 270)",
  twilio: "oklch(0.6 0.22 25)",
  sendgrid: "oklch(0.6 0.2 250)",
  mailchimp: "oklch(0.78 0.18 90)",
  segment: "oklch(0.7 0.18 145)",
  mixpanel: "oklch(0.6 0.2 270)",
  amplitude: "oklch(0.6 0.2 250)",
  posthog: "oklch(0.7 0.2 35)",
  datadog: "oklch(0.55 0.2 280)",
  sentry: "oklch(0.5 0.18 25)",
  pagerduty: "oklch(0.65 0.22 145)",
  okta: "oklch(0.55 0.2 250)",
  auth0: "oklch(0.55 0.18 25)",
  pipedrive: "oklch(0.5 0 0)",
  zoho: "oklch(0.6 0.22 25)",
  netsuite: "oklch(0.6 0.18 35)",
  quickbooks: "oklch(0.55 0.18 145)",
  xero: "oklch(0.65 0.2 250)",
  snowflake: "oklch(0.7 0.18 230)",
  bigquery: "oklch(0.6 0.2 250)",
  postgres: "oklch(0.55 0.18 250)",
  mysql: "oklch(0.6 0.18 230)",
  mongodb: "oklch(0.6 0.18 145)",
  webflow: "oklch(0.6 0.2 250)",
  wordpress: "oklch(0.5 0.05 250)",
  loom: "oklch(0.65 0.22 320)",
  miro: "oklch(0.78 0.18 60)",
};

const DEFAULT_SERVICES: Array<{ service_id: string; service_name: string }> = [
  // Productivity & Docs
  { service_id: "notion", service_name: "Notion" },
  { service_id: "gdocs", service_name: "Google Docs" },
  { service_id: "drive", service_name: "Google Drive" },
  { service_id: "gsheets", service_name: "Google Sheets" },
  { service_id: "gcal", service_name: "Google Calendar" },
  { service_id: "confluence", service_name: "Confluence" },
  { service_id: "onedrive", service_name: "OneDrive" },
  { service_id: "sharepoint", service_name: "SharePoint" },
  { service_id: "dropbox", service_name: "Dropbox" },
  { service_id: "box", service_name: "Box" },
  // Communication
  { service_id: "slack", service_name: "Slack" },
  { service_id: "gmail", service_name: "Gmail" },
  { service_id: "outlook", service_name: "Outlook" },
  { service_id: "teams", service_name: "Microsoft Teams" },
  { service_id: "zoom", service_name: "Zoom" },
  { service_id: "discord", service_name: "Discord" },
  { service_id: "loom", service_name: "Loom" },
  // Engineering
  { service_id: "github", service_name: "GitHub" },
  { service_id: "gitlab", service_name: "GitLab" },
  { service_id: "bitbucket", service_name: "Bitbucket" },
  { service_id: "linear", service_name: "Linear" },
  { service_id: "jira", service_name: "Jira" },
  { service_id: "sentry", service_name: "Sentry" },
  { service_id: "datadog", service_name: "Datadog" },
  { service_id: "pagerduty", service_name: "PagerDuty" },
  // Project management
  { service_id: "asana", service_name: "Asana" },
  { service_id: "trello", service_name: "Trello" },
  { service_id: "monday", service_name: "Monday" },
  { service_id: "clickup", service_name: "ClickUp" },
  { service_id: "airtable", service_name: "Airtable" },
  { service_id: "miro", service_name: "Miro" },
  { service_id: "figma", service_name: "Figma" },
  // CRM & Sales
  { service_id: "hubspot", service_name: "HubSpot" },
  { service_id: "salesforce", service_name: "Salesforce" },
  { service_id: "pipedrive", service_name: "Pipedrive" },
  { service_id: "zoho", service_name: "Zoho CRM" },
  // Support
  { service_id: "intercom", service_name: "Intercom" },
  { service_id: "zendesk", service_name: "Zendesk" },
  { service_id: "freshdesk", service_name: "Freshdesk" },
  // Finance & Commerce
  { service_id: "stripe", service_name: "Stripe" },
  { service_id: "shopify", service_name: "Shopify" },
  { service_id: "quickbooks", service_name: "QuickBooks" },
  { service_id: "xero", service_name: "Xero" },
  { service_id: "netsuite", service_name: "NetSuite" },
  // Marketing & Analytics
  { service_id: "mailchimp", service_name: "Mailchimp" },
  { service_id: "sendgrid", service_name: "SendGrid" },
  { service_id: "twilio", service_name: "Twilio" },
  { service_id: "segment", service_name: "Segment" },
  { service_id: "mixpanel", service_name: "Mixpanel" },
  { service_id: "amplitude", service_name: "Amplitude" },
  { service_id: "posthog", service_name: "PostHog" },
  // Identity
  { service_id: "okta", service_name: "Okta" },
  { service_id: "auth0", service_name: "Auth0" },
  // Data
  { service_id: "snowflake", service_name: "Snowflake" },
  { service_id: "bigquery", service_name: "BigQuery" },
  { service_id: "postgres", service_name: "Postgres" },
  { service_id: "mysql", service_name: "MySQL" },
  { service_id: "mongodb", service_name: "MongoDB" },
  // Web
  { service_id: "webflow", service_name: "Webflow" },
  { service_id: "wordpress", service_name: "WordPress" },
];

function Connections() {
  const [conns, setConns] = useState<Conn[]>([]);
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const { user, loading } = useAuth();

  const load = async (uid: string) => {
    let { data, error } = await supabase
      .from("connections")
      .select("*")
      .eq("user_id", uid)
      .order("service_name");
    if (error) console.error("[connections] load error", error);
    if (!data || data.length === 0) {
      const { error: insErr } = await supabase.from("connections").upsert(
        DEFAULT_SERVICES.map((s) => ({ ...s, connected: false, user_id: uid })),
        { onConflict: "user_id,service_id", ignoreDuplicates: true },
      );
      if (insErr) console.error("[connections] seed error", insErr);
      ({ data, error } = await supabase
        .from("connections")
        .select("*")
        .eq("user_id", uid)
        .order("service_name"));
      if (error) console.error("[connections] reload error", error);
    }
    // Backfill any missing default services (e.g. older accounts seeded with fewer)
    if (data && data.length > 0 && data.length < DEFAULT_SERVICES.length) {
      const existing = new Set(data.map((c: any) => c.service_id));
      const missing = DEFAULT_SERVICES.filter((s) => !existing.has(s.service_id));
      if (missing.length > 0) {
        await supabase.from("connections").upsert(
          missing.map((s) => ({ ...s, connected: false, user_id: uid })),
          { onConflict: "user_id,service_id", ignoreDuplicates: true },
        );
        ({ data } = await supabase
          .from("connections")
          .select("*")
          .eq("user_id", uid)
          .order("service_name"));
      }
    }
    setConns((data as Conn[] | null) ?? []);
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!loading && user?.id) await load(user.id);
      if (!loading && !user?.id) setConns([]);
    };
    init();
    return () => {
      mounted = false;
    };
  }, [loading, user?.id]);

  const toggle = async (c: Conn) => {
    if (savingIds.has(c.id)) return;
    const nextConnected = !c.connected;
    setSavingIds((prev) => new Set(prev).add(c.id));
    setConns((prev) => prev.map((x) => (x.id === c.id ? { ...x, connected: nextConnected } : x)));

    const { error } = await supabase
      .from("connections")
      .update({ connected: nextConnected })
      .eq("id", c.id)
      .select("id")
      .single();

    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(c.id);
      return next;
    });

    if (error) {
      setConns((prev) => prev.map((x) => (x.id === c.id ? { ...x, connected: c.connected } : x)));
      toast.error(`Couldn't update ${c.service_name}. Try again.`);
      console.error("[connections] toggle error", error);
      return;
    }

    toast.success(`${c.service_name} ${nextConnected ? "connected" : "disconnected"}`);
  };

  const { connected, available } = useMemo(() => {
    return {
      connected: conns.filter((c) => c.connected),
      available: conns.filter((c) => !c.connected),
    };
  }, [conns]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <PageHeader
        title="Connections"
        subtitle={`${connected.length} of ${conns.length} services connected`}
      />

      {connected.length > 0 && (
        <>
          <SectionLabel>Connected</SectionLabel>
          <Grid items={connected} toggle={toggle} savingIds={savingIds} />
        </>
      )}

      <SectionLabel className="mt-10">Available</SectionLabel>
      <Grid items={available} toggle={toggle} savingIds={savingIds} />
    </div>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-3 text-xs uppercase tracking-wider text-muted-foreground ${className}`}>{children}</div>;
}

function Grid({
  items,
  toggle,
  savingIds,
}: {
  items: Conn[];
  toggle: (c: Conn) => void | Promise<void>;
  savingIds: Set<string>;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => {
        const accent = ACCENTS[c.service_id] ?? "oklch(0.5 0 0)";
        const saving = savingIds.has(c.id);
        return (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white/70 p-3.5 backdrop-blur">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground overflow-hidden">
                {LOGO_SLUGS[c.service_id] ? (
                  <img
                    src={`https://cdn.simpleicons.org/${LOGO_SLUGS[c.service_id]}`}
                    alt={c.service_name}
                    className="h-5 w-5 object-contain"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  c.service_name[0]
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{c.service_name}</div>
              <div className="text-[11px] text-muted-foreground">{c.connected ? "Connected" : "Not connected"}</div>
            </div>
            <button
              onClick={() => toggle(c)}
              disabled={saving}
              className={`flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors ${
                c.connected
                  ? "bg-primary/10 text-primary disabled:opacity-60"
                  : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
              }`}
            >
              {saving ? "Saving" : c.connected ? <><Check className="h-3 w-3" /> On</> : <><Plus className="h-3 w-3" /> Connect</>}
            </button>
          </div>
        );
      })}
    </div>
  );
}
