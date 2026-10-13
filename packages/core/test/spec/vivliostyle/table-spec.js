/**
 * Copyright 2026 Vivliostyle Foundation
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as layout from "../../../src/vivliostyle/layout";
import * as table from "../../../src/vivliostyle/table";
import * as vtree from "../../../src/vivliostyle/vtree";

describe("table", function () {
  describe("row overflow from cell layout constraints", function () {
    var formattingContext, column, strategy, rowContext, checkPoint, cell;

    beforeEach(function () {
      var sourceTable = document.createElement("table");
      var sourceRow = document.createElement("tr");
      var sourceCell = document.createElement("td");
      sourceTable.appendChild(sourceRow);
      sourceRow.appendChild(sourceCell);
      formattingContext = new table.TableFormattingContext(null, sourceTable);
      formattingContext.addRow(0, new table.TableRow(0, sourceRow));
      formattingContext.addCell(0, 0, sourceCell);
      cell = formattingContext.getRowByIndex(0).cells[0];
      rowContext = new vtree.NodeContext(sourceRow, null, 0, formattingContext);
      rowContext.display = "table-row";
      rowContext.inline = false;
      rowContext.after = true;
      rowContext.viewNode = sourceRow;
      checkPoint = new vtree.NodeContext(
        document.createTextNode("Cell text"),
        rowContext,
        1,
        formattingContext,
      );
      checkPoint.overflow = true;
      var layoutConstraint = {
        allowLayout: jasmine.createSpy("allowLayout").and.returnValue(false),
      };
      column = {
        stopAtOverflow: true,
        breakPositions: [],
        checkOverflowAndSaveEdge: jasmine
          .createSpy("checkOverflowAndSaveEdge")
          .and.returnValue(false),
        layoutConstraint: layoutConstraint,
        nodeContextOverflowingDueToRepetitiveElements: null,
      };
      formattingContext.addCellFragment(0, 0, {
        pseudoColumn: {
          getColumn: function () {
            return {
              breakPositions: [new layout.BoxBreakPosition([checkPoint], 0)],
              layoutConstraint: layoutConstraint,
            };
          },
        },
      });
      strategy = new table.TableLayoutStrategy(formattingContext, column);
      strategy.currentRowIndex = 0;
    });

    function finishRow() {
      var state = {
        nodeContext: rowContext,
        onStartEdges: false,
        break: false,
      };
      strategy.afterNonInlineElementNode(state).get();
      return state;
    }

    it("stops a geometrically fitting row when a cell checkpoint violates a constraint", function () {
      var state = finishRow();

      expect(column.checkOverflowAndSaveEdge).toHaveBeenCalledWith(
        rowContext,
        null,
      );
      expect(rowContext.overflow).toBe(true);
      expect(state.break).toBe(true);
      expect(column.stopAtOverflow).toBe(true);
    });

    it("keeps rendering a spanning row when checkpoint overflow is only geometric", function () {
      cell.rowSpan = 2;
      column.layoutConstraint.allowLayout.and.returnValue(true);

      var state = finishRow();

      expect(rowContext.overflow).toBe(false);
      expect(state.break).toBe(false);
      expect(column.stopAtOverflow).toBe(false);
    });
  });
});
