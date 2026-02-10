interface CascadingSelectorsProps {
  selectedType: string | null;
  selectedItem: string | null;
  selectedWhere: string | null;
  availableTypes: string[];
  availableItems: string[];
  availableWhere: string[];
  onTypeChange: (type: string | null) => void;
  onItemChange: (item: string | null) => void;
  onWhereChange: (where: string | null) => void;
}

export function CascadingSelectors({
  selectedType,
  selectedItem,
  selectedWhere,
  availableTypes,
  availableItems,
  availableWhere,
  onTypeChange,
  onItemChange,
  onWhereChange,
}: CascadingSelectorsProps) {
  return (
    <div className="cascading-selectors">
      {/* Type Dropdown */}
      <div className="selector">
        <label>Type:</label>
        <select
          value={selectedType || ""}
          onChange={(e) => onTypeChange(e.target.value || null)}
        >
          <option value="">-- Select Type --</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Item Dropdown */}
      <div className="selector">
        <label>Item:</label>
        <select
          value={selectedItem || ""}
          onChange={(e) => onItemChange(e.target.value || null)}
          disabled={!selectedType}
        >
          <option value="">-- Select Item --</option>
          {availableItems.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Where Dropdown */}
      <div className="selector">
        <label>Where:</label>
        <select
          value={selectedWhere || ""}
          onChange={(e) => onWhereChange(e.target.value || null)}
          disabled={!selectedItem}
        >
          <option value="">-- Select Where --</option>
          {availableWhere.map((where) => (
            <option key={where} value={where}>
              {where}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
