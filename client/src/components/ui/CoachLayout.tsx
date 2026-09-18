import { Seat, type SeatState } from './Seat';
import type { AssignedSeat, BerthType } from '@/types/domain';

const MAIN_ROWS: readonly BerthType[] = ['lower', 'middle', 'upper'];
const SIDE_ROWS: readonly BerthType[] = ['side-lower', 'side-upper'];
const BAY_COUNT = 4;

interface CoachLayoutProps {
  assignedSeat: AssignedSeat;
  selectedBerthTypes: BerthType[];
  matchBerthTypes: BerthType[];
  onToggleBerthType?: (berthType: BerthType) => void;
}

function getSeatState(
  berthType: BerthType,
  isMineCell: boolean,
  ownBerthType: BerthType,
  selected: BerthType[],
  matches: BerthType[],
): SeatState {
  if (isMineCell) return 'mine';
  if (berthType === ownBerthType) return 'unavailable';
  // A match is always a subset of your selected preference (the backend only
  // matches within it), so check it first — a real compatible passenger is a
  // stronger signal than "you want this but no one's holding it yet".
  if (matches.includes(berthType)) return 'match';
  if (selected.includes(berthType)) return 'selected';
  return 'available';
}

export function CoachLayout({
  assignedSeat,
  selectedBerthTypes,
  matchBerthTypes,
  onToggleBerthType,
}: CoachLayoutProps) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex items-stretch gap-0 rounded-lg border-2 border-ink-700 bg-white px-2 py-4">
        <CoachEndMark />
        {Array.from({ length: BAY_COUNT }, (_, bayIndex) => (
          <Bay
            key={bayIndex}
            isMineBay={bayIndex === 0}
            assignedSeat={assignedSeat}
            selectedBerthTypes={selectedBerthTypes}
            matchBerthTypes={matchBerthTypes}
            onToggleBerthType={onToggleBerthType}
          />
        ))}
        <CoachEndMark />
      </div>
    </div>
  );
}

function Bay({
  isMineBay,
  assignedSeat,
  selectedBerthTypes,
  matchBerthTypes,
  onToggleBerthType,
}: {
  isMineBay: boolean;
  assignedSeat: AssignedSeat;
  selectedBerthTypes: BerthType[];
  matchBerthTypes: BerthType[];
  onToggleBerthType?: (berthType: BerthType) => void;
}) {
  const mineIsMainRow = MAIN_ROWS.includes(assignedSeat.berthType);

  return (
    <div className="flex items-center gap-2 border-r border-dashed border-warmgray-200 px-3 first:pl-2 last:border-r-0 last:pr-2">
      <div className="flex gap-1.5">
        {[0, 1].map((column) => (
          <div key={column} className="flex flex-col gap-1.5">
            {MAIN_ROWS.map((berthType) => {
              const isMine = isMineBay && column === 0 && mineIsMainRow && berthType === assignedSeat.berthType;
              return (
                <Seat
                  key={`${column}-${berthType}`}
                  berthType={berthType}
                  seatLabel={isMine ? assignedSeat.seatNumber : undefined}
                  state={getSeatState(
                    berthType,
                    isMine,
                    assignedSeat.berthType,
                    selectedBerthTypes,
                    matchBerthTypes,
                  )}
                  onClick={onToggleBerthType ? () => onToggleBerthType(berthType) : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 border-l border-dashed border-warmgray-200 pl-2">
        {SIDE_ROWS.map((berthType) => {
          const isMine = isMineBay && !mineIsMainRow && berthType === assignedSeat.berthType;
          return (
            <Seat
              key={berthType}
              berthType={berthType}
              seatLabel={isMine ? assignedSeat.seatNumber : undefined}
              state={getSeatState(
                berthType,
                isMine,
                assignedSeat.berthType,
                selectedBerthTypes,
                matchBerthTypes,
              )}
              onClick={onToggleBerthType ? () => onToggleBerthType(berthType) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

function CoachEndMark() {
  return <div className="mx-1 w-1 shrink-0 self-stretch rounded-full bg-ink-100" aria-hidden="true" />;
}
