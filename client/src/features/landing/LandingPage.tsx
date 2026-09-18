import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { SeatSwapDiagram } from './SeatSwapDiagram';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Verify your journey',
    description: 'Enter your PNR. We pull in your train or flight, class, and the seat you were assigned.',
  },
  {
    step: '02',
    title: 'Set your preference',
    description: "Tell us which seat or berth type you'd actually want instead — lower, aisle, whatever it is.",
  },
  {
    step: '03',
    title: 'Find a match',
    description: 'We check everyone else confirmed on the same train or flight for a seat that fits what you want.',
  },
  {
    step: '04',
    title: 'Agree to swap',
    description: 'Send a request. If they accept, both seats update right away — nothing moves until they do.',
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

export function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="bg-stone-50">
      <LandingNavbar />
      <Hero />
      <HowItWorks />
      <ExampleSwap />
      <Safety />
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

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-600 sm:flex">
          <a href="#how-it-works" className="hover:text-ink-900">
            How it works
          </a>
          <a href="#safety" className="hover:text-ink-900">
            Safety
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
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
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
            <a href="#how-it-works">
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
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-warmgray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-2xl text-ink-900">How it works</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-500">
          Four steps, and nothing happens without the other passenger's agreement.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step}>
              <p className="font-serif text-2xl text-terracotta-500">{item.step}</p>
              <h3 className="mt-2 text-sm font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-1.5 text-sm text-ink-500">{item.description}</p>
            </div>
          ))}
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
          Two passengers on the same journey, each holding the seat the other one wants.
        </p>

        <div className="mt-8">
          <SeatSwapDiagram
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
          <a href="#how-it-works" className="hover:text-ink-800">
            How it works
          </a>
          <a href="#safety" className="hover:text-ink-800">
            Safety
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
