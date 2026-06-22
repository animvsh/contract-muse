import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, StepList, CopyBlock, NextSteps } from "@/components/docs-shell";

const PROMPT = `Build an agent for my bookstore that summarizes books sold last week and yesterday's revenue every morning.`;

const SAMPLE = `Yesterday's Revenue
Total revenue: $1,284.50
Books sold: 73
Average order value: $24.22

Top Books Sold Yesterday
1. Atomic Habits — 8 copies — $159.92
2. The Alchemist — 6 copies — $83.94
3. Fourth Wing — 5 copies — $149.95

Revenue by Category
Fiction: $482.10
Self-help: $321.80
Children's: $204.50
Nonfiction: $276.10

Last Week's Sales
Total books sold: 412
Total revenue: $7,932.40

Notable Insight
Self-help books were up 18% vs. the previous week.`;

export const Route = createFileRoute("/docs/examples/bookstore-sales-agent")({
  head: () => ({
    meta: [
      { title: "Bookstore Sales Agent — Beevr Docs" },
      {
        name: "description",
        content: "End-to-end example: turn a sentence into a hosted Beevr agent that emails you bookstore sales every morning.",
      },
    ],
  }),
  component: Example,
});

function Example() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Example"
        title="Bookstore Sales Summary Agent"
        lead="A worked example: from a single chat message to a tested, hosted, daily-running cloud agent."
      />

      <DocsSection title="The prompt">
        <CopyBlock label="Type into Beevr Home" code={PROMPT} />
      </DocsSection>

      <DocsSection title="What Beevr does">
        <StepList
          steps={[
            "Detects this is a bookstore reporting agent that needs sales data.",
            "Finds connected sources (Book Sales Sheet, Stripe, Inventory Sheet).",
            "Proposes column mapping — title, sold_at, qty, total, genre.",
            "Drafts a daily 8:00 AM schedule with a chat-summary output.",
            "Builds in cloud, runs tests against yesterday's sales.",
            "Shows a preview summary for approval.",
            "On activate, hosts the agent and starts the schedule.",
          ]}
        />
      </DocsSection>

      <DocsSection title="Sample preview output">
        <CopyBlock label="Generated preview" code={SAMPLE} />
      </DocsSection>

      <DocsSection title="Edit it through chat">
        <p className="text-sm">
          Say <em>"add top 5 authors from last week"</em>. Beevr finds author info in the Inventory Sheet,
          updates the agent, re-tests, and asks you to confirm before applying.
        </p>
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/cloud-builds/agents", label: "Build agents in cloud" },
          { to: "/docs/approvals", label: "Approval flow" },
          { to: "/docs/examples", label: "More examples" },
          { to: "/docs/quickstart", label: "Quickstart" },
        ]}
      />
    </DocsShell>
  );
}
