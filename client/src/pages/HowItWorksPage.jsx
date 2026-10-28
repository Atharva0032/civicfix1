import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Compass,
  Hammer,
  HelpCircle,
  PlusCircle,
  Send,
  ShieldCheck,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { Button, Card, CardBody, CardHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useMeta } from '../context/MetaContext';
import { STATUS_STYLES } from '../lib/constants';

const STEP_ICONS = {
  submitted: Send,
  acknowledged: CheckCircle2,
  in_progress: Hammer,
  resolved: BadgeCheck,
};

const REJECTION_ICON = XCircle;

const CITIZEN_STEPS = [
  'Create a free CivicFix account in seconds.',
  'Report a complaint with a photo and a precise map pin.',
  'Track every status change on a public timeline.',
  'Upvote and support complaints from your neighbourhood.',
  'Get notified in the app as your complaint progresses.',
];

const ADMIN_STEPS = [
  'Sign in to a protected municipal dashboard.',
  'Review submitted photos, location and complaint details.',
  'Update the status and priority as the work progresses.',
  'Assign the right department and a responsible officer.',
  'Filter and search the full complaint register.',
  'Resolve complaints, attaching a proof photo.',
  'Monitor live performance in the analytics view.',
];

const FAQS = [
  {
    question: 'Do I need an account to report an issue?',
    answer:
      'Yes — reporting requires a free account so we can send you updates and let you manage your own complaints. You can still browse and explore every complaint on the site without signing in.',
  },
  {
    question: 'How is priority decided?',
    answer:
      'Each category starts with a suggested priority based on the type of issue. The municipal team confirms the final priority based on the category and severity of the complaint, so urgent, safety-critical problems get attention first.',
  },
  {
    question: 'What happens to the photos I upload?',
    answer:
      'Your photos are stored securely and displayed on the public complaint page as evidence for the field team. They are used only to help resolve the issue and are never shared for any other purpose.',
  },
  {
    question: 'Can I edit my complaint?',
    answer:
      'Yes — you can edit or withdraw your own complaint only while it is still awaiting acknowledgement (status "Submitted"). Once it has been acknowledged, it is locked so the public record stays accurate.',
  },
  {
    question: 'How will I know when the issue is fixed?',
    answer:
      'You receive in-app notifications at every status change, and the public timeline records the resolution note along with a proof photo from the field team.',
  },
];

export default function HowItWorksPage() {
  useDocumentTitle('How It Works');

  const { statusFlow, categories } = useMeta();
  const steps = statusFlow?.length ? statusFlow : ['submitted', 'acknowledged', 'in_progress', 'resolved'];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              How CivicFix works
            </span>
            <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
              From report to repair, in four clear steps
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              CivicFix keeps the whole journey transparent. You always know where your complaint
              is, who is handling it, and what happened next.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow stepper */}
      <section className="bg-slate-50 py-14 sm:py-20" aria-labelledby="workflow-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="workflow-heading"
            className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl"
          >
            The complaint lifecycle
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">
            Every complaint moves through the same public workflow.
          </p>

          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = STEP_ICONS[step] || ClipboardList;
              const style = STATUS_STYLES[step];
              return (
                <li key={step}>
                  <Card className="relative h-full p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-700">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-display text-3xl font-extrabold text-slate-200">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-navy-900">
                      {style?.label || step}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {style?.description}
                    </p>
                  </Card>
                </li>
              );
            })}
          </ol>

          {/* Rejection */}
          <Card className="mt-5 border-rose-200">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
                <REJECTION_ICON className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  Rejected &mdash; with a reason
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-rose-700">
                  If a complaint cannot be actioned &mdash; for example a duplicate report, a
                  location outside the city, or an issue that is not the corporation&rsquo;s
                  responsibility &mdash; the reviewing officer rejects it and records a clear,
                  public reason on the complaint page. Nothing disappears silently.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* For citizens / For administrators */}
      <section className="bg-white py-14 sm:py-20" aria-labelledby="roles-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="roles-heading"
            className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl"
          >
            Built for citizens and administrators
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">
            One shared platform, with the right tools for each side of the conversation.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="For citizens"
                description="Report it, track it, and see it fixed."
                icon={UserPlus}
              />
              <CardBody>
                <ul className="space-y-3">
                  {CITIZEN_STEPS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2
                        className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent-600"
                        style={{ width: 18, height: 18 }}
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button as={Link} to="/register" leftIcon={PlusCircle}>
                    Create an account
                  </Button>
                  <Button as={Link} to="/explore" variant="outline" leftIcon={Compass}>
                    Explore Issues
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="For administrators"
                description="Review, assign, resolve and measure."
                icon={ShieldCheck}
              />
              <CardBody>
                <ul className="space-y-3">
                  {ADMIN_STEPS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2
                        className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary-600"
                        style={{ width: 18, height: 18 }}
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories routing */}
      <section className="bg-slate-50 py-14 sm:py-20" aria-labelledby="routing-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="routing-heading"
            className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl"
          >
            Where your complaint goes
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">
            Choosing a category automatically routes your complaint to the department responsible
            for fixing it.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.value}
                className="surface-muted flex items-center justify-between gap-3 p-4"
              >
                <span className="text-sm font-bold text-navy-900">{category.label}</span>
                <span className="text-right text-xs text-slate-500">
                  {category.department || 'General Administration'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-14 sm:py-20" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2
            id="faq-heading"
            className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-500">
            Everything you might want to know before you report.
          </p>

          <div className="mt-8 space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group surface overflow-hidden p-0 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-navy-900 transition hover:bg-slate-50 focus-visible:bg-slate-50">
                  {faq.question}
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-primary-800 via-primary-700 to-accent-700 px-6 py-12 text-center sm:px-12 sm:py-14">
            <div
              className="grid-pattern pointer-events-none absolute inset-0 opacity-20"
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                Ready to report your first issue?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-primary-50">
                Join your neighbours in making the city a cleaner, safer place to live.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button as={Link} to="/register" size="lg" variant="inverse" leftIcon={PlusCircle}>
                  Get started
                </Button>
                <Button as={Link} to="/explore" size="lg" variant="inverse" leftIcon={Compass}>
                  Explore Issues
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
