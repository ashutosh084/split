"use client";

interface Props {
  userId: string;
  userName: string;
  amountOwed: string;
  splitMode: "equal" | "custom";
  isSelf: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onAmountChange: (value: string) => void;
}

/**
 * Single split participant row.
 * - Self row: always visible with checkbox + "(you)"; amount shown only when selected.
 * - Friend row: shown only when selected, with "✕" to remove.
 */
export function SplitRow({
  userId,
  userName,
  amountOwed,
  splitMode,
  isSelf,
  isSelected,
  onToggle,
  onAmountChange,
}: Props) {
  return (
    <div
      key={userId}
      className={`split-row ${isSelected ? "split-row-selected" : "split-row-unselected"}`}
      onClick={onToggle}
    >
      {isSelf ? (
        <>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="rounded accent-tac-accent"
          />
          <span className="text-xs flex-1 font-mono">
            {userName}{" "}
            <span className="text-[10px] text-tac-accent font-mono ml-1">
              (you)
            </span>
          </span>
        </>
      ) : (
        <>
          <span className="text-[10px] text-tac-accent font-mono mr-1 cursor-pointer select-none">
            ✕
          </span>
          <span className="text-xs flex-1 font-mono truncate">{userName}</span>
        </>
      )}

      {isSelected && (
        <input
          type="number"
          step="0.01"
          min="0.01"
          className={`input-tactical w-24 text-[10px] py-1 ${splitMode === "equal" ? "opacity-60" : ""}`}
          value={amountOwed}
          onChange={(e) => {
            e.stopPropagation();
            onAmountChange(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          placeholder="0.00"
          readOnly={splitMode === "equal"}
          required
        />
      )}
    </div>
  );
}
