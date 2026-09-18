import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { TrainTrack } from '@/components/ui/TrainTrack';
import { SeatSwapDiagram } from './SeatSwapDiagram';

const HOW_TO_USE = [
  {
    step: '01',
    title: 'Verify your journey',
    description: 'Enter your PNR. We pull in your train or flight, class, and the seat you were assigned.',
    detail:
      "This checks your PNR against SeatMate's own records — nothing is booked, cancelled, or changed. It just tells the app what journey and seat to match against.",
  },
  {
    step: '02',
    title: 'Set your preference',
    description: "Tell us which seat or berth type you'd actually want instead — lower, aisle, whatever it is.",
    detail:
      'Pick one or more berth types on the seat map, optionally restrict matches to your own coach, and save. You can change this any time before a swap is agreed.',
  },
  {
    step: '03',
    title: 'Find a match',
    description: 'We check everyone else confirmed on the same train or flight for a seat that fits what you want.',
    detail:
      "Matches are ranked — someone who also wants your seat back scores highest, followed by same-coach and seat-range fit. We show you why each match was suggested.",
  },
  {
    step: '04',
    title: 'Agree to swap',
    description: 'Send a request. If they accept, both seats update right away — nothing moves until they do.',
    detail:
      "The other passenger sees your request in real time and can accept or decline. Nothing about either seat changes unless they explicitly accept.",
  },
];

const SAFETY_POINTS = [
  {
    title: 'Verified journey',
    description: 'Every match is tied to a confirmed PNR on the same train or flight — not a public seat chart.',
  },
  {
    title: 'No unnecessary personal information',
    description: 'Matches show a first name and seat details. Nothing else is shared until a swap is agreed.',
  },
  {
    title: 'Explicit acceptance required',
    description: 'A swap only happens after the other passenger accepts your request. Nothing changes automatically.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Is SeatMate connected to a real railway or airline reservation system?',
    answer:
      "No. SeatMate uses a small demo PNR dataset built for this project — it isn't connected to Indian Railways, IRCTC, or any airline. It's a portfolio/demo application, not a live booking service.",
  },
  {
    question: 'Does accepting a swap change my actual ticket?',
    answer:
      "No. A swap only updates SeatMate's own record of who's sitting where, inside this app. It never modifies a real reservation — both passengers would still carry their original tickets.",
  },
  {
    question: 'What does the other passenger see about me?',
    answer:
      'Just your first name and your current seat details — coach, seat number, and berth type. Nothing else about your account is shared, and nothing is shared at all until you send or receive a request.',
  },
  {
    question: "What happens if no one else's seat fits what I want?",
    answer:
      "You'll see an honest empty state instead of a fake match — SeatMate only ever shows passengers who are (a) on your exact train/flight, date, and class, and (b) have opted in with a compatible preference of their own.",
  },
  {
    question: 'Can a swap happen without my agreement?',
    answer:
      "Never. A request only completes once the receiving passenger explicitly accepts it. Sending or receiving a request never changes a seat by itself.",
  },
  {
    question: 'Is SeatMate free to use?',
    answer:
      "Yes — it's a demo/portfolio project, not a commercial product, so there's no charge or subscription.",
  },
];

export function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="bg-stone-50">
      <LandingNavbar />
      <Hero />
      <HowToUse />
      <ExampleSwap />
      <Safety />
      <Faq />
      <Footer />
    </div>
  );
}

function LandingNavbar() {
  return (
    <header className="border-b border-warmgray-200">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-900 text-xs font-semibold text-stone-50">
            SM
          </span>
          <span className="font-serif text-lg text-ink-900">SeatMate</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium text-ink-600 sm:flex">
          <a href="#how-to-use" className="hover:text-ink-900">
            How to use
          </a>
          <a href="#safety" className="hover:text-ink-900">
            Safety
          </a>
          <a href="#faq" className="hover:text-ink-900">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-stone-100">
            Sign in
          </Link>
          <Link to="/register">
            <Button variant="accent" size="sm">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-600">
            For the journey you already booked
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-ink-900 sm:text-5xl">
            Your journey is booked.
            <br />
            Your seat doesn&apos;t have to stay.
          </h1>
          <p className="mt-5 max-w-lg text-base text-ink-600">
            SeatMate finds other passengers on your train or flight who&apos;d rather have your
            seat — and would give you theirs. Verify your PNR, say what you want, and send a swap
            request.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/register">
              <Button variant="accent" size="md">
                Check my journey
              </Button>
            </Link>
            <a href="#how-to-use">
              <Button variant="secondary" size="md">
                How it works
              </Button>
            </a>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-sm rounded-lg border border-warmgray-200 bg-white p-5">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink-400">
              Rajdhani Express 12301 · 5 Oct
            </p>
            <SeatSwapDiagram
              size="sm"
              a={{ name: 'You', coach: 'B4', seat: '32', berthType: 'side-upper', berthLabel: 'Upper' }}
              b={{ name: 'Meera K.', coach: 'B4', seat: '18', berthType: 'lower', berthLabel: 'Lower' }}
            />
          </div>
        </div>
      </div>

      <TrainTrack className="mt-14 sm:mt-20" />
    </section>
  );
}

function HowToUse() {
  const [activeStep, setActiveStep] = useState(0);
  const active = HOW_TO_USE[activeStep]!;

  return (
    <section id="how-to-use" className="border-t border-warmgray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-2xl text-ink-900">How to use SeatMate</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-500">
          Four steps, and nothing happens without the other passenger&apos;s agreement. Select a
          step for more detail.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {HOW_TO_USE.map((item, index) => {
              const isActive = index === activeStep;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  aria-pressed={isActive}
                  className={`flex items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'border-terracotta-300 bg-terracotta-50'
                      : 'border-warmgray-200 bg-white hover:border-warmgray-300 hover:bg-stone-50'
                  }`}
                >
                  <span
                    className={`font-serif text-xl ${isActive ? 'text-terracotta-600' : 'text-ink-300'}`}
                  >
                    {item.step}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">{item.title}</span>
                    <span className="mt-0.5 block text-sm text-ink-500">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            key={active.step}
            className="motion-reduce:animate-none animate-fade-in rounded-lg border border-warmgray-200 bg-stone-50 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-terracotta-600">
              Step {active.step}
            </p>
            <h3 className="mt-2 font-serif text-xl text-ink-900">{active.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{active.detail}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExampleSwap() {
  return (
    <section className="border-t border-warmgray-200">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-2xl text-ink-900">What a match looks like</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-500">
          Two passengers on the same journey, each holding the seat the other one wants. Try it —
          the button below animates the swap itself.
        </p>

        <div className="mt-8 flex justify-center rounded-lg border border-warmgray-200 bg-white px-4 py-10 sm:px-8">
          <SeatSwapDiagram
            interactive
            a={{ name: 'Passenger A', coach: 'S4', seat: '72', berthType: 'upper', berthLabel: 'Upper' }}
            b={{ name: 'Passenger B', coach: 'S4', seat: '45', berthType: 'lower', berthLabel: 'Lower' }}
          />
        </div>
      </div>
    </section>
  );
}

function Safety() {
  return (
    <section id="safety" className="border-t border-warmgray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-2xl text-ink-900">Built with a few firm limits</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-500">
          A seat swap is a small trust exchange. We keep it that way.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {SAFETY_POINTS.map((point) => (
            <div key={point.title} className="border-t border-warmgray-300 pt-4">
              <h3 className="text-sm font-semibold text-ink-900">{point.title}</h3>
              <p className="mt-1.5 text-sm text-ink-500">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-warmgray-200">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-2xl text-ink-900">Frequently asked questions</h2>
        <p className="mt-2 text-sm text-ink-500">The honest answers, not the marketing ones.</p>

        <ul className="mt-8 divide-y divide-warmgray-200 border-y border-warmgray-200">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <li key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="text-sm font-medium text-ink-900">{item.question}</span>
                  <ChevronIcon
                    className={`h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300 motion-reduce:transition-none ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-4 pr-8 text-sm leading-relaxed text-ink-500">{item.answer}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 7.5L10 12l4.5-4.5" />
    </svg>
  );
}

function Footer() {
  return (
    <footer className="border-t border-warmgray-200">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink-900 text-[10px] font-semibold text-stone-50">
            SM
          </span>
          <span className="font-serif text-base text-ink-900">SeatMate</span>
        </div>

        <nav className="flex gap-5 text-sm text-ink-500">
          <a href="#how-to-use" className="hover:text-ink-800">
            How to use
          </a>
          <a href="#safety" className="hover:text-ink-800">
            Safety
          </a>
          <a href="#faq" className="hover:text-ink-800">
            FAQ
          </a>
          <Link to="/login" className="hover:text-ink-800">
            Sign in
          </Link>
        </nav>
      </div>
      <div className="border-t border-warmgray-200 px-4 py-4 text-center text-xs text-ink-400 sm:px-6">
        SeatMate is a demo product. Journey verification uses sample data and isn&apos;t connected
        to a live railway or airline system.
      </div>
    </footer>
  );
}
