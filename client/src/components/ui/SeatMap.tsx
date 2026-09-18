import type { AssignedSeat, BerthType, TransportType } from '@/types/domain';
import { CoachLayout } from './CoachLayout';
import { Seat, type SeatState } from './Seat';
import { SeatLegend } from './SeatLegend';

interface SeatMapProps {
  transportType: TransportType;
  assignedSeat: AssignedSeat;
  selectedBerthTypes?: BerthType[];
  matchBerthTypes?: BerthType[];
  onToggleBerthType?: (berthType: BerthType) => void;
}

export function SeatMap({
  transportType,
  assignedSeat,
  selectedBerthTypes = [],
  matchBerthTypes = [],
  onToggleBerthType,
}: SeatMapProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-warmgray-200 bg-stone-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
        {transportType === 'train'
          ? assignedSeat.coach
            ? `Coach ${assignedSeat.coach} · schematic layout`
            : 'Coach · schematic layout'
          : 'Cabin · schematic layout'}
      </p>

      {transportType === 'train' ? (
        <CoachLayout
          assignedSeat={assignedSeat}
          selectedBerthTypes={selectedBerthTypes}
          matchBerthTypes={matchBerthTypes}
          onToggleBerthType={onToggleBerthType}
        />
      ) : (
        <CabinLayout
          assignedSeat={assignedSeat}
          selectedBerthTypes={selectedBerthTypes}
          matchBerthTypes={matchBerthTypes}
          onToggleBerthType={onToggleBerthType}
        />
      )}

      <SeatLegend />
    </div>
  );
}

const ROW_SEATS: readonly BerthType[] = ['window', 'middle', 'aisle'];
const ROW_COUNT = 4;

function getSeatState(
  berthType: BerthType,
  isMineCell: boolean,
  ownBerthType: BerthType,
  selected: BerthType[],
  matches: BerthType[],
): SeatState {
  if (isMineCell) return 'mine';
  if (berthType === ownBerthType) return 'unavailable';
  if (matches.includes(berthType)) return 'match';
  if (selected.includes(berthType)) return 'selected';
  return 'available';
}

function CabinLayout({
  assignedSeat,
  selectedBerthTypes,
  matchBerthTypes,
  onToggleBerthType,
}: {
  assignedSeat: AssignedSeat;
  selectedBerthTypes: BerthType[];
  matchBerthTypes: BerthType[];
  onToggleBerthType?: (berthType: BerthType) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1.5 rounded-lg border-2 border-ink-700 bg-white p-3">
        {Array.from({ length: ROW_COUNT }, (_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-1.5">
            {ROW_SEATS.map((berthType) => {
              const isMine = rowIndex === 0 && berthType === assignedSeat.berthType;
              return (
                <Seat
                  key={`l-${rowIndex}-${berthType}`}
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
            <div className="mx-2 h-11 w-4 border-x border-dashed border-warmgray-300" aria-hidden="true" />
            {[...ROW_SEATS].reverse().map((berthType) => (
              <Seat
                key={`r-${rowIndex}-${berthType}`}
                berthType={berthType}
                state={getSeatState(berthType, false, assignedSeat.berthType, selectedBerthTypes, matchBerthTypes)}
                onClick={onToggleBerthType ? () => onToggleBerthType(berthType) : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
