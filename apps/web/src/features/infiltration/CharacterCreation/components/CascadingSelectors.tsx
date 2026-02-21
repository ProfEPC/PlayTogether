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
      {/* Type Buttons */}
      <div className="selector type-selector">
        <label>Type:</label>
        <div className="type-buttons-row">
          {selectedType ? (
            <>
              <div className="type-selected-container">
                <div className="type-button-selected">{selectedType}</div>
                {availableTypes.length > 1 && (
                  <button
                    type="button"
                    className="reset-type-button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onTypeChange(null);
                    }}
                    title="Reset Type"
                  >
                    ✕
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="type-buttons-wrapper">
              {availableTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  className="type-button"
                  onClick={() => onTypeChange(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Item Buttons */}
      <div className="selector item-selector">
        <label>Item:</label>
        <div className="item-buttons-row">
          {selectedItem && selectedType ? (
            <>
              <div className="item-selected-container">
                <div className="item-button-selected">{selectedItem}</div>
                {availableItems.length > 1 && (
                  <button
                    type="button"
                    className="reset-item-button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onItemChange(null);
                    }}
                    title="Reset Item"
                  >
                    ✕
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="item-buttons-wrapper">
              {availableItems.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="item-button"
                  onClick={() => onItemChange(item)}
                  disabled={!selectedType}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Where Buttons */}
      <div className="selector where-selector">
        <label>Where:</label>
        <div className="where-buttons-row">
          {selectedWhere && selectedItem ? (
            <>
              <div className="where-selected-container">
                <div className="where-button-selected">{selectedWhere}</div>
                {availableWhere.length > 1 && (
                  <button
                    type="button"
                    className="reset-where-button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onWhereChange(null);
                    }}
                    title="Reset Where"
                  >
                    ✕
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="where-buttons-wrapper">
              {availableWhere.map((where) => (
                <button
                  type="button"
                  key={where}
                  className="where-button"
                  onClick={() => onWhereChange(where)}
                  disabled={!selectedItem}
                >
                  {where}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
