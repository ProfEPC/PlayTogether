import type {
  BlockerMessage,
  PowerSlot,
} from "../../../types/characterCreation";
import { INFILTRATION_POWERS } from "../../../constants/infiltrationPowers";
import { useEffect, useMemo, useState } from "react";
import {
  getAvailableTypes,
  getAvailableItems,
  getAvailableWhere,
  getAvailablePowers,
  getSelectedPower,
  getAmountError,
} from "../../../utils/characterCreation";
import { PowerDisplay } from "./components/PowerDisplay";
import { CascadingSelectors } from "./components/CascadingSelectors";
import { DisambiguationSelector } from "./components/DisambiguationSelector";
import { AmountSelector } from "./components/AmountSelector";
import { TimingSelector } from "./components/TimingSelector";
import { ModifiersSection } from "./components/ModifiersSection";

/**
 * Single Power Slot Editor Component
 */
export function PowerSlotEditor({
  slotNumber,
  slot,
  blockers,
  onChange,
  onRemove,
}: {
  slotNumber: number;
  slot: PowerSlot;
  blockers: BlockerMessage[];
  onChange: (updates: Record<string, unknown>) => void;
  onRemove: () => void;
  hasCharacterModifiers: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const selectedPower = getSelectedPower(slot);
  const isLearnOrReveal =
    selectedPower &&
    ["Learn", "Reveal"].includes(selectedPower.type) &&
    !selectedPower.fixedInitiative;
  const minAmount = selectedPower?.min ?? 0;
  const maxAmount = selectedPower?.max ?? 0;
  const allowRandom = selectedPower?.allowRandom ?? false;

  const availableTypes = getAvailableTypes({
    character: {
      name: "",
      description: "",
      team: null,
      powerSlots: [],
      infectedUponSight: false,
    },
    currentSlotNumber: slotNumber,
    powers: INFILTRATION_POWERS,
  });
  const availableItems = useMemo(
    () =>
      slot.type
        ? getAvailableItems(
            {
              character: {
                name: "",
                description: "",
                team: null,
                powerSlots: [],
                infectedUponSight: false,
              },
              currentSlotNumber: slotNumber,
              powers: INFILTRATION_POWERS,
            },
            slot.type,
          )
        : [],
    [slot.type, slotNumber],
  );
  const availableWhere = useMemo(
    () =>
      slot.type && slot.item
        ? getAvailableWhere(
            {
              character: {
                name: "",
                description: "",
                team: null,
                powerSlots: [],
                infectedUponSight: false,
              },
              currentSlotNumber: slotNumber,
              powers: INFILTRATION_POWERS,
            },
            slot.type,
            slot.item,
          )
        : [],
    [slot.type, slot.item, slotNumber],
  );
  const availablePowers = useMemo(() => {
    let powers =
      slot.type && slot.item && slot.where
        ? getAvailablePowers(
            {
              character: {
                name: "",
                description: "",
                team: null,
                powerSlots: [],
                infectedUponSight: false,
              },
              currentSlotNumber: slotNumber,
              powers: INFILTRATION_POWERS,
            },
            slot.type,
            slot.item,
            slot.where,
          )
        : [];

    // Filter out "No Action" for slots 2 and 3
    if (slotNumber > 1) {
      powers = powers.filter((p) => p.powerName !== "No Action");
    }

    return powers;
  }, [slot.type, slot.item, slot.where, slotNumber]);

  const amountError = getAmountError(selectedPower, slot.amount);
  const hasBlockers = blockers.length > 0;
  const isTypeItemWhereComplete = !!slot.type && !!slot.item && !!slot.where;
  const hasDuplicates = availablePowers.length > 1;

  // Auto-select single power
  // When Type + Item + Where are all selected and there's only one matching power,
  // automatically select it and show the power display section
  useEffect(() => {
    if (
      isTypeItemWhereComplete &&
      !selectedPower &&
      availablePowers.length === 1
    ) {
      onChange({ powerIndex: availablePowers[0].index, toggles: {} });
    }
  }, [isTypeItemWhereComplete, selectedPower, availablePowers, onChange]);

  // Auto-select single type
  // If there's only one type option available, automatically select it
  // and reset dependent fields (item, where, power)
  useEffect(() => {
    if (availableTypes.length === 1 && !slot.type) {
      onChange({
        type: availableTypes[0],
        item: null,
        where: null,
        powerIndex: null,
        toggles: {},
      });
    }
  }, [availableTypes, slot.type, onChange]);

  // Auto-select single item
  // If there's only one item option available for the selected type,
  // automatically select it and reset dependent fields (where, power)
  useEffect(() => {
    if (availableItems.length === 1 && !slot.item && slot.type) {
      onChange({
        item: availableItems[0],
        where: null,
        powerIndex: null,
        toggles: {},
      });
    }
  }, [availableItems, slot.item, slot.type, onChange]);

  // Auto-select single where
  // If there's only one "where" location option available for the selected type+item,
  // automatically select it and reset dependent field (power)
  useEffect(() => {
    if (availableWhere.length === 1 && !slot.where && slot.type && slot.item) {
      onChange({ where: availableWhere[0], powerIndex: null, toggles: {} });
    }
  }, [availableWhere, slot.where, slot.type, slot.item, onChange]);

  // Clear timing if power changes to non-Learn/Reveal or has fixed initiative
  useEffect(() => {
    if (selectedPower && slot.timing && !isLearnOrReveal) {
      onChange({ timing: null });
    }
  }, [selectedPower, isLearnOrReveal, slot.timing, onChange]);

  return (
    <div className={`power-slot ${hasBlockers ? "has-blockers" : ""}`}>
      {/* Power Display Section (at top when Type+Item+Where complete) */}
      {isTypeItemWhereComplete && selectedPower && (
        <div className="power-display-wrapper">
          <PowerDisplay
            selectedPower={selectedPower}
            hasDuplicates={hasDuplicates}
            amount={slot.amount}
            timing={slot.timing}
            toggles={slot.toggles}
            isExpanded={isExpanded}
            onExpandToggle={() => setIsExpanded(!isExpanded)}
          />
        </div>
      )}

      {/* Expanded Details - only show when expanded or no power selected */}
      {isExpanded && (
        <>
          {/* Cascading Dropdowns */}
          <CascadingSelectors
            selectedType={slot.type}
            selectedItem={slot.item}
            selectedWhere={slot.where}
            availableTypes={availableTypes}
            availableItems={availableItems}
            availableWhere={availableWhere}
            onTypeChange={(type) =>
              onChange({
                type,
                item: null,
                where: null,
                powerIndex: null,
                timing: null,
                toggles: {},
              })
            }
            onItemChange={(item) =>
              onChange({
                item,
                where: null,
                powerIndex: null,
                timing: null,
                toggles: {},
              })
            }
            onWhereChange={(where) =>
              onChange({
                where,
                powerIndex: null,
                timing: null,
                toggles: {},
              })
            }
          />

          {/* Disambiguation Selector */}
          {isTypeItemWhereComplete &&
            availablePowers.length > 1 && (
              <DisambiguationSelector
                availablePowers={availablePowers}
                slotItem={slot.item!}
                selectedPowerIndex={slot.powerIndex}
                onSelect={(powerIndex) =>
                  onChange({
                    powerIndex,
                    toggles: {},
                  })
                }
              />
            )}

          {/* Amount Selector */}
          {selectedPower && minAmount !== maxAmount && (
            <AmountSelector
              minAmount={minAmount}
              maxAmount={maxAmount}
              allowRandom={allowRandom}
              amount={slot.amount}
              error={amountError}
              onAmountChange={(amount) => onChange({ amount })}
              onAllClick={() => onChange({ amount: "ALL" })}
              isSettings={selectedPower.type === "Settings"}
              unit={
                selectedPower.type === "Settings" &&
                selectedPower.item === "Time"
                  ? "seconds"
                  : ""
              }
            />
          )}

          {/* Timing Selector */}
          {isLearnOrReveal && (
            <TimingSelector
              timing={slot.timing}
              onTimingChange={(timing) => onChange({ timing })}
            />
          )}

          {/* Modifiers Section */}
          {selectedPower && (
            <ModifiersSection
              selectedPower={selectedPower}
              toggles={slot.toggles}
              onToggleChange={(toggleName, checked) =>
                onChange({
                  toggles: { ...slot.toggles, [toggleName]: checked },
                })
              }
            />
          )}

          {/* Remove Button - only show when expanded */}
          {/* Show for slot 1 only if power is selected, show for slots 2+ always */}
          {(slotNumber > 1 || selectedPower) && (
            <button
              className="remove-button remove-button-bottom"
              onClick={onRemove}
            >
              Remove Slot
            </button>
          )}
        </>
      )}
    </div>
  );
}
